from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import requests
from bs4 import BeautifulSoup
import json
import re
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

try:
    from google import genai
    from google.genai import types as genai_types
    GEMINI_CLIENT = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_CLIENT = None
    GEMINI_AVAILABLE = False

app = FastAPI(title="RefBoard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class OGRequest(BaseModel):
    url: str


class AIAutofillRequest(BaseModel):
    url: str
    title: Optional[str] = None
    description: Optional[str] = None
    categories: List[dict]


def detect_type_from_url(url: str) -> str:
    url_lower = url.lower()
    if any(x in url_lower for x in ["/reel", "/reels/", "/stories/", "tiktok.com", "youtube.com/watch", "youtu.be", "vimeo.com"]):
        return "reel"
    if any(x in url_lower for x in [".jpg", ".jpeg", ".png", ".gif", ".webp", "instagram.com/p/"]):
        return "image"
    return "link"


@app.get("/api/health")
async def health():
    return {"status": "ok", "gemini": GEMINI_AVAILABLE and bool(GEMINI_API_KEY)}


@app.post("/api/fetch-og")
async def fetch_og(request: OGRequest):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
        }
        resp = requests.get(request.url, headers=headers, timeout=12, allow_redirects=True)
        soup = BeautifulSoup(resp.text, "lxml")

        def get_meta(prop=None, name=None):
            if prop:
                tag = soup.find("meta", property=prop) or soup.find("meta", attrs={"property": prop})
            else:
                tag = soup.find("meta", attrs={"name": name})
            return (tag.get("content") or "").strip() if tag else ""

        title = (
            get_meta(prop="og:title")
            or get_meta(name="twitter:title")
            or get_meta(name="title")
            or (soup.title.string.strip() if soup.title else "")
        )
        description = (
            get_meta(prop="og:description")
            or get_meta(name="twitter:description")
            or get_meta(name="description")
        )
        image = (
            get_meta(prop="og:image")
            or get_meta(name="twitter:image")
            or get_meta(name="twitter:image:src")
        )
        video = get_meta(prop="og:video") or get_meta(prop="og:video:url")

        content_type = detect_type_from_url(request.url)
        if video:
            content_type = "reel"
        og_type = get_meta(prop="og:type")
        if og_type and "video" in og_type.lower():
            content_type = "reel"

        return {
            "title": title[:200] if title else "",
            "description": description[:600] if description else "",
            "image": image or None,
            "type": content_type,
        }
    except Exception as e:
        return {"title": "", "description": "", "image": None, "type": "link", "error": str(e)}


@app.post("/api/ai-autofill")
async def ai_autofill(request: AIAutofillRequest):
    if not GEMINI_AVAILABLE or not GEMINI_CLIENT:
        return {"content_type": "link", "cat_id": None, "subcat": None, "error": "Gemini not configured"}

    try:
        cats_summary = json.dumps(
            [{"id": c["id"], "name": c["name"], "subs": c.get("subs", [])} for c in request.categories],
            indent=2
        )

        prompt = f"""You are a creative reference library assistant. Analyze this content and match it to the best category.

URL: {request.url}
Title: {request.title or "Unknown"}
Description: {request.description or ""}

Available categories:
{cats_summary}

Determine:
1. content_type: "reel" (videos/reels/stories/TikTok), "image" (image gallery/photos/lookbook), "note" (articles/text documents), "link" (everything else)
2. cat_id: EXACTLY one ID from above (pick the most semantically relevant)
3. subcat: EXACTLY one sub-category string from the chosen category's subs list

Respond ONLY with valid compact JSON, no markdown:
{{"content_type": "link", "cat_id": "...", "subcat": "..."}}"""

        response = GEMINI_CLIENT.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        result_text = response.text.strip()

        json_match = re.search(r'\{[^{}]+\}', result_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())

        return {"content_type": "link", "cat_id": None, "subcat": None}
    except Exception as e:
        return {"content_type": "link", "cat_id": None, "subcat": None, "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
