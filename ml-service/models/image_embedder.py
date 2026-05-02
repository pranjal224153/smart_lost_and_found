import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import numpy as np
from utils.preprocessing import download_image, preprocess_image


class ImageEmbedder:
    """Image embedding using ResNet50 (pretrained on ImageNet)."""

    def __init__(self):
        print("Loading image model: ResNet50...")
        # Load pretrained ResNet50 and remove classification head
        resnet = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
        # Use everything up to the avg pool layer (output: 2048-dim vector)
        self.model = nn.Sequential(*list(resnet.children())[:-1])
        self.model.eval()

        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            ),
        ])
        print("Image model loaded successfully.")

    def embed(self, image: Image.Image) -> list[float]:
        """Generate embedding for a PIL Image."""
        with torch.no_grad():
            tensor = self.transform(image).unsqueeze(0)
            features = self.model(tensor).squeeze().numpy()
            # L2 normalize
            norm = np.linalg.norm(features)
            if norm > 0:
                features = features / norm
            return features.tolist()

    def embed_from_url(self, url: str) -> list[float] | None:
        """Download image from URL and generate embedding."""
        image = download_image(url)
        if image is None:
            return None
        return self.embed(image)

    def similarity(self, embedding1: list[float], embedding2: list[float]) -> float:
        """Compute cosine similarity between two image embeddings."""
        a = np.array(embedding1)
        b = np.array(embedding2)
        if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
            return 0.0
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
