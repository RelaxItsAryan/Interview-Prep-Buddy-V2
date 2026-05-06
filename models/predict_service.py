"""
Python service wrapper for confidence prediction
This is called by the Node.js backend via subprocess
"""

import json
import sys
import joblib
from pathlib import Path
import numpy as np

MODEL_DIR = Path(__file__).parent

def load_model_and_metadata():
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
        features_dict: Dict with feature names as keys and float values
        
    Returns:
        {
            'confidence': str,
            'probability': float,
            'all_probabilities': {class: prob, ...}
        }
    """
    pipeline, metadata = load_model_and_metadata()
    
    # Build feature vector in correct order
    feature_names = metadata['feature_names']
    
    # Encode categorical features
    categorical_encodings = metadata['categorical_encodings']
    
    features_list = []
    for fname in feature_names:
        if fname in categorical_encodings:
            # Encode categorical feature
            value = features_dict.get(fname)
            encoding_map = categorical_encodings[fname]
            encoded_value = encoding_map.get(str(value), 0)
            features_list.append(float(encoded_value))
        else:
            # Use numeric feature as-is
            features_list.append(float(features_dict.get(fname, 0)))
    
    feature_vector = np.array(features_list).reshape(1, -1)
    
    # Predict
    prediction = pipeline.predict(feature_vector)[0]
    probabilities = pipeline.predict_proba(feature_vector)[0]
    
    # Map to class names
    classes = metadata['target_classes']
    confidence_class = classes[int(prediction)]
    confidence_prob = float(probabilities[int(prediction)])
    
    all_probs = {classes[i]: float(probabilities[i]) for i in range(len(classes))}
    
    return {
        'confidence': confidence_class,
        'probability': confidence_prob,
        'all_probabilities': all_probs
    }

if __name__ == '__main__':
    # Read JSON from stdin
    input_data = json.loads(sys.stdin.read())
    
    try:
        result = predict_confidence(input_data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            'error': str(e),
            'confidence': 'Neutral',
            'probability': 0.33
        }))
