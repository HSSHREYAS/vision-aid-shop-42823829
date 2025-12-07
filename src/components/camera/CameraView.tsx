import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { DetectionOverlay } from './DetectionOverlay';
import { predictProducts, getAudioUrl } from '@/services/api';
import { toast } from 'sonner';
import {
  Camera,
  CameraOff,
  SwitchCamera,
  Flashlight,
  CircleDot,
  HelpCircle,
  Upload,
  Focus,
  Loader2,
} from 'lucide-react';
import { CameraState, FacingMode, Detection } from '@/types';

export interface CameraViewRef {
  startCamera: () => void;
  stopCamera: () => void;
  captureFrame: () => void;
  toggleContinuousMode: () => void;
  getCameraState: () => CameraState;
}

export const CameraView = forwardRef<CameraViewRef>(function CameraView(_, ref) {
  const { state, dispatch, speak, announce } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const continuousIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check for multiple cameras
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
    });
  }, []);

  const startCamera = useCallback(async () => {
    setCameraState('initializing');
    announce('Initializing camera...');

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Check torch capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
      setHasTorch(!!capabilities.torch);

      // Set streaming state first so video element renders
      setCameraState('streaming');
      dispatch({ type: 'SET_CAMERA_ACTIVE', payload: true });
      speak('Camera ready. Point at a product and press Capture to scan.');

    } catch (error) {
      console.error('Camera error:', error);
      setCameraState('error');
      speak('Camera permission required. Please grant access to continue.');
    }
  }, [facingMode, dispatch, speak, announce]);

  // Attach stream to video element when it becomes available
  useEffect(() => {
    if (cameraState === 'streaming' && streamRef.current && videoRef.current) {
      const videoElement = videoRef.current;
      videoElement.srcObject = streamRef.current;
      videoElement.play().catch(console.error);
    }
  }, [cameraState]);

  const stopCamera = useCallback(() => {
    // Stop continuous mode if running
    if (continuousIntervalRef.current) {
      clearInterval(continuousIntervalRef.current);
      continuousIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState('idle');
    dispatch({ type: 'SET_CAMERA_ACTIVE', payload: false });
    dispatch({ type: 'SET_DETECTIONS', payload: [] });
    announce('Camera stopped.');
  }, [dispatch, announce]);

  const switchCamera = useCallback(() => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    if (cameraState === 'streaming') {
      stopCamera();
      setTimeout(() => startCamera(), 100);
    }
    announce(`Switched to ${newMode === 'environment' ? 'back' : 'front'} camera.`);
  }, [facingMode, cameraState, stopCamera, startCamera, announce]);

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current || !hasTorch) return;

    const track = streamRef.current.getVideoTracks()[0];
    const newTorchState = !torchEnabled;

    try {
      await track.applyConstraints({
        advanced: [{ torch: newTorchState } as MediaTrackConstraintSet],
      });
      setTorchEnabled(newTorchState);
      announce(`Flash ${newTorchState ? 'on' : 'off'}.`);
    } catch (error) {
      console.error('Torch error:', error);
    }
  }, [hasTorch, torchEnabled, announce]);

  // Real frame capture and API call
  const captureFrame = useCallback(async () => {
    if (!videoRef.current || cameraState !== 'streaming' || isProcessing) {
      if (isProcessing) {
        speak('Still processing previous scan. Please wait.');
      }
      return;
    }

    setIsProcessing(true);
    dispatch({ type: 'SET_LOADING', payload: true });
    announce('Capturing and analyzing product...');
    speak('Analyzing product. Please hold steady.');

    try {
      // Create canvas and capture frame
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      ctx.drawImage(video, 0, 0);

      // Convert to base64 JPEG
      const imageData = canvas.toDataURL('image/jpeg', 0.85);

      // Call prediction API
      const response = await predictProducts({
        image: imageData,
        include_audio: true,
        language: 'en',
        min_confidence: 0.3,
      });

      if (response.status === 'ok' && response.detections.length > 0) {
        // Transform detections for frontend display
        const detections: Detection[] = response.detections.map((d) => ({
          ...d,
          // Create combined label for display
          label: [d.brand, d.product_name || d.class_name, d.quantity_text]
            .filter(Boolean)
            .join(' ')
            .trim() || d.class_name,
        }));

        dispatch({ type: 'SET_DETECTIONS', payload: detections });

        // Use summary from backend or create our own
        const summary = response.summary ||
          `Detected ${detections.length} product${detections.length > 1 ? 's' : ''}. ${detections[0].label}. ${detections.length > 1 ? `And ${detections.length - 1} more.` : ''}`;

        speak(summary);
        announce(summary);

        // Play audio from TTS if available
        if (response.audio_url) {
          try {
            const audio = new Audio(getAudioUrl(response.audio_url));
            audio.volume = 0.8;
            // Don't await - let it play in background
            audio.play().catch((e) => console.warn('Audio playback failed:', e));
          } catch (audioError) {
            console.warn('Could not play audio:', audioError);
          }
        }

        toast.success(`Detected ${detections.length} product${detections.length > 1 ? 's' : ''}`, {
          description: detections[0].label,
        });
      } else {
        dispatch({ type: 'SET_DETECTIONS', payload: [] });
        speak('No products detected. Try moving closer or adjusting the angle.');
        toast.info('No products detected', {
          description: 'Try moving the camera closer to the product.',
        });
      }
    } catch (error) {
      console.error('Detection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      speak('Detection failed. Please check your connection and try again.');
      toast.error('Detection failed', {
        description: errorMessage.includes('fetch') ? 'Backend not available' : errorMessage,
      });
    } finally {
      setIsProcessing(false);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [cameraState, isProcessing, dispatch, announce, speak]);

  const toggleContinuousMode = useCallback(() => {
    const newState = !state.isContinuousMode;
    dispatch({ type: 'TOGGLE_CONTINUOUS_MODE' });

    if (newState) {
      // Start continuous detection - capture every 3 seconds
      announce('Continuous detection enabled. Scanning every 3 seconds.');
      speak('Live detection on. I will scan continuously.');

      continuousIntervalRef.current = setInterval(() => {
        if (cameraState === 'streaming' && !isProcessing) {
          captureFrame();
        }
      }, 3000);
    } else {
      // Stop continuous detection
      if (continuousIntervalRef.current) {
        clearInterval(continuousIntervalRef.current);
        continuousIntervalRef.current = null;
      }
      announce('Continuous detection disabled.');
      speak('Live detection off.');
    }
  }, [dispatch, state.isContinuousMode, cameraState, isProcessing, captureFrame, announce, speak]);

  // Cleanup continuous mode on unmount
  useEffect(() => {
    return () => {
      if (continuousIntervalRef.current) {
        clearInterval(continuousIntervalRef.current);
      }
    };
  }, []);

  // Expose functions to parent component via ref
  useImperativeHandle(ref, () => ({
    startCamera,
    stopCamera,
    captureFrame,
    toggleContinuousMode,
    getCameraState: () => cameraState,
  }), [startCamera, stopCamera, captureFrame, toggleContinuousMode, cameraState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        cameraState === 'streaming' ? stopCamera() : startCamera();
      } else if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        switchCamera();
      } else if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        toggleContinuousMode();
      } else if ((e.key === ' ' || e.key === 'Enter') && document.activeElement?.closest('.camera-container')) {
        e.preventDefault();
        captureFrame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cameraState, startCamera, stopCamera, switchCamera, toggleContinuousMode, captureFrame]);

  return (
    <div className="camera-container flex flex-col gap-4">
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Camera Viewfinder */}
      <div className="camera-viewfinder relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-glass">
        {cameraState === 'streaming' ? (
          <>
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              autoPlay
              playsInline
              muted
              aria-hidden="true"
            />
            {/* Scanning line effect */}
            <div className="scan-line" aria-hidden="true" />
            {/* Detection overlay */}
            <DetectionOverlay detections={state.detections} />
            {/* Corner guides */}
            <div className="pointer-events-none absolute inset-8">
              <div className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-primary/60" />
              <div className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-primary/60" />
              <div className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-primary/60" />
              <div className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-primary/60" />
            </div>
            {/* Processing overlay */}
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3 rounded-xl bg-card/90 p-6 shadow-lg">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <span className="text-sm font-medium text-foreground">Analyzing...</span>
                </div>
              </div>
            )}
          </>
        ) : cameraState === 'error' ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <CameraOff className="h-16 w-16 text-destructive" />
            <h3 className="text-xl font-semibold text-foreground">Camera Permission Required</h3>
            <p className="text-muted-foreground">
              Allow camera access to identify products.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="default" onClick={startCamera}>
                Grant Camera Access
              </Button>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Upload Image
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
            <div className="relative">
              <Camera className="h-20 w-20 text-primary animate-float" />
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" aria-hidden="true" />
            </div>
            <div className="text-center">
              <h3 className="mb-2 text-xl font-semibold text-foreground">
                Ready to Scan Products
              </h3>
              <p className="text-muted-foreground">
                Press the button below to start the camera
              </p>
            </div>
            <Button
              variant="hero"
              size="xl"
              onClick={startCamera}
              aria-label="Start camera"
              className="min-w-[200px]"
            >
              <Camera className="mr-2 h-5 w-5" />
              Start Camera
            </Button>
          </div>
        )}

        {/* Continuous mode indicator */}
        {state.isContinuousMode && cameraState === 'streaming' && (
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-success/20 px-3 py-1.5 text-sm font-medium text-success">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            Live Detection
          </div>
        )}
      </div>

      {/* Camera Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Start/Stop Camera */}
        <Button
          variant={cameraState === 'streaming' ? 'destructive' : 'default'}
          size="accessible"
          onClick={cameraState === 'streaming' ? stopCamera : startCamera}
          aria-label={cameraState === 'streaming' ? 'Stop camera' : 'Start camera'}
          title={cameraState === 'streaming' ? 'Stop camera (Ctrl+Shift+C)' : 'Start camera (Ctrl+Shift+C)'}
          disabled={cameraState === 'initializing'}
        >
          {cameraState === 'streaming' ? (
            <>
              <CameraOff className="mr-2 h-5 w-5" />
              Stop Camera
            </>
          ) : (
            <>
              <Camera className="mr-2 h-5 w-5" />
              Start Camera
            </>
          )}
        </Button>

        {/* Capture */}
        <Button
          variant="outline"
          size="accessible"
          onClick={captureFrame}
          disabled={cameraState !== 'streaming' || isProcessing}
          aria-label="Capture snapshot"
          title="Take a snapshot for better recognition (Space)"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Focus className="mr-2 h-5 w-5" />
              Capture
            </>
          )}
        </Button>

        {/* Continuous Mode Toggle */}
        <Button
          variant={state.isContinuousMode ? 'secondary' : 'outline'}
          size="accessible"
          onClick={toggleContinuousMode}
          aria-pressed={state.isContinuousMode}
          aria-label={`Continuous detection ${state.isContinuousMode ? 'on' : 'off'}`}
          title="Stream frames continuously for instant recognition (Ctrl+M)"
          disabled={cameraState !== 'streaming'}
        >
          <CircleDot className="mr-2 h-5 w-5" />
          {state.isContinuousMode ? 'Live: ON' : 'Live: OFF'}
        </Button>

        {/* Switch Camera */}
        {hasMultipleCameras && (
          <Button
            variant="glass"
            size="icon-lg"
            onClick={switchCamera}
            disabled={cameraState !== 'streaming'}
            aria-label="Switch between front and back camera"
            title="Switch Camera (Ctrl+K)"
          >
            <SwitchCamera className="h-5 w-5" />
          </Button>
        )}

        {/* Torch/Flash */}
        {hasTorch && (
          <Button
            variant={torchEnabled ? 'secondary' : 'glass'}
            size="icon-lg"
            onClick={toggleTorch}
            disabled={cameraState !== 'streaming'}
            aria-pressed={torchEnabled}
            aria-label={`Flash ${torchEnabled ? 'on' : 'off'}`}
            title="Toggle flash"
          >
            <Flashlight className="h-5 w-5" />
          </Button>
        )}

        {/* Help */}
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="Help and tutorial"
          title="Help (?)"
          asChild
        >
          <a href="/help">
            <HelpCircle className="h-5 w-5" />
          </a>
        </Button>
      </div>
    </div>
  );
});
