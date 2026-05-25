export interface WebcamConfidenceResult {
  confidence: 'Confident' | 'Neutral' | 'Low';
  probability: number;
  all_probabilities: Record<'Confident' | 'Neutral' | 'Low', number>;
}
