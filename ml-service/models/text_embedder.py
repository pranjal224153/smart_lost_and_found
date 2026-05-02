from sentence_transformers import SentenceTransformer
import numpy as np
from utils.preprocessing import clean_text


class TextEmbedder:
    """Text embedding using Sentence Transformers."""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        print(f"Loading text model: {model_name}...")
        self.model = SentenceTransformer(model_name)
        print("Text model loaded successfully.")

    def embed(self, text: str) -> list[float]:
        """Generate embedding for a single text string."""
        cleaned = clean_text(text)
        if not cleaned:
            return [0.0] * 384  # Default dimension for MiniLM
        embedding = self.model.encode(cleaned, normalize_embeddings=True)
        return embedding.tolist()

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for multiple texts."""
        cleaned = [clean_text(t) for t in texts]
        embeddings = self.model.encode(cleaned, normalize_embeddings=True)
        return embeddings.tolist()

    def similarity(self, embedding1: list[float], embedding2: list[float]) -> float:
        """Compute cosine similarity between two embeddings."""
        a = np.array(embedding1)
        b = np.array(embedding2)
        if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
            return 0.0
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
