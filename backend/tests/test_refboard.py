"""RefBoard API tests - health, fetch-og, ai-autofill endpoints"""
import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')


@pytest.fixture
def client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestHealth:
    """Health check endpoint"""

    def test_health_returns_ok(self, client):
        resp = client.get(f"{BASE_URL}/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("status") == "ok"

    def test_health_has_gemini_field(self, client):
        resp = client.get(f"{BASE_URL}/api/health")
        data = resp.json()
        assert "gemini" in data
        print(f"Gemini available: {data['gemini']}")


class TestFetchOG:
    """OG metadata fetch endpoint"""

    def test_fetch_og_valid_url(self, client):
        resp = client.post(f"{BASE_URL}/api/fetch-og", json={"url": "https://www.figma.com"})
        assert resp.status_code == 200
        data = resp.json()
        assert "title" in data
        assert "description" in data
        assert "type" in data
        print(f"OG title: {data.get('title')}")

    def test_fetch_og_returns_image_field(self, client):
        resp = client.post(f"{BASE_URL}/api/fetch-og", json={"url": "https://www.figma.com"})
        data = resp.json()
        assert "image" in data  # can be None or string

    def test_fetch_og_type_field_valid(self, client):
        resp = client.post(f"{BASE_URL}/api/fetch-og", json={"url": "https://www.figma.com"})
        data = resp.json()
        assert data["type"] in ["link", "reel", "image", "note"]

    def test_fetch_og_youtube_type_reel(self, client):
        resp = client.post(f"{BASE_URL}/api/fetch-og", json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["type"] == "reel"


class TestAIAutofill:
    """AI autofill endpoint using Gemini"""

    CATEGORIES = [
        {"id": "cat-1", "name": "Products", "subs": ["SaaS", "Apps", "Hardware"]},
        {"id": "cat-2", "name": "Design", "subs": ["UI", "Motion", "Branding"]},
        {"id": "cat-3", "name": "AI Tools", "subs": ["LLMs", "Image", "Video"]},
    ]

    def test_ai_autofill_returns_200(self, client):
        resp = client.post(f"{BASE_URL}/api/ai-autofill", json={
            "url": "https://www.figma.com",
            "title": "Figma: The Collaborative Interface Design Tool",
            "description": "Design, prototype, and gather feedback all in one place.",
            "categories": self.CATEGORIES
        })
        assert resp.status_code == 200

    def test_ai_autofill_has_required_fields(self, client):
        resp = client.post(f"{BASE_URL}/api/ai-autofill", json={
            "url": "https://www.figma.com",
            "title": "Figma",
            "description": "Design tool",
            "categories": self.CATEGORIES
        })
        data = resp.json()
        assert "content_type" in data
        assert "cat_id" in data
        assert "subcat" in data
        print(f"AI result: {data}")

    def test_ai_autofill_content_type_valid(self, client):
        resp = client.post(f"{BASE_URL}/api/ai-autofill", json={
            "url": "https://www.figma.com",
            "title": "Figma",
            "description": "Design tool",
            "categories": self.CATEGORIES
        })
        data = resp.json()
        if data.get("content_type"):
            assert data["content_type"] in ["link", "reel", "image", "note"]
