from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager


# Global model instances
text_embedder = None
image_embedder = None
matcher_service = None


def get_matcher():
    """Lazy initialize models when first needed."""
    global matcher_service
    if matcher_service is None:
        print("=" * 50)
        print("Initializing ML models (ONNX Optimized)...")
        print("=" * 50)
        
        # Move imports here to avoid blocking startup
        from models.text_embedder import TextEmbedder
        from models.image_embedder import ImageEmbedder
        from services.matcher import MatcherService
        
        text_embedder = TextEmbedder()
        try:
            image_embedder = ImageEmbedder()
        except Exception as e:
            print(f"Warning: Image embedder failed to load: {e}")
            image_embedder = None
            
        matcher_service = MatcherService(text_embedder, image_embedder)
        print("Models initialized (Text: OK, Image: {})".format("OK" if image_embedder else "FAILED"))
    return matcher_service

app = FastAPI(
    title="Smart Lost & Found - ML Service",
    description="AI-powered matching service for lost and found items",
    version="1.0.0"
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
        "models_loaded": matcher_service is not None,
    }


@app.post("/embed/text", response_model=TextEmbedResponse)
async def embed_text(request: TextEmbedRequest):
    matcher = get_matcher()
    embedding = matcher.text_embedder.embed(request.text)
    return TextEmbedResponse(embedding=embedding)


@app.post("/embed/image", response_model=ImageEmbedResponse)
async def embed_image(request: ImageEmbedRequest):
    matcher = get_matcher()
    if not matcher.image_embedder:
        raise HTTPException(status_code=503, detail="Image model not loaded")
    embedding = matcher.image_embedder.embed_from_url(request.image_url)
    if embedding is None:
        raise HTTPException(status_code=400, detail="Failed to process image")
    return ImageEmbedResponse(embedding=embedding)


@app.post("/match", response_model=MatchResponse)
async def match_items(request: MatchRequest):
    matcher = get_matcher()
    
    item_dict = request.item.model_dump()
    candidates_dict = [c.model_dump() for c in request.candidates]

    matches = matcher.find_matches(item_dict, candidates_dict)
    return MatchResponse(matches=[MatchResult(**m) for m in matches])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
