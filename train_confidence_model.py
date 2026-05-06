"""
Confidence Classifier Training Script
Trains a machine learning model on posture/body language features to predict interview confidence
"""

import pandas as pd
import numpy as np
import json
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score
from sklearn.pipeline import Pipeline
import warnings

warnings.filterwarnings('ignore')

# Paths
DATA_DIR = Path(__file__).parent
DATA_PATH = DATA_DIR / 'confidence_features.csv'
MODEL_DIR = DATA_DIR / 'models'
MODEL_DIR.mkdir(exist_ok=True)

def load_and_prepare_data(csv_path):
    """Load and preprocess the confidence features dataset"""
    print(f"Loading data from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    print(f"Dataset shape: {df.shape}")
    print(f"\nConfidence labels distribution:")
    print(df['confidence_label'].value_counts())
    
    # Encode categorical features
    categorical_cols = ['head_direction', 'arm_position', 'posture']
    label_encoders = {}
    
    for col in categorical_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        label_encoders[col] = le
        print(f"  {col}: {dict(zip(le.classes_, le.transform(le.classes_)))}")
    
    # Separate features and target
    X = df.drop('confidence_label', axis=1)
    y = df['confidence_label']
    
    # Encode target
    target_encoder = LabelEncoder()
    y_encoded = target_encoder.fit_transform(y)
    
    print(f"\nTarget classes: {dict(zip(target_encoder.classes_, target_encoder.transform(target_encoder.classes_)))}")
    print(f"Features: {list(X.columns)}")
    
    return X, y_encoded, target_encoder, label_encoders, df.columns.tolist()

def train_model(X, y, test_size=0.2, random_state=42):
    """Train and evaluate confidence classifier"""
    print("\n" + "="*60)
    print("TRAINING CONFIDENCE CLASSIFIER")
    print("="*60)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    
    print(f"\nTrain set: {X_train.shape[0]} samples")
    print(f"Test set: {X_test.shape[0]} samples")
    
    # Create pipeline with scaling and model
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=random_state,
            verbose=0
        ))
    ])
    
    # Train
    print("\nTraining model...")
    pipeline.fit(X_train, y_train)
    
    # Evaluate
    y_pred = pipeline.predict(X_test)
    y_pred_train = pipeline.predict(X_train)
    
    train_acc = accuracy_score(y_train, y_pred_train)
    test_acc = accuracy_score(y_test, y_pred)
    test_f1 = f1_score(y_test, y_pred, average='weighted')
    
    print(f"\n{'='*60}")
    print("MODEL PERFORMANCE")
    print(f"{'='*60}")
    print(f"Training Accuracy: {train_acc:.4f}")
    print(f"Testing Accuracy:  {test_acc:.4f}")
    print(f"Testing F1-Score:  {test_f1:.4f}")
    
    print("\nClassification Report (Test Set):")
    print(classification_report(y_test, y_pred))
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # Feature importance
    classifier = pipeline.named_steps['classifier']
    feature_importance = classifier.feature_importances_
    
    print("\nTop 10 Important Features:")
    feature_names = X.columns.tolist()
    importance_df = pd.DataFrame({
        'feature': feature_names,
        'importance': feature_importance
    }).sort_values('importance', ascending=False)
    
    for idx, row in importance_df.head(10).iterrows():
        print(f"  {row['feature']:30s}: {row['importance']:.4f}")
    
    return pipeline, X_test, y_test, importance_df

def save_model(pipeline, target_encoder, label_encoders, feature_names, importance_df):
    """Save trained model and metadata"""
    model_path = MODEL_DIR / 'confidence_classifier.pkl'
    meta_path = MODEL_DIR / 'model_metadata.json'
    importance_path = MODEL_DIR / 'feature_importance.json'
    
    # Save model
    joblib.dump(pipeline, model_path)
    print(f"\n✓ Model saved to: {model_path}")
    
    # Convert numpy types to native Python types for JSON serialization
    def convert_to_native(obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        return obj
    
    # Save metadata
    metadata = {
        'model_type': 'GradientBoostingClassifier',
        'target_classes': [str(c) for c in target_encoder.classes_],
        'target_encoding': {str(c): int(i) for c, i in zip(target_encoder.classes_, 
                                                            target_encoder.transform(target_encoder.classes_))},
        'feature_names': feature_names,
        'categorical_encodings': {
            col: {str(c): int(i) for c, i in zip(le.classes_, le.transform(le.classes_))}
            for col, le in label_encoders.items()
        },
        'scaler_type': 'StandardScaler',
    }
    
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"✓ Metadata saved to: {meta_path}")
    
    # Save feature importance
    importance_dict = {
        row['feature']: float(row['importance']) 
        for _, row in importance_df.iterrows()
    }
    
    with open(importance_path, 'w') as f:
        json.dump(importance_dict, f, indent=2)
    print(f"✓ Feature importance saved to: {importance_path}")
    
    return model_path, meta_path, importance_path

def create_prediction_script():
    """Create a prediction script for backend usage"""
    pred_script = """
import joblib
import json
import numpy as np
from pathlib import Path

MODEL_DIR = Path(__file__).parent / 'models'

def load_model():
    \"\"\"Load trained model and metadata\"\"\"
    model_path = MODEL_DIR / 'confidence_classifier.pkl'
    meta_path = MODEL_DIR / 'model_metadata.json'
    
    pipeline = joblib.load(model_path)
    
    with open(meta_path, 'r') as f:
        metadata = json.load(f)
    
    return pipeline, metadata

def predict_confidence(features_dict):
    \"\"\"
    Predict confidence level from body language features
    
    Args:
        features_dict: Dict with feature names as keys and values
        
    Returns:
        {
            'confidence': str,
            'probability': float,
            'all_probabilities': {class: prob, ...}
        }
    \"\"\"
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
"""
    
    pred_path = MODEL_DIR / 'predict.py'
    with open(pred_path, 'w') as f:
        f.write(pred_script)
    print(f"✓ Prediction script created: {pred_path}")

def main():
    print("\n" + "="*60)
    print("CONFIDENCE CLASSIFIER MODEL TRAINING")
    print("="*60)
    
    # Load and prepare data
    X, y, target_encoder, label_encoders, feature_names = load_and_prepare_data(DATA_PATH)
    
    # Train model
    pipeline, X_test, y_test, importance_df = train_model(X, y)
    
    # Save model and metadata
    save_model(pipeline, target_encoder, label_encoders, feature_names, importance_df)
    
    # Create prediction script
    create_prediction_script()
    
    print("\n" + "="*60)
    print("TRAINING COMPLETE!")
    print("="*60)
    print(f"\nModel files saved in: {MODEL_DIR}")
    print("\nNext steps:")
    print("1. Use predict.py to make predictions on new data")
    print("2. Integrate with your interview app backend")
    print("3. Monitor model performance on production data")

if __name__ == '__main__':
    main()
