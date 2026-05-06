import { spawn } from 'child_process';
import { resolve } from 'path';

interface ConfidenceFeatures {
  [key: string]: number | string;
}

interface PredictionResult {
  confidence: 'Confident' | 'Neutral' | 'Low';
  probability: number;
  all_probabilities: {
    Confident: number;
    Neutral: number;
    Low: number;
  };
  error?: string;
}

/**
 * Confidence Predictor Service
 * Uses trained ML model to predict interview confidence from body language features
 */
export class ConfidencePredictor {
  private pythonScriptPath: string;
  private pythonExecutable: string;

  constructor(pythonExecutable = 'python') {
    this.pythonExecutable = pythonExecutable;
    this.pythonScriptPath = resolve(__dirname, '../models/predict_service.py');
  }

  /**
   * Predict confidence level from body language features
   * @param features Object containing body language feature values
   * @returns Prediction with confidence label and probabilities
   */
  async predict(features: ConfidenceFeatures): Promise<PredictionResult> {
    return new Promise((resolve, reject) => {
      try {
        const python = spawn(this.pythonExecutable, [this.pythonScriptPath]);

        let output = '';
        let errorOutput = '';

        python.stdout.on('data', (data) => {
          output += data.toString();
        });

        python.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        python.on('close', (code) => {
          if (code !== 0) {
            console.error('Python script error:', errorOutput);
            reject(new Error(`Python process exited with code ${code}`));
            return;
          }

          try {
            const result = JSON.parse(output) as PredictionResult;
            resolve(result);
          } catch (parseError) {
            reject(new Error(`Failed to parse prediction output: ${output}`));
          }
        });

        python.on('error', (error) => {
          reject(new Error(`Failed to spawn Python process: ${error.message}`));
        });

        // Send features as JSON to Python script
        python.stdin.write(JSON.stringify(features));
        python.stdin.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Batch predict confidence for multiple feature sets
   * @param featuresList Array of feature objects
   * @returns Array of predictions
   */
  async predictBatch(
    featuresList: ConfidenceFeatures[]
  ): Promise<PredictionResult[]> {
    return Promise.all(featuresList.map((features) => this.predict(features)));
  }

  /**
   * Get model information and feature requirements
   */
  getModelInfo() {
    return {
      modelName: 'Confidence Classifier',
      modelType: 'GradientBoostingClassifier',
      accuracy: 0.9899,
      f1Score: 0.9899,
      classes: ['Confident', 'Neutral', 'Low'],
      requiredFeatures: [
        'eye_shoulder_y_ratio',
        'shoulder_y_diff',
        'wrist_distance_x',
        'wrist_shoulder_ratio',
        'nose_eye_center_offset_x',
        'shoulder_span',
        'hip_shoulder_y_diff',
        'body_lean_x',
        'shoulder_center_x',
        'hip_center_x',
        'spine_angle',
        'eye_distance',
        'head_tilt_angle',
        'eye_distance_ratio',
        'shoulder_slope',
        'head_direction',
        'arm_position',
        'posture',
      ],
      topFeatures: [
        'wrist_shoulder_ratio (0.43)',
        'eye_shoulder_y_ratio (0.15)',
        'shoulder_y_diff (0.13)',
        'shoulder_slope (0.12)',
      ],
    };
  }
}

// Export singleton instance
export const confidencePredictor = new ConfidencePredictor();

// Example usage for testing
if (require.main === module) {
  const testFeatures = {
    eye_shoulder_y_ratio: -0.5035957992,
    shoulder_y_diff: 0.0074760318,
    wrist_distance_x: 0.5790190101,
    wrist_shoulder_ratio: 1.2652163433,
    nose_eye_center_offset_x: 0.0051734895,
    shoulder_span: 0.4576953313,
    hip_shoulder_y_diff: 0.9403741062,
    body_lean_x: -0.0131195486,
    shoulder_center_x: 0.5287331045,
    hip_center_x: 0.5418526530,
    spine_angle: 89.2006947109,
    eye_distance: 0.1459573127,
    head_tilt_angle: -9.4289434124,
    eye_distance_ratio: 0.3188962236,
    shoulder_slope: 0.0074760318,
    head_direction: 'Looking Straight',
    arm_position: 'Partially Open',
    posture: 'Upright',
  };

  confidencePredictor
    .predict(testFeatures)
    .then((result) => {
      console.log('Prediction Result:', result);
      console.log('Model Info:', confidencePredictor.getModelInfo());
    })
    .catch((error) => {
      console.error('Prediction error:', error);
    });
}

export default confidencePredictor;
