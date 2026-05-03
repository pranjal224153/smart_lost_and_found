import re
import numpy as np
from models.text_embedder import TextEmbedder
from models.image_embedder import ImageEmbedder


# ─── Product-Type Keyword Blocklist ────────────────────────────────────────────
# Items belonging to DIFFERENT product types will be hard-blocked from matching.
# This prevents nonsensical matches like earbuds ↔ phone, wallet ↔ laptop, etc.

PRODUCT_TYPES: dict[str, set[str]] = {
    'phone': {
        'phone', 'smartphone', 'iphone', 'android', 'mobile', 'motorola', 'moto',
        'samsung', 'oneplus', 'pixel', 'realme', 'redmi', 'poco', 'vivo', 'oppo',
        'nokia', 'xiaomi', 'mi ', 'iqoo', 'nothing phone', 'infinix', 'tecno',
        'cellphone', 'cell phone', 'handset',
    },
    'audio': {
        'earbud', 'earbuds', 'headphone', 'headphones', 'earphone', 'earphones',
        'buds', 'airpods', 'tws', 'neckband', 'headset', 'in-ear', 'over-ear',
        'boat', 'jbl', 'sennheiser', 'bose', 'sony headphones', 'marshall',
        'skullcandy', 'jabra', 'anker soundcore', 'speaker', 'bluetooth speaker',
        'pods', 'buds+', 'galaxy buds', 'freebuds', 'pixel buds',
    },
    'watch': {
        'watch', 'smartwatch', 'smart watch', 'fitbit', 'garmin', 'mi band',
        'amazfit', 'fossil watch', 'band', 'wearable', 'timepiece', 'wristwatch',
        'apple watch', 'galaxy watch', 'fastrack', 'noise watch', 'boat watch',
    },
    'laptop': {
        'laptop', 'macbook', 'notebook', 'chromebook', 'ultrabook',
        'thinkpad', 'hp laptop', 'dell laptop', 'lenovo laptop', 'asus laptop',
    },
    'tablet': {
        'tablet', 'ipad', 'tab', 'kindle', 'e-reader', 'ereader',
        'samsung tab', 'galaxy tab', 'surface pro',
    },
    'camera': {
        'camera', 'dslr', 'mirrorless', 'gopro', 'action camera',
        'instax', 'polaroid', 'camcorder',
    },
    'wallet': {
        'wallet', 'purse', 'billfold', 'coin purse',
    },
    'bag': {
        'bag', 'backpack', 'rucksack', 'luggage', 'suitcase',
        'handbag', 'tote', 'sling bag', 'messenger bag', 'duffel',
    },
    'keys': {
        'key', 'keys', 'keychain', 'key ring', 'car key', 'house key',
    },
    'glasses': {
        'glasses', 'sunglasses', 'spectacles', 'eyewear', 'goggles', 'reading glasses',
    },
    'id_docs': {
        'passport', 'license', 'aadhar', 'aadhaar', 'pan card', 'driving license',
        'id card', 'voter id', 'student id',
    },
    'charger': {
        'charger', 'power adapter', 'powerbank', 'power bank', 'charging cable',
        'usb cable', 'type-c cable',
    },
}

# Words to ignore when computing keyword overlap
STOPWORDS = {
    'a', 'an', 'the', 'my', 'i', 'it', 'its', 'is', 'was', 'are', 'were',
    'lost', 'found', 'item', 'please', 'help', 'need', 'looking', 'for',
    'have', 'had', 'has', 'this', 'that', 'with', 'at', 'in', 'on', 'of',
    'and', 'or', 'but', 'so', 'if', 'to', 'from', 'by', 'be', 'do',
    'color', 'colour', 'black', 'white', 'red', 'blue', 'green', 'grey', 'gray',
}


def _tokenize(text: str) -> set[str]:
    """Extract significant lowercase words from text."""
    words = re.findall(r'\b[a-zA-Z0-9]{3,}\b', text.lower())
    return {w for w in words if w not in STOPWORDS}


def detect_product_type(title: str, description: str) -> str | None:
    """
    Detect which product-type group an item belongs to based on its title/description.
    Returns the group name or None if undetected.
    """
    combined = f"{title} {description}".lower()
    best_match = None
    best_count = 0

    for ptype, keywords in PRODUCT_TYPES.items():
        count = sum(1 for kw in keywords if kw in combined)
        if count > best_count:
            best_count = count
            best_match = ptype

    # Require at least one keyword hit to claim a type
    return best_match if best_count > 0 else None


def keyword_overlap_boost(title1: str, desc1: str, title2: str, desc2: str) -> float:
    """
    Compute a small boost for shared significant words between two items.
    Max boost: +0.15
    """
    tokens1 = _tokenize(f"{title1} {desc1}")
    tokens2 = _tokenize(f"{title2} {desc2}")
    if not tokens1 or not tokens2:
        return 0.0
    overlap = len(tokens1 & tokens2)
    return min(overlap * 0.05, 0.15)


class MatcherService:
    """Service for matching lost and found items using text + image similarity."""

    # Weights for title vs description in text scoring
    TITLE_WEIGHT = 0.6
    DESC_WEIGHT = 0.4

    # Image contributes up to 15% bonus on top of text score
    IMAGE_BONUS_CAP = 0.15

    def __init__(self, text_embedder: TextEmbedder, image_embedder: ImageEmbedder):
        self.text_embedder = text_embedder
        self.image_embedder = image_embedder

    def _text_sim(self, a: str, b: str) -> float:
        """Cosine similarity between two text strings via embeddings."""
        if not a.strip() or not b.strip():
            return 0.0
        emb1 = self.text_embedder.embed(a)
        emb2 = self.text_embedder.embed(b)
        return self.text_embedder.similarity(emb1, emb2)

    def _image_sim(self, url1: str, url2: str) -> float:
        """Cosine similarity between two image embeddings."""
        if not self.image_embedder or not url1 or not url2:
            return 0.0
        emb1 = self.image_embedder.embed_from_url(url1)
        emb2 = self.image_embedder.embed_from_url(url2)
        if emb1 is None or emb2 is None:
            return 0.0
        return self.image_embedder.similarity(emb1, emb2)

    def find_matches(self, item: dict, candidates: list[dict]) -> list[dict]:
        """
        Find matches for an item among candidates using a 3-layer scoring system:
          Layer 1 — Hard product-type gate (blocks buds ↔ phone, wallet ↔ laptop, etc.)
          Layer 2 — Weighted semantic text score (title + description separately)
          Layer 3 — Optional image similarity bonus (capped at +15%)

        Args:
            item: dict with keys: id, title, description, category, image_url
            candidates: list of dicts with same keys

        Returns:
            list of dicts sorted by combined_score descending
        """
        item_title = item.get('title', '')
        item_desc = item.get('description', '')
        item_type = detect_product_type(item_title, item_desc)
        item_img = item.get('image_url', '')

        results = []

        for candidate in candidates:
            cand_title = candidate.get('title', '')
            cand_desc = candidate.get('description', '')
            cand_img = candidate.get('image_url', '')

            # ── Layer 1: Hard product-type gate ──────────────────────────────
            cand_type = detect_product_type(cand_title, cand_desc)

            if item_type and cand_type and item_type != cand_type:
                # Hard block — completely different product types
                results.append({
                    'candidate_id': candidate['id'],
                    'text_score': 0.0,
                    'image_score': 0.0,
                    'combined_score': 0.0,
                })
                continue

            # ── Layer 2: Weighted semantic text score ─────────────────────────
            title_sim = self._text_sim(item_title, cand_title)
            desc_sim = self._text_sim(item_desc, cand_desc) if item_desc and cand_desc else title_sim

            text_score = self.TITLE_WEIGHT * title_sim + self.DESC_WEIGHT * desc_sim

            # Keyword overlap boost (shared product names / brand words)
            kw_boost = keyword_overlap_boost(item_title, item_desc, cand_title, cand_desc)
            text_score = min(1.0, text_score + kw_boost)

            # ── Layer 3: Image similarity bonus ───────────────────────────────
            image_score = 0.0
            if item_img and cand_img:
                image_score = self._image_sim(item_img, cand_img)

            # Combined: text is primary, image is a capped bonus
            if item_img and cand_img and image_score > 0:
                # Use max to ensure high text similarity isn't penalized by low image similarity
                # but high image similarity can still provide a significant boost.
                weighted = text_score * 0.7 + image_score * 0.3
                combined = max(text_score, weighted)
            else:
                combined = text_score

            # Bonus for matching declared category
            if item.get('category') and item.get('category') == candidate.get('category'):
                combined = min(1.0, combined + 0.10)

            results.append({
                'candidate_id': candidate['id'],
                'text_score': round(text_score, 4),
                'image_score': round(image_score, 4),
                'combined_score': round(combined, 4),
            })

        # Sort by combined score descending
        results.sort(key=lambda x: x['combined_score'], reverse=True)
        return results
