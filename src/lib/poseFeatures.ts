export interface PoseLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface PoseFeatures {
  eye_shoulder_y_ratio: number;
  shoulder_y_diff: number;
  wrist_distance_x: number;
  wrist_shoulder_ratio: number;
  nose_eye_center_offset_x: number;
  shoulder_span: number;
  hip_shoulder_y_diff: number;
  body_lean_x: number;
  shoulder_center_x: number;
  hip_center_x: number;
  spine_angle: number;
  eye_distance: number;
  head_tilt_angle: number;
  eye_distance_ratio: number;
  shoulder_slope: number;
  head_direction: string;
  arm_position: string;
  posture: string;
}

const distance = (a: PoseLandmark, b: PoseLandmark) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const extractPoseFeatures = (landmarks: PoseLandmark[]): PoseFeatures | null => {
  if (!landmarks || landmarks.length < 25) {
    return null;
  }

  const nose = landmarks[0];
  const leftEye = landmarks[2] || landmarks[1];
  const rightEye = landmarks[5] || landmarks[4];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  if (!nose || !leftEye || !rightEye || !leftShoulder || !rightShoulder || !leftWrist || !rightWrist || !leftHip || !rightHip) {
    return null;
  }

  const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
  const hipCenterX = (leftHip.x + rightHip.x) / 2;
  const hipCenterY = (leftHip.y + rightHip.y) / 2;
  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;

  const shoulderSpan = Math.max(distance(leftShoulder, rightShoulder), 0.0001);
  const eyeDistance = Math.max(distance(leftEye, rightEye), 0.0001);
  const wristDistanceX = Math.abs(leftWrist.x - rightWrist.x);
  const eyeToShoulderY = eyeCenterY - shoulderCenterY;
  const hipShoulderYDiff = hipCenterY - shoulderCenterY;
  const bodyLeanX = shoulderCenterX - hipCenterX;
  const shoulderYDiff = leftShoulder.y - rightShoulder.y;
  const shoulderSlope = shoulderYDiff;
  const eyeShoulderYRatio = eyeToShoulderY / shoulderSpan;
  const wristShoulderRatio = wristDistanceX / shoulderSpan;
  const noseEyeCenterOffsetX = nose.x - eyeCenterX;
  const eyeDistanceRatio = eyeDistance / shoulderSpan;
  const spineAngle = (Math.atan2(shoulderCenterY - hipCenterY, shoulderCenterX - hipCenterX) * 180) / Math.PI;
  const headTiltAngle = (Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180) / Math.PI;

  let headDirection = 'Center';
  if (noseEyeCenterOffsetX > 0.03) {
    headDirection = 'Looking Right';
  } else if (noseEyeCenterOffsetX < -0.03) {
    headDirection = 'Looking Left';
  } else if (Math.abs(noseEyeCenterOffsetX) <= 0.015) {
    headDirection = 'Looking Straight';
  }

  let armPosition = 'Partially Open';
  if (wristDistanceX < shoulderSpan * 0.9) {
    armPosition = 'Closed Arms';
  } else if (wristDistanceX > shoulderSpan * 1.3) {
    armPosition = 'Open Arms';
  }

  let posture = 'Upright';
  if (hipShoulderYDiff > 0.15 || Math.abs(bodyLeanX) > 0.12) {
    posture = 'Slouched';
  } else if (Math.abs(shoulderSlope) > 0.04 || Math.abs(spineAngle) < 82) {
    posture = 'Stiff';
  }

  return {
    eye_shoulder_y_ratio: eyeShoulderYRatio,
    shoulder_y_diff: shoulderYDiff,
    wrist_distance_x: wristDistanceX,
    wrist_shoulder_ratio: wristShoulderRatio,
    nose_eye_center_offset_x: noseEyeCenterOffsetX,
    shoulder_span: shoulderSpan,
    hip_shoulder_y_diff: hipShoulderYDiff,
    body_lean_x: bodyLeanX,
    shoulder_center_x: shoulderCenterX,
    hip_center_x: hipCenterX,
    spine_angle: spineAngle,
    eye_distance: eyeDistance,
    head_tilt_angle: headTiltAngle,
    eye_distance_ratio: eyeDistanceRatio,
    shoulder_slope: shoulderSlope,
    head_direction,
    arm_position,
    posture,
  };
};

export const scoreConfidenceFromProbability = (probability: number) =>
  Math.round(clamp(probability, 0, 1) * 100);
