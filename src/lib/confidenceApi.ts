import { PoseFeatures } from './poseFeatures';

export interface WebcamConfidenceResult {
  confidence: 'Confident' | 'Neutral' | 'Low';
  probability: number;
  all_probabilities: Record<'Confident' | 'Neutral' | 'Low', number>;
}

const API_BASE = import.meta.env.VITE_CONFIDENCE_API_URL || 'http://127.0.0.1:5055';

export const isConfidenceApiConfigured = () => true;

export const predictWebcamConfidence = async (features: PoseFeatures): Promise<WebcamConfidenceResult> => {
  const response = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ features }),
  });

  if (!response.ok) {
    throw new Error(`Confidence API error: ${response.status}`);
  }

  return response.json();
};
