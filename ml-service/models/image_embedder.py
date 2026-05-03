import onnxruntime as ort
from PIL import Image
import numpy as np
from utils.preprocessing import download_image
from huggingface_hub import hf_hub_download


class ImageEmbedder:
    """
    Image embedding using MobileNetV2 via ONNX Runtime.
    
    Switched from ResNet50 (~150MB RAM) to MobileNetV2 (~55MB RAM),
    saving ~95MB memory while retaining comparable embedding quality
    for lost-and-found visual similarity tasks.
    """

    # ImageNet normalization (same for MobileNetV2 and ResNet50)
    MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    INPUT_SIZE = 224

    def __init__(self):
        print("Loading ONNX image model: MobileNetV2 (lightweight)...")

        # Try quantized first (smallest), fall back to full model
        for filename in ("onnx/model_quantized.onnx", "onnx/model.onnx"):
            try:
                model_path = hf_hub_download(
                    repo_id="Xenova/mobilenet_v2",
                    filename=filename,
                )
                break
            except Exception:
                continue
        else:
            raise RuntimeError("Could not download MobileNetV2 ONNX model from Xenova/mobilenet_v2")

        self.session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])

        # Detect input/output names dynamically so this works for any ONNX export
        self.input_name = self.session.get_inputs()[0].name
        print(f"  ONNX input name: '{self.input_name}'")
        print("MobileNetV2 image model loaded successfully.")

    def preprocess(self, image: Image.Image) -> np.ndarray:
        """Resize → center-crop → normalize to ImageNet standard."""
        image = image.convert("RGB")

        # Resize shorter side to 256
        w, h = image.size
        scale = 256 / min(w, h)
        image = image.resize((int(w * scale), int(h * scale)), Image.BILINEAR)

        # Center-crop 224×224
        w, h = image.size
        left = (w - self.INPUT_SIZE) // 2
        top = (h - self.INPUT_SIZE) // 2
        image = image.crop((left, top, left + self.INPUT_SIZE, top + self.INPUT_SIZE))

        # To numpy, normalize, transpose to (B, C, H, W)
        img = np.array(image).astype(np.float32) / 255.0
        img = (img - self.MEAN) / self.STD
        img = img.transpose(2, 0, 1)
        return np.expand_dims(img, axis=0).astype(np.float32)

    def embed(self, image: Image.Image) -> list[float]:
        """Generate L2-normalized embedding for a PIL Image."""
        input_data = self.preprocess(image)
        outputs = self.session.run(None, {self.input_name: input_data})

        # Use first output tensor — works for both logits and pooled features
        features = outputs[0].flatten()

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
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))
