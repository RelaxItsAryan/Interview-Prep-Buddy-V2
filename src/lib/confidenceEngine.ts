import { FaceLandmarker, PoseLandmarker, FilesetResolver, Landmark } from "@mediapipe/tasks-vision";

export interface WebcamConfidenceResult {
  confidence: 'Confident' | 'Neutral' | 'Low';
  probability: number;
  all_probabilities: Record<'Confident' | 'Neutral' | 'Low', number>;
}

export interface ConfidenceMetrics {
  eyeContact: number;
  posture: number;
  stability: number;
  total: number;
}

export class ConfidenceEngine {
  private faceLandmarker: FaceLandmarker | null = null;
  private poseLandmarker: PoseLandmarker | null = null;
  private noseHistory: { x: number; y: number }[] = [];
  private readonly HISTORY_LIMIT = 30;

  /**
   * Initializes the MediaPipe Face and Pose Landmarkers
   */
  async initialize() {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
      );

      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
        },
        runningMode: "VIDEO",
        numFaces: 1
      });

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
        },
        runningMode: "VIDEO",
        numPoses: 1
      });
      
      console.log("Confidence Engine initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Confidence Engine:", error);
      throw error;
    }
  }

  /**
   * Calculates Eye Contact (45%): Measures pupil position relative to eye bounds.
   */
  calculateEyeContact(landmarks: Landmark[]) {
    const irisIndices = [468, 469, 470, 471]; // Center of the left iris
    const iris = this.getAveragePoint(irisIndices.map(i => landmarks[i]));
    const innerCorner = landmarks[133];
    const outerCorner = landmarks[33];

    // Normalized ratio (0.5 is centered)
    const ratio = (iris.x - innerCorner.x) / (outerCorner.x - innerCorner.x);
    const deviation = Math.abs(ratio - 0.5);
    
    // Scale: 100% at 0.5 center, drops off as you look away
    return Math.max(0, 100 - (deviation * 300));
  }

  /**
   * Calculates Posture (35%): Measures shoulder tilt and alignment.
   */
  calculatePosture(landmarks: Landmark[]) {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    
    // Deviation from a flat horizontal line
    const tilt = Math.abs(leftShoulder.y - rightShoulder.y);
    return Math.max(0, 100 - (tilt * 500));
  }

  /**
   * Calculates Stability (20%): Measures movement variance of the nose tip.
   */
  calculateStability(noseLandmark: Landmark) {
    this.noseHistory.push({ x: noseLandmark.x, y: noseLandmark.y });
    if (this.noseHistory.length > this.HISTORY_LIMIT) {
      this.noseHistory.shift();
    }

    if (this.noseHistory.length < 2) return 100;

    const varianceX = this.getVariance(this.noseHistory.map(p => p.x));
    const varianceY = this.getVariance(this.noseHistory.map(p => p.y));
    const avgVariance = (varianceX + varianceY) / 2;

    // Stability score: 100 is perfectly still, drops as movement increases
    // Threshold adjusted for typical webcam jitter
    return Math.max(0, 100 - (avgVariance * 150000));
  }

  private getAveragePoint(points: Landmark[]) {
    return {
      x: points.reduce((s, p) => s + p.x, 0) / points.length,
      y: points.reduce((s, p) => s + p.y, 0) / points.length,
    };
  }

  private getVariance(values: number[]) {
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    return values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length;
  }

  /**
   * Processes a video frame and returns confidence metrics
   */
  async processFrame(video: HTMLVideoElement, timestamp: number): Promise<ConfidenceMetrics | null> {
    if (!this.faceLandmarker || !this.poseLandmarker) return null;

    const faceResults = this.faceLandmarker.detectForVideo(video, timestamp);
    const poseResults = this.poseLandmarker.detectForVideo(video, timestamp);

    let eyeContact = 0;
    let posture = 0;
    let stability = 0;

    if (faceResults.faceLandmarks?.[0]) {
      eyeContact = this.calculateEyeContact(faceResults.faceLandmarks[0]);
    }

    if (poseResults.landmarks?.[0]) {
      posture = this.calculatePosture(poseResults.landmarks[0]);
      stability = this.calculateStability(poseResults.landmarks[0][0]); // 0 is nose index in pose
    }

    // Weighting: Eye Contact (45%), Posture (35%), Stability (20%)
    const total = (eyeContact * 0.45) + (posture * 0.35) + (stability * 0.20);

    return { 
      eyeContact: Math.round(eyeContact), 
      posture: Math.round(posture), 
      stability: Math.round(stability), 
      total: Math.round(total) 
    };
  }
}

export const confidenceEngine = new ConfidenceEngine();
export default confidenceEngine;
