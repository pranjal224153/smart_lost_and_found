import numpy as np
from models.text_embedder import TextEmbedder
from models.image_embedder import ImageEmbedder


class MatcherService:
    """Service for matching lost and found items using text + image similarity."""

    TEXT_WEIGHT = 0.6
    IMAGE_WEIGHT = 0.4

    def __init__(self, text_embedder: TextEmbedder, image_embedder: ImageEmbedder):
        self.text_embedder = text_embedder
        self.image_embedder = image_embedder

    def compute_text_similarity(self, item_text: str, candidate_text: str) -> float:
        """Compute text similarity between two items."""
        emb1 = self.text_embedder.embed(item_text)
        emb2 = self.text_embedder.embed(candidate_text)
        return self.text_embedder.similarity(emb1, emb2)

    def compute_image_similarity(self, item_url: str, candidate_url: str) -> float:
        """Compute image similarity between two items."""
        if not item_url or not candidate_url:
            return 0.0

        emb1 = self.image_embedder.embed_from_url(item_url)
        emb2 = self.image_embedder.embed_from_url(candidate_url)

        if emb1 is None or emb2 is None:
            return 0.0

        return self.image_embedder.similarity(emb1, emb2)

    def find_matches(self, item: dict, candidates: list[dict]) -> list[dict]:
        """
        Find matches for an item among candidates.

        Args:
            item: dict with keys: id, title, description, category, image_url
            candidates: list of dicts with same keys

        Returns:
            list of dicts with: candidate_id, text_score, image_score, combined_score
        """
        item_text = f"{item.get('title', '')} {item.get('description', '')} {item.get('category', '')}"
        results = []

        for candidate in candidates:
            candidate_text = f"{candidate.get('title', '')} {candidate.get('description', '')} {candidate.get('category', '')}"

            # Text similarity
            text_score = self.compute_text_similarity(item_text, candidate_text)

            # Image similarity
            image_score = self.compute_image_similarity(
                item.get('image_url', ''),
                candidate.get('image_url', '')
            )

            # Combined score
            if item.get('image_url') and candidate.get('image_url'):
                combined = self.TEXT_WEIGHT * text_score + self.IMAGE_WEIGHT * image_score
            else:
                # No image comparison possible, use text only
                combined = text_score

            # Category boost: +10% if same category
            if item.get('category') and item.get('category') == candidate.get('category'):
                combined = min(1.0, combined + 0.1)

            results.append({
                'candidate_id': candidate['id'],
                'text_score': round(text_score, 4),
                'image_score': round(image_score, 4),
                'combined_score': round(combined, 4),
            })

        # Sort by combined score descending
        results.sort(key=lambda x: x['combined_score'], reverse=True)
        return results
