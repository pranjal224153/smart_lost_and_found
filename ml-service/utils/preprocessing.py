import re
import io
import requests
from PIL import Image
import numpy as np


def clean_text(text: str) -> str:
    """Clean and normalize text for embedding."""
    if not text:
        return ""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text.strip())
    # Remove special characters but keep basic punctuation
    text = re.sub(r'[^\w\s.,!?-]', '', text)
    return text.lower()


def download_image(url: str) -> Image.Image | None:
    """Download image from URL and return PIL Image."""
    try:
        response = requests.get(url, timeout=10, stream=True)
        response.raise_for_status()
        image = Image.open(io.BytesIO(response.content)).convert('RGB')
        return image
    except Exception as e:
        print(f"Error downloading image: {e}")
        return None


def preprocess_image(image: Image.Image, size: tuple = (224, 224)) -> Image.Image:
    """Resize image maintaining aspect ratio with padding."""
    image = image.resize(size, Image.Resampling.LANCZOS)
    return image
