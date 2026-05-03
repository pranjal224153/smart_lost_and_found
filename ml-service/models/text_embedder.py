import numpy as np
from transformers import AutoTokenizer
import onnxruntime as ort
from utils.preprocessing import clean_text
import os
from huggingface_hub import hf_hub_download

class TextEmbedder:
    """Text embedding using MiniLM via ONNX Runtime (No Torch)."""

    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        print(f"Loading ONNX text model: {model_name}...")
        
        # Download ONNX model and tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        
        # We use the official ONNX export if available, or a common one
        # For simplicity in this demo, we'll try to load from a known ONNX repo 
        # or use the hub's default onnx export if it exists.
        # Here we'll download a pre-exported version to ensure it works without torch
        model_path = hf_hub_download(repo_id="Xenova/all-MiniLM-L6-v2", filename="onnx/model_quantized.onnx")
        
        self.session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
        print("ONNX Text model loaded successfully.")

    def embed(self, text: str) -> list[float]:
        """Generate embedding for a single text string."""
        cleaned = clean_text(text)
        if not cleaned:
            return [0.0] * 384
        
        # Tokenize
        inputs = self.tokenizer(cleaned, padding=True, truncation=True, return_tensors="np")
        
        # Prepare inputs for ONNX
        onnx_inputs = {
            "input_ids": inputs["input_ids"].astype(np.int64),
            "attention_mask": inputs["attention_mask"].astype(np.int64),
            "token_type_ids": inputs["token_type_ids"].astype(np.int64),
        }
        
        # Run inference
        outputs = self.session.run(None, onnx_inputs)
        
        # Mean Pooling
        token_embeddings = outputs[0]
        input_mask_expanded = np.expand_dims(onnx_inputs["attention_mask"], -1).astype(float)
        sum_embeddings = np.sum(token_embeddings * input_mask_expanded, 1)
        sum_mask = np.clip(input_mask_expanded.sum(1), a_min=1e-9, a_max=None)
        embedding = sum_embeddings / sum_mask
        
        # L2 Normalize
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm
            
        return embedding[0].tolist()

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for multiple texts."""
        return [self.embed(t) for t in texts]

    def similarity(self, embedding1: list[float], embedding2: list[float]) -> float:
        """Compute cosine similarity between two embeddings."""
        a = np.array(embedding1)
        b = np.array(embedding2)
        if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
            return 0.0
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
