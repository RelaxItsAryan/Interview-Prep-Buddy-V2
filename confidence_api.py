from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
import joblib
import json
import numpy as np

app = Flask(__name__)
CORS(app)

BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / 'models'
MODEL_PATH = MODELS_DIR / 'confidence_classifier.pkl'
METADATA_PATH = MODELS_DIR / 'model_metadata.json'

pipeline = joblib.load(MODEL_PATH)
with open(METADATA_PATH, 'r', encoding='utf-8') as f:
    metadata = json.load(f)

FEATURE_NAMES = metadata['feature_names']
TARGET_CLASSES = metadata['target_classes']
CATEGORICAL_ENCODINGS = metadata.get('categorical_encodings', {})


def to_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return float(default)


@app.get('/health')
def health():
    return jsonify({
        'ok': True,
        'model': 'confidence_classifier',
        'classes': TARGET_CLASSES,
    })


@app.post('/predict')
def predict():
    payload = request.get_json(silent=True) or {}
    features = payload.get('features', payload)

    feature_vector = []
    for feature_name in FEATURE_NAMES:
        if feature_name in CATEGORICAL_ENCODINGS:
            mapping = CATEGORICAL_ENCODINGS[feature_name]
            value = str(features.get(feature_name, ''))
            encoded = mapping.get(value, 0)
            feature_vector.append(to_float(encoded))
        else:
            feature_vector.append(to_float(features.get(feature_name, 0)))

    data = np.array(feature_vector, dtype=float).reshape(1, -1)
    prediction_index = int(pipeline.predict(data)[0])
    probabilities = pipeline.predict_proba(data)[0]
    confidence_label = TARGET_CLASSES[prediction_index]

    return jsonify({
        'confidence': confidence_label,
        'probability': float(probabilities[prediction_index]),
        'all_probabilities': {
            TARGET_CLASSES[i]: float(probabilities[i]) for i in range(len(TARGET_CLASSES))
        },
    })


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5055, debug=True)
