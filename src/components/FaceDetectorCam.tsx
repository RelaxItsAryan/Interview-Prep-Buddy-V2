import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CameraOff, Loader2 } from 'lucide-react';

interface FaceDetectorCamProps {
  onScoreUpdate: (score: number) => void;
  isActive: boolean;
}

const FaceDetectorCam: React.FC<FaceDetectorCamProps> = ({ onScoreUpdate, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [detector, setDetector] = useState<FaceDetector | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasCameraError, setHasCameraError] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const requestRef = useRef<number>();

  // Initialize MediaPipe Face Detector
  useEffect(() => {
    const initializeMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const faceDetector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
            delegate: "GPU"
          },
          runningMode: "VIDEO"
        });
        setDetector(faceDetector);
      } catch (error) {
        console.error("Failed to initialize Face Detector", error);
      } finally {
        setIsInitializing(false);
      }
    };
    initializeMediaPipe();
    
    return () => {
      if (detector) {
        detector.close();
      }
    };
  }, []);

  // Setup camera
  useEffect(() => {
    if (!isActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      return;
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
        setHasCameraError(false);
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraError(true);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  // Detection loop
  const detectFaces = useCallback(async () => {
    if (!videoRef.current || !detector || !isActive) return;

    const video = videoRef.current;
    if (video.currentTime !== lastVideoTimeRef.current && video.readyState === 4) {
      lastVideoTimeRef.current = video.currentTime;
      const startTimeMs = performance.now();
      const results = detector.detectForVideo(video, startTimeMs);
      
      if (results.detections.length > 0) {
        // Average confidence score of detected faces
        const avgScore = results.detections.reduce((acc, curr) => acc + curr.categories[0].score, 0) / results.detections.length;
        onScoreUpdate(avgScore);
      } else {
        // No face detected -> 0 score
        onScoreUpdate(0);
      }
    }
    requestRef.current = requestAnimationFrame(detectFaces);
  }, [detector, isActive, onScoreUpdate]);

  useEffect(() => {
    if (isActive && detector && !hasCameraError) {
      requestRef.current = requestAnimationFrame(detectFaces);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [detectFaces, isActive, detector, hasCameraError]);

  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader className="py-3 px-4 bg-muted/30">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {isInitializing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isActive ? (
            <Camera className="w-4 h-4 text-green-500" />
          ) : (
            <CameraOff className="w-4 h-4 text-muted-foreground" />
          )}
          Face Detector
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 bg-black relative aspect-video flex-col flex items-center justify-center">
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="text-xs">Loading Model...</span>
          </div>
        )}
        {hasCameraError && !isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center text-red-400 text-xs text-center p-4">
            Camera access denied or unavailable.
          </div>
        )}
        {!isActive && !isInitializing && !hasCameraError && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
            Start answering to activate camera
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover shadow-inner ${(!isActive || isInitializing || hasCameraError) ? 'hidden' : ''}`}
        />
      </CardContent>
    </Card>
  );
};

export default FaceDetectorCam;