from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager

from models.text_embedder import TextEmbedder
from models.image_embedder import ImageEmbedder
from services.matcher import MatcherService


# Global model instances
text_embedder = None
image_embedder = None
matcher_service = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models on startup."""
    global text_embedder, image_embedder, matcher_service
    print("=" * 50)
    print("Loading ML models...")
    print("=" * 50)
    text_embedder = TextEmbedder()
    image_embedder = ImageEmbedder()
    matcher_service = MatcherService(text_embedder, image_embedder)
    print("=" * 50)
    print("All models loaded. Service ready!")
    print("=" * 50)
    yield
    print("Shutting down ML service...")


app = FastAPI(
    title="Smart Lost & Found - ML Service",
    description="AI-powered matching service for lost and found items",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request/Response Models ───────────────────────────────────────────

class TextEmbedRequest(BaseModel):
    text: str

class TextEmbedResponse(BaseModel):
    embedding: list[float]

class ImageEmbedRequest(BaseModel):
    image_url: str

class ImageEmbedResponse(BaseModel):
    embedding: list[float]

class ItemData(BaseModel):
    id: str
    title: str
    description: str
    category: str = ""
    image_url: str = ""

class MatchRequest(BaseModel):
    item: ItemData
    candidates: list[ItemData]

class MatchResult(BaseModel):
    candidate_id: str
    text_score: float
    image_score: float
    combined_score: float

class MatchResponse(BaseModel):
    matches: list[MatchResult]


# ─── Endpoints ─────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": text_embedder is not None and image_embedder is not None,
    }


@app.post("/embed/text", response_model=TextEmbedResponse)
async def embed_text(request: TextEmbedRequest):
    if not text_embedder:
        raise HTTPException(status_code=503, detail="Text model not loaded")
    embedding = text_embedder.embed(request.text)
    return TextEmbedResponse(embedding=embedding)


@app.post("/embed/image", response_model=ImageEmbedResponse)
async def embed_image(request: ImageEmbedRequest):
    if not image_embedder:
        raise HTTPException(status_code=503, detail="Image model not loaded")
    embedding = image_embedder.embed_from_url(request.image_url)
    if embedding is None:
        raise HTTPException(status_code=400, detail="Failed to process image")
    return ImageEmbedResponse(embedding=embedding)


@app.post("/match", response_model=MatchResponse)
async def match_items(request: MatchRequest):
    if not matcher_service:
        raise HTTPException(status_code=503, detail="Matcher service not loaded")

    item_dict = request.item.model_dump()
    candidates_dict = [c.model_dump() for c in request.candidates]

    matches = matcher_service.find_matches(item_dict, candidates_dict)
    return MatchResponse(matches=[MatchResult(**m) for m in matches])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
