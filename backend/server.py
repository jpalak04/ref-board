from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import requests
from bs4 import BeautifulSoup
import json
import re
import os
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

try:
    from google import genai
    GEMINI_CLIENT = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_CLIENT = None
    GEMINI_AVAILABLE = False

app = FastAPI(title="RefBoard API v2")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


def gemini(prompt: str) -> str:
    resp = GEMINI_CLIENT.models.generate_content(model="gemini-2.0-flash", contents=prompt)
    return resp.text.strip()


def detect_type(url: str) -> str:
    u = url.lower()
    if any(x in u for x in ["/reel", "/reels/", "/stories/", "tiktok.com", "youtube.com/watch", "youtu.be", "vimeo.com"]):
        return "reel"
    if any(x in u for x in [".jpg", ".jpeg", ".png", ".gif", ".webp", "instagram.com/p/"]):
        return "image"
    return "link"


class OGRequest(BaseModel):
    url: str


class AIAutofillRequest(BaseModel):
    url: str
    title: Optional[str] = None
    description: Optional[str] = None
    categories: List[dict]


class SimilarIdeasRequest(BaseModel):
    ref_id: str
    title: str
    description: Optional[str] = None
    tags: List[str] = []
    cat_id: Optional[str] = None
    candidates: List[dict]


class DigestRequest(BaseModel):
    refs: List[dict]
    categories: List[dict]


@app.get("/api/health")
async def health():
    return {"status": "ok", "gemini": GEMINI_AVAILABLE and bool(GEMINI_API_KEY)}


@app.post("/api/fetch-og")
async def fetch_og(req: OGRequest):
    try:
        headers = {"User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)"}
        resp = requests.get(req.url, headers=headers, timeout=12, allow_redirects=True)
        soup = BeautifulSoup(resp.text, "lxml")

        def get_meta(prop=None, name=None):
            tag = soup.find("meta", property=prop) if prop else soup.find("meta", attrs={"name": name})
            return (tag.get("content") or "").strip() if tag else ""

        title = get_meta(prop="og:title") or get_meta(name="twitter:title") or (soup.title.string.strip() if soup.title else "")
        description = get_meta(prop="og:description") or get_meta(name="twitter:description") or get_meta(name="description")
        image = get_meta(prop="og:image") or get_meta(name="twitter:image")
        video = get_meta(prop="og:video") or get_meta(prop="og:video:url")
        content_type = detect_type(req.url)
        if video or "video" in (get_meta(prop="og:type") or "").lower():
            content_type = "reel"

        return {"title": title[:200], "description": description[:600], "image": image or None, "type": content_type}
    except Exception as e:
        return {"title": "", "description": "", "image": None, "type": "link", "error": str(e)}


@app.post("/api/ai-autofill")
async def ai_autofill(req: AIAutofillRequest):
    empty = {"content_type": "link", "cat_id": None, "subcat": None, "tags": [], "action_tag": "inspiration"}
    if not GEMINI_AVAILABLE or not GEMINI_CLIENT:
        return empty
    try:
        cats = json.dumps([{"id": c["id"], "name": c["name"], "subs": c.get("subs", [])} for c in req.categories], indent=2)
        prompt = f"""Analyze this URL for a creative reference library. Return JSON only.

URL: {req.url}
Title: {req.title or "Unknown"}
Description: {(req.description or "")[:400]}

Categories:
{cats}

Return:
- content_type: "reel" (video/reel/story), "image" (photo/gallery), "note" (article/text), "link" (default)
- cat_id: exact ID from categories list above
- subcat: exact sub-category string from that category's subs list  
- tags: array of exactly 3 short searchable keywords (e.g. ["luxury packaging", "minimal design", "brand identity"])
- action_tag: "to_execute" if team should act on this, "inspiration" if reference only

Return ONLY valid JSON:
{{"content_type":"link","cat_id":"...","subcat":"...","tags":["...","...","..."],"action_tag":"inspiration"}}"""

        text = gemini(prompt)
        # Try direct parse first, then regex extract
        try:
            result = json.loads(text)
        except Exception:
            m = re.search(r'\{.*\}', text, re.DOTALL)
            result = json.loads(m.group()) if m else {}

        result.setdefault("content_type", "link")
        result.setdefault("tags", [])
        result.setdefault("action_tag", "inspiration")
        if not isinstance(result.get("tags"), list):
            result["tags"] = []
        return result
    except Exception as e:
        return {**empty, "error": str(e)}


@app.post("/api/similar-ideas")
async def similar_ideas(req: SimilarIdeasRequest):
    if not GEMINI_AVAILABLE or not GEMINI_CLIENT:
        return {"similar": []}
    try:
        all_c = [c for c in req.candidates if c.get("id") != req.ref_id]
        if not all_c:
            return {"similar": []}

        # Pre-filter: same category + shared tags first
        same_cat = [c for c in all_c if c.get("cat_id") == req.cat_id]
        shared = [c for c in all_c if any(t in c.get("tags", []) for t in req.tags)]
        pool, seen = [], set()
        for c in same_cat + shared + all_c:
            if c["id"] not in seen:
                seen.add(c["id"])
                pool.append(c)
            if len(pool) >= 20:
                break

        lines = "\n".join(
            f'[{c["id"]}] {c.get("title","")[:60]} | tags: {", ".join(c.get("tags",[])[:3])} | cat: {c.get("cat_id","")}'
            for c in pool
        )
        prompt = f"""Find the 3 most thematically similar references to the target.

TARGET: "{req.title}"
Tags: {", ".join(req.tags[:5])}
Category: {req.cat_id}

CANDIDATES:
{lines}

Return ONLY a JSON array of exactly 3 IDs (use the exact IDs shown in brackets): ["id1", "id2", "id3"]"""

        text = gemini(prompt)
        m = re.search(r'\[.*?\]', text, re.DOTALL)
        if m:
            ids = json.loads(m.group())
            valid = [str(i) for i in ids if any(c["id"] == str(i) for c in pool)]
            return {"similar": valid[:3]}
        return {"similar": []}
    except Exception as e:
        return {"similar": [], "error": str(e)}


@app.post("/api/weekly-digest")
async def weekly_digest(req: DigestRequest):
    if not req.refs:
        return {"summary": "Nothing saved this week yet.", "by_category": [], "total": 0}
    try:
        cat_map = {c["id"]: c for c in req.categories}
        grouped: dict = {}
        for ref in req.refs:
            cid = ref.get("cat_id") or "other"
            if cid not in grouped:
                grouped[cid] = {"name": cat_map.get(cid, {}).get("name", "Other"), "refs": []}
            grouped[cid]["refs"].append(ref)

        by_cat = [
            {"cat_id": cid, "cat_name": d["name"], "count": len(d["refs"]),
             "top_refs": d["refs"][:3], "color": cat_map.get(cid, {}).get("color", "lime")}
            for cid, d in sorted(grouped.items(), key=lambda x: -len(x[1]["refs"]))
        ]
        total = len(req.refs)
        summary = f"{total} reference{'s' if total != 1 else ''} saved this week."

        if GEMINI_AVAILABLE and GEMINI_CLIENT:
            titles = "\n".join(f"- {r.get('title','untitled')}" for r in req.refs[:15])
            try:
                summary = gemini(
                    f"Write a 2-sentence inspiring digest for a creative team who saved {total} references this week:\n{titles}\n"
                    "Keep under 50 words. No markdown. Focus on themes and momentum."
                )
            except Exception:
                pass

        return {"summary": summary, "by_category": by_cat, "total": total}
    except Exception as e:
        return {"summary": "Could not generate digest.", "by_category": [], "total": 0, "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
