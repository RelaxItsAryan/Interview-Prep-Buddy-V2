# Confidence Classifier Model - Training & Usage Guide

## Overview

This project includes a trained machine learning model that predicts interview confidence levels based on body language and posture features. The model was trained on 5,949 samples with **98.99% accuracy**.

## Model Performance

- **Test Accuracy**: 98.99%
- **F1-Score**: 0.9899
- **Model Type**: Gradient Boosting Classifier
- **Training Samples**: 4,759
- **Test Samples**: 1,190

### Classification Metrics

```
              precision    recall  f1-score   support
   Confident       0.98      1.00      0.99       627
       Low         1.00      1.00      1.00       231
     Neutral       1.00      0.97      0.98       332
    accuracy                           0.99      1190
```

## Files

### Model Files (in `/models` directory)

- **`confidence_classifier.pkl`** - Trained model binary
- **`model_metadata.json`** - Model configuration and feature encodings
- **`feature_importance.json`** - Feature importance scores
- **`predict_service.py`** - Python service for making predictions
- **`predict.py`** - Standalone prediction script

## Feature Importance

The top 10 features that influence confidence predictions:

1. **wrist_shoulder_ratio** (0.4299) - Wrist position relative to shoulder
2. **eye_shoulder_y_ratio** (0.1475) - Eye height relative to shoulder
3. **shoulder_y_diff** (0.1323) - Shoulder height difference
4. **shoulder_slope** (0.1220) - Shoulder tilt angle
5. **nose_eye_center_offset_x** (0.0786) - Face center offset
6. **shoulder_span** (0.0290) - Shoulder width
7. **eye_distance** (0.0261) - Inter-eye distance
8. **eye_distance_ratio** (0.0128) - Relative eye spacing
9. **head_tilt_angle** (0.0052) - Head tilt
10. **hip_shoulder_y_diff** (0.0049) - Hip-shoulder vertical difference

## Required Input Features

The model expects 18 features as input:

### Numerical Features
- eye_shoulder_y_ratio
- shoulder_y_diff
- wrist_distance_x
- wrist_shoulder_ratio
- nose_eye_center_offset_x
- shoulder_span
- hip_shoulder_y_diff
- body_lean_x
- shoulder_center_x
- hip_center_x
- spine_angle
- eye_distance
- head_tilt_angle
- eye_distance_ratio
- shoulder_slope

### Categorical Features
- **head_direction**: "Center" | "Looking Straight" | "Looking Left" | "Looking Right"
- **arm_position**: "Closed Arms" | "Partially Open" | "Open Arms"
- **posture**: "Slouched" | "Upright" | "Stiff"

## Usage

### Python

```python
from models.predict_service import predict_confidence

features = {
    "eye_shoulder_y_ratio": -0.5036,
    "shoulder_y_diff": 0.0075,
    "wrist_distance_x": 0.5790,
    "wrist_shoulder_ratio": 1.2652,
    "nose_eye_center_offset_x": 0.0052,
    "shoulder_span": 0.4577,
    "hip_shoulder_y_diff": 0.9404,
    "body_lean_x": -0.0131,
    "shoulder_center_x": 0.5287,
    "hip_center_x": 0.5419,
    "spine_angle": 89.2007,
    "eye_distance": 0.1460,
    "head_tilt_angle": -9.4289,
    "eye_distance_ratio": 0.3189,
    "shoulder_slope": 0.0075,
    "head_direction": "Looking Straight",
    "arm_position": "Partially Open",
    "posture": "Upright"
}

result = predict_confidence(features)
print(result)
# Output: {
#     'confidence': 'Confident',
#     'probability': 0.98,
#     'all_probabilities': {
#         'Confident': 0.98,
#         'Neutral': 0.02,
#         'Low': 0.00
#     }
# }
```

### TypeScript/Node.js

```typescript
import { confidencePredictor } from '@/lib/confidencePredictor';

const features = {
  eye_shoulder_y_ratio: -0.5036,
  shoulder_y_diff: 0.0075,
  // ... other features
  head_direction: 'Looking Straight',
  arm_position: 'Partially Open',
  posture: 'Upright'
};

const prediction = await confidencePredictor.predict(features);
console.log(prediction);
// {
//   confidence: 'Confident',
//   probability: 0.98,
//   all_probabilities: { Confident: 0.98, Neutral: 0.02, Low: 0.00 }
// }
```

## Integration with Interview App

### In CameraPreview or Interview Component

```typescript
import { confidencePredictor } from '@/lib/confidencePredictor';

// Extract pose features from camera feed (e.g., using MediaPipe or pose detection)
const poseFeatures = extractPoseFeaturesFromVideo(videoElement);

// Get confidence prediction
const prediction = await confidencePredictor.predict(poseFeatures);

// Update UI with confidence level
updateConfidenceIndicator(prediction.confidence, prediction.probability);
```

## Retraining the Model

To retrain the model with new data:

```bash
cd Interview-Prep-Buddy-V2
python train_confidence_model.py
```

The training script will:
1. Load data from `confidence_features.csv`
2. Train a Gradient Boosting classifier
3. Evaluate performance
4. Save model, metadata, and feature importance to `/models`

## Monitoring

Track these metrics in production:

- **Prediction accuracy** on validation data
- **Feature distributions** - ensure new data is similar to training data
- **Confidence distribution** - check for skewed predictions
- **Model drift** - retrain periodically as new interview data arrives

## Troubleshooting

### Python Import Errors

Ensure required packages are installed:

```bash
pip install pandas scikit-learn joblib numpy
```

### Model File Not Found

Verify the models directory structure:

```
Interview-Prep-Buddy-V2/
├── models/
│   ├── confidence_classifier.pkl
│   ├── model_metadata.json
│   ├── feature_importance.json
│   ├── predict_service.py
│   └── predict.py
```

### Low Prediction Accuracy

- Verify feature values are in expected ranges
- Check that categorical features use exact string matches
- Retrain model with updated data if feature distributions changed

## References

- Confidence dataset: `confidence_features.csv`
- Training script: `train_confidence_model.py`
- Prediction service: `src/lib/confidencePredictor.ts`
