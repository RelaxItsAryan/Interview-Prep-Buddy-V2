import React, { useEffect, useRef, useState } from 'react';
import { Pose } from '@mediapipe/pose';
import { extractPoseFeatures, scoreConfidenceFromProbability, PoseFeatures } from '@/lib/poseFeatures';
import { predictWebcamConfidence, WebcamConfidenceResult } from '@/lib/confidenceApi';

interface CameraPreviewProps {
  className?: string;
  onConfidenceUpdate?: (result: WebcamConfidenceResult | null) => void;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({ className = '', onConfidenceUpdate }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseRef = useRef<Pose | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastPredictionRef = useRef(0);
  const inFlightRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [liveResult, setLiveResult] = useState<WebcamConfidenceResult | null>(null);

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});

          const pose = new Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
          });

          pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

          pose.onResults(async (results) => {
            const landmarks = results.poseLandmarks;
            if (!mounted || !landmarks) {
              return;
            }

            const now = Date.now();
            if (now - lastPredictionRef.current < 2000 || inFlightRef.current) {
              return;
            }

            const features = extractPoseFeatures(landmarks as PoseFeatures[] | any);
            if (!features) {
              return;
            }

            inFlightRef.current = true;
            lastPredictionRef.current = now;

            try {
              const result = await predictWebcamConfidence(features);
              if (!mounted) {
                return;
              }

              const decorated = {
                ...result,
                probability: result.probability,
              };
              setLiveResult(decorated);
              onConfidenceUpdate?.(decorated);
            } catch (predictionError) {
              console.error('Confidence prediction error:', predictionError);
            } finally {
              inFlightRef.current = false;
            }
          });

          poseRef.current = pose;

          const processFrame = async () => {
            if (!mounted || !poseRef.current || !videoRef.current || videoRef.current.readyState < 2) {
              rafRef.current = requestAnimationFrame(processFrame);
              return;
            }

            try {
              await poseRef.current.send({ image: videoRef.current });
            } catch (poseError) {
              console.error('Pose detection error:', poseError);
            }

            rafRef.current = requestAnimationFrame(processFrame);
          };

          rafRef.current = requestAnimationFrame(processFrame);
        }
      } catch (err) {
        console.error('Camera access error:', err);
        setError('Unable to access camera');
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (poseRef.current) {
        poseRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      onConfidenceUpdate?.(null);
    };
  }, [onConfidenceUpdate]);

  return (
    <div className={`bg-muted/10 rounded-xl overflow-hidden border border-border/30 relative ${className}`}>
      {error ? (
        <div className="p-3 text-xs text-center text-muted-foreground">{error}</div>
      ) : (
        <>
          <video
            ref={videoRef}
            className="w-full h-full object-cover bg-black"
            playsInline
            muted
          />
          <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-black/55 px-3 py-2 text-white backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs">
              <span>Live camera analysis</span>
              <span>
                {liveResult ? `${liveResult.confidence} ${scoreConfidenceFromProbability(liveResult.probability)}%` : 'Waiting...'}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraPreview;
