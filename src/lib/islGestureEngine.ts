/**
 * ISL Gesture Engine
 * Uses MediaPipe Hands landmarks to classify Indian Sign Language (ISL) alphabet gestures.
 * Implements a rule-based classifier for A-Z ISL hand gestures.
 */

import {
  HandLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision';

export type ISLLetter = string; // A-Z or 'SPACE' | 'DELETE'

export interface ISLGestureResult {
  letter: ISLLetter | null;
  confidence: number;
  handDetected: boolean;
  landmarks?: number[][];
}

// Finger tip and base landmark indices (MediaPipe convention)
const FINGER_TIPS = [4, 8, 12, 16, 20];   // Thumb, Index, Middle, Ring, Pinky tips
const FINGER_MIDS = [3, 7, 11, 15, 19];   // Finger middle joints
const FINGER_BASES = [2, 5, 9, 13, 17];  // Finger base joints
const WRIST = 0;

type NormalizedLandmark = { x: number; y: number; z: number };

function isFingerExtended(landmarks: NormalizedLandmark[], finger: number): boolean {
  if (finger === 0) {
    // Thumb: compare tip x to base x (horizontal check)
    const tipX = landmarks[FINGER_TIPS[0]].x;
    const baseX = landmarks[FINGER_BASES[0]].x;
    const midX = landmarks[FINGER_MIDS[0]].x;
    // Thumb extended if tip is far from palm center
    const palmCenterX = landmarks[9].x;
    return Math.abs(tipX - palmCenterX) > 0.08;
  }
  // For other fingers: tip y < base y means finger is up (in image space y increases downward)
  const tip = landmarks[FINGER_TIPS[finger]];
  const base = landmarks[FINGER_BASES[finger]];
  const mid = landmarks[FINGER_MIDS[finger]];
  return tip.y < base.y - 0.04;
}

function fingersCurled(landmarks: NormalizedLandmark[], fingers: number[]): boolean {
  return fingers.every(f => !isFingerExtended(landmarks, f));
}

function fingersExtended(landmarks: NormalizedLandmark[], fingers: number[]): boolean {
  return fingers.every(f => isFingerExtended(landmarks, f));
}

function distanceBetween(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
    Math.pow(a.y - b.y, 2) +
    Math.pow(a.z - b.z, 2)
  );
}

/**
 * ISL Gesture Classifier
 * Maps MediaPipe hand landmarks to ISL alphabet letters.
 * Based on ISL (Indian Sign Language) static gesture reference.
 */
function classifyISLGesture(landmarks: NormalizedLandmark[]): { letter: ISLLetter; confidence: number } {
  const thumb = isFingerExtended(landmarks, 0);
  const index = isFingerExtended(landmarks, 1);
  const middle = isFingerExtended(landmarks, 2);
  const ring = isFingerExtended(landmarks, 3);
  const pinky = isFingerExtended(landmarks, 4);

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  const wrist = landmarks[WRIST];
  const indexBase = landmarks[5];
  const pinkyBase = landmarks[17];

  const thumbIndexDist = distanceBetween(thumbTip, indexTip);
  const thumbMiddleDist = distanceBetween(thumbTip, middleTip);
  const thumbPinkyDist = distanceBetween(thumbTip, pinkyTip);
  const indexMiddleDist = distanceBetween(indexTip, middleTip);
  const handWidth = distanceBetween(indexBase, pinkyBase);

  // Normalize distances relative to hand width
  const normThumbIndex = thumbIndexDist / (handWidth || 0.1);
  const normThumbMiddle = thumbMiddleDist / (handWidth || 0.1);
  const normIndexMiddle = indexMiddleDist / (handWidth || 0.1);

  // ISL Letter Classification Rules:

  // A: Fist with thumb beside (all fingers curled, thumb extended sideways)
  if (!index && !middle && !ring && !pinky && thumb) {
    return { letter: 'A', confidence: 0.85 };
  }

  // B: All four fingers extended up, thumb folded in
  if (!thumb && index && middle && ring && pinky) {
    return { letter: 'B', confidence: 0.85 };
  }

  // C: Curved hand (C-shape) - all fingers slightly curled, moderate curl
  if (!thumb && !index && !middle && !ring && !pinky) {
    const avgY = (indexTip.y + middleTip.y) / 2;
    const curvature = Math.abs(indexTip.x - thumbTip.x);
    if (curvature > 0.08 && curvature < 0.2) {
      return { letter: 'C', confidence: 0.75 };
    }
  }

  // D: Index finger pointing up, others curled, thumb touching middle
  if (index && !middle && !ring && !pinky && !thumb) {
    return { letter: 'D', confidence: 0.82 };
  }

  // E: All fingers curled inward, thumb tucked under
  if (!thumb && !index && !middle && !ring && !pinky) {
    if (thumbTip.y > indexBase.y) {
      return { letter: 'E', confidence: 0.75 };
    }
  }

  // F: Index and thumb touching, others extended
  if (!index && middle && ring && pinky && !thumb) {
    if (normThumbIndex < 0.3) {
      return { letter: 'F', confidence: 0.80 };
    }
  }

  // G: Index pointing sideways, thumb parallel
  if (index && !middle && !ring && !pinky && thumb) {
    const isHorizontal = Math.abs(indexTip.x - indexBase.x) > Math.abs(indexTip.y - indexBase.y);
    if (isHorizontal) {
      return { letter: 'G', confidence: 0.78 };
    }
  }

  // H: Index and middle extended horizontally
  if (index && middle && !ring && !pinky && !thumb) {
    const bothHorizontal = Math.abs(indexTip.x - indexBase.x) > 0.05;
    if (bothHorizontal) {
      return { letter: 'H', confidence: 0.76 };
    }
  }

  // I: Pinky only extended
  if (!thumb && !index && !middle && !ring && pinky) {
    return { letter: 'I', confidence: 0.88 };
  }

  // J: Pinky extended with wrist motion (static: like I)
  // We detect J as I with pinky pointed diagonally
  if (!thumb && !index && !middle && !ring && pinky) {
    if (pinkyTip.x < pinkyBase.x - 0.05) {
      return { letter: 'J', confidence: 0.70 };
    }
  }

  // K: Index and middle up, thumb up, others curled
  if (thumb && index && middle && !ring && !pinky) {
    return { letter: 'K', confidence: 0.80 };
  }

  // L: L-shape: index up, thumb out, others curled
  if (thumb && index && !middle && !ring && !pinky) {
    return { letter: 'L', confidence: 0.88 };
  }

  // M: Three fingers folded over thumb
  if (!thumb && !index && !middle && !ring && !pinky) {
    return { letter: 'M', confidence: 0.60 }; // fallback
  }

  // N: Two fingers folded over thumb (similar to M but 2)
  // Handled above in M

  // O: All fingers curved to make O shape with thumb
  if (!thumb && !index && !middle && !ring && !pinky) {
    if (normThumbIndex < 0.35) {
      return { letter: 'O', confidence: 0.75 };
    }
  }

  // P: Index pointing down, thumb out
  if (index && !middle && !ring && !pinky && thumb) {
    if (indexTip.y > indexBase.y + 0.05) {
      return { letter: 'P', confidence: 0.75 };
    }
  }

  // Q: Index pointing down, thumb out
  if (thumb && index && !middle && !ring && !pinky) {
    if (indexTip.y > wrist.y) {
      return { letter: 'Q', confidence: 0.72 };
    }
  }

  // R: Index and middle crossed
  if (!thumb && index && middle && !ring && !pinky) {
    if (Math.abs(indexTip.x - middleTip.x) < 0.03) {
      return { letter: 'R', confidence: 0.78 };
    }
  }

  // S: Fist with thumb over fingers
  if (!index && !middle && !ring && !pinky && !thumb) {
    return { letter: 'S', confidence: 0.65 };
  }

  // T: Thumb between index and middle
  if (!thumb && !index && !middle && !ring && !pinky) {
    if (thumbTip.y < indexBase.y && thumbTip.x > landmarks[5].x) {
      return { letter: 'T', confidence: 0.68 };
    }
  }

  // U: Index and middle up, close together
  if (!thumb && index && middle && !ring && !pinky) {
    if (normIndexMiddle < 0.25) {
      return { letter: 'U', confidence: 0.82 };
    }
  }

  // V: Index and middle up, spread apart (Victory/Peace)
  if (!thumb && index && middle && !ring && !pinky) {
    if (normIndexMiddle >= 0.25) {
      return { letter: 'V', confidence: 0.85 };
    }
  }

  // W: Index, middle, ring extended
  if (!thumb && index && middle && ring && !pinky) {
    return { letter: 'W', confidence: 0.85 };
  }

  // X: Index finger hooked
  if (!thumb && !middle && !ring && !pinky) {
    const hooked = indexTip.y > landmarks[7].y;
    if (hooked) {
      return { letter: 'X', confidence: 0.72 };
    }
  }

  // Y: Thumb and pinky extended (Shaka/Hang loose)
  if (thumb && !index && !middle && !ring && pinky) {
    return { letter: 'Y', confidence: 0.90 };
  }

  // Z: Index pointing, draws Z motion (static: index extended)
  if (!thumb && index && !middle && !ring && !pinky) {
    return { letter: 'Z', confidence: 0.78 };
  }

  // Default / Unknown
  return { letter: '?', confidence: 0.30 };
}

// ─── Main Engine Class ───────────────────────────────────────────────────────

export class ISLGestureEngine {
  private handLandmarker: HandLandmarker | null = null;
  private initialized = false;
  private lastGesture: ISLLetter | null = null;
  private gestureBuffer: ISLLetter[] = [];
  private readonly BUFFER_SIZE = 10;
  private readonly CONFIDENCE_THRESHOLD = 0.65;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
    );

    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.6,
      minHandPresenceConfidence: 0.6,
      minTrackingConfidence: 0.5,
    });

    this.initialized = true;
  }

  async processFrame(
    video: HTMLVideoElement,
    timestamp: number
  ): Promise<ISLGestureResult> {
    if (!this.handLandmarker || !this.initialized) {
      return { letter: null, confidence: 0, handDetected: false };
    }

    let result: HandLandmarkerResult;
    try {
      result = this.handLandmarker.detectForVideo(video, timestamp);
    } catch {
      return { letter: null, confidence: 0, handDetected: false };
    }

    if (!result.landmarks || result.landmarks.length === 0) {
      this.gestureBuffer = [];
      this.lastGesture = null;
      return { letter: null, confidence: 0, handDetected: false };
    }

    const landmarks = result.landmarks[0];
    const { letter, confidence } = classifyISLGesture(landmarks);

    // Temporal smoothing: collect into buffer
    if (letter && letter !== '?' && confidence >= this.CONFIDENCE_THRESHOLD) {
      this.gestureBuffer.push(letter);
      if (this.gestureBuffer.length > this.BUFFER_SIZE) {
        this.gestureBuffer.shift();
      }
    } else {
      this.gestureBuffer = [];
    }

    // Majority vote from buffer
    const stableLetter = this.getMajorityVote();

    const landmarkArray = landmarks.map(lm => [lm.x, lm.y, lm.z]);

    return {
      letter: stableLetter,
      confidence: stableLetter ? confidence : 0,
      handDetected: true,
      landmarks: landmarkArray,
    };
  }

  private getMajorityVote(): ISLLetter | null {
    if (this.gestureBuffer.length < 6) return null;
    const counts: Record<string, number> = {};
    for (const g of this.gestureBuffer) {
      counts[g] = (counts[g] || 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const [topLetter, topCount] = sorted[0];
    // Require at least 60% agreement
    if (topCount / this.gestureBuffer.length >= 0.6) {
      return topLetter;
    }
    return null;
  }

  destroy() {
    this.handLandmarker?.close();
    this.handLandmarker = null;
    this.initialized = false;
  }
}

export const islGestureEngine = new ISLGestureEngine();
