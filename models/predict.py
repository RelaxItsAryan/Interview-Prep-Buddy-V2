
import joblib
import json
import numpy as np
from pathlib import Path

MODEL_DIR = Path(__file__).parent / 'models'

def load_model():
    """Load trained model and metadata"""
    model_path = MODEL_DIR / 'confidence_classifier.pkl'
    meta_path = MODEL_DIR / 'model_metadata.json'
    
    pipeline = joblib.load(model_path)
    
    with open(meta_path, 'r') as f:
        metadata = json.load(f)
    
    return pipeline, metadata

def predict_confidence(features_dict):
    """
    Predict confidence level from body language features
    
    Args:
        features_dict: Dict with feature names as keys and values
        
    Returns:
        {
            'confidence': str,
            'probability': float,
            'all_probabilities': {class: prob, ...}
        }
    """
    pipeline, metadata = load_model()
    
    # Build feature vector in correct order
    feature_names = metadata['feature_names']
    feature_vector = np.array([features_dict.get(f, 0) for f in feature_names]).reshape(1, -1)
    
    # Predict
    prediction = pipeline.predict(feature_vector)[0]
    probabilities = pipeline.predict_proba(feature_vector)[0]
    
    # Map to class names
    classes = metadata['target_classes']
    confidence_class = classes[prediction]
    confidence_prob = probabilities[prediction]
    
    all_probs = {classes[i]: float(probabilities[i]) for i in range(len(classes))}
    
    return {
        'confidence': confidence_class,
        'probability': float(confidence_prob),
        'all_probabilities': all_probs
    }

if __name__ == '__main__':
    # Example usage
    pipeline, metadata = load_model()
    print("Model loaded successfully!")
    print(f"Classes: {metadata['target_classes']}")
    print(f"Features: {len(metadata['feature_names'])} features")
