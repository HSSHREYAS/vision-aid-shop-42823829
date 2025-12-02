import { Detection } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';

interface DetectionOverlayProps {
  detections: Detection[];
}

export function DetectionOverlay({ detections }: DetectionOverlayProps) {
  const { dispatch, speak } = useApp();

  const handleSelectDetection = (detection: Detection) => {
    speak(`Selected ${detection.label}. Loading product details.`);
    
    // Mock product data - in production this would come from API
    const mockProduct = {
      productId: detection.suggestedProductId || 'PRD001',
      name: detection.label,
      description: 'Fresh dairy product',
      variants: [
        { variantId: 'V1', size: '500 ml', price: 45, unitPrice: 90, stock: 12 },
        { variantId: 'V2', size: '1 L', price: 80, unitPrice: 80, stock: 3 },
        { variantId: 'V3', size: '200 ml', price: 22, unitPrice: 110, stock: 25 },
      ],
    };

    dispatch({ type: 'SET_CURRENT_PRODUCT', payload: mockProduct });
    dispatch({ type: 'TOGGLE_PRODUCT_MODAL', payload: true });
  };

  if (detections.length === 0) return null;

  return (
    <div className="absolute inset-0" aria-hidden="false">
      {detections.map((detection) => {
        const [x, y, width, height] = detection.bbox;
        const confidence = Math.round(detection.confidence * 100);

        return (
          <div key={detection.id}>
            {/* Visual bounding box */}
            <div
              className="detection-box"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${width}px`,
                height: `${height}px`,
              }}
              aria-hidden="true"
            >
              {/* Label */}
              <div className="absolute -top-8 left-0 flex items-center gap-2 rounded-lg bg-primary/90 px-3 py-1 text-sm font-medium text-primary-foreground shadow-glow-cyan">
                <span>{detection.label}</span>
                <span className="rounded bg-background/20 px-1.5 py-0.5 text-xs">
                  {confidence}%
                </span>
              </div>

              {/* Corner accents */}
              <div className="absolute -left-1 -top-1 h-4 w-4 border-l-2 border-t-2 border-primary" />
              <div className="absolute -right-1 -top-1 h-4 w-4 border-r-2 border-t-2 border-primary" />
              <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-primary" />
              <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-primary" />
            </div>

            {/* Accessible button overlay */}
            <Button
              variant="ghost"
              className="absolute opacity-0 focus:opacity-100"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${width}px`,
                height: `${height}px`,
              }}
              onClick={() => handleSelectDetection(detection)}
              aria-label={`Select detected product ${detection.label}, confidence ${confidence} percent`}
              aria-describedby={`detection-desc-${detection.id}`}
            >
              <span id={`detection-desc-${detection.id}`} className="sr-only">
                Press Enter to view product details for {detection.label}
              </span>
            </Button>
          </div>
        );
      })}
    </div>
  );
}
