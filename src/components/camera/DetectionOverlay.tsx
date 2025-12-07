import { useState } from 'react';
import { Detection } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { searchProducts } from '@/services/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface DetectionOverlayProps {
  detections: Detection[];
}

export function DetectionOverlay({ detections }: DetectionOverlayProps) {
  const { dispatch, speak } = useApp();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleSelectDetection = async (detection: Detection) => {
    speak(`Selected ${detection.label || detection.class_name}. Loading product details.`);
    setLoadingId(detection.id);

    try {
      // Search for product in database
      const response = await searchProducts(
        detection.brand || '',
        detection.product_name || detection.class_name,
        detection.quantity_text
      );

      if (response.status === 'ok' && response.matches.length > 0) {
        const match = response.matches[0];

        // Map API ProductMatch to frontend Product format
        const product = {
          productId: match.product_id,
          name: `${match.brand} ${match.name}`.trim(),
          description: match.description,
          imageUrl: match.image_url,
          brand: match.brand,
          variants: match.variants.map((v, i) => ({
            variantId: `V${i + 1}`,
            size: v.size,
            price: v.price,
            unitPrice: v.price,
            stock: 99, // Backend should return stock in future
          })),
        };

        dispatch({ type: 'SET_CURRENT_PRODUCT', payload: product });
        dispatch({ type: 'TOGGLE_PRODUCT_MODAL', payload: true });
        speak(`Found ${product.name}. ${product.variants.length} sizes available.`);
      } else {
        // Fallback: Product not in database
        speak('Product not found in database. Using detected information.');

        const fallbackProduct = {
          productId: detection.id,
          name: detection.label || detection.class_name,
          description: detection.raw_text || 'Detected product',
          brand: detection.brand,
          variants: [
            {
              variantId: 'V1',
              size: detection.quantity_text || 'Standard',
              price: 100,  // Default fallback price
              unitPrice: 100,
              stock: 99
            },
          ],
        };

        dispatch({ type: 'SET_CURRENT_PRODUCT', payload: fallbackProduct });
        dispatch({ type: 'TOGGLE_PRODUCT_MODAL', payload: true });
      }
    } catch (error) {
      console.error('Product lookup error:', error);
      speak('Could not load product details. Please try again.');
      toast.error('Product lookup failed', {
        description: 'Check your connection to the server.',
      });
    } finally {
      setLoadingId(null);
    }
  };

  if (detections.length === 0) return null;

  return (
    <div className="absolute inset-0" aria-hidden="false">
      {detections.map((detection) => {
        // Handle both [x1, y1, x2, y2] and [x, y, width, height] formats
        const bbox = detection.bbox;
        let x: number, y: number, width: number, height: number;

        if (bbox.length >= 4) {
          // Assume [x1, y1, x2, y2] format from YOLO
          const [x1, y1, x2, y2] = bbox;
          x = x1;
          y = y1;
          width = x2 - x1;
          height = y2 - y1;
        } else {
          // Fallback to percentage-based positioning
          x = 10;
          y = 10;
          width = 80;
          height = 80;
        }

        const confidence = Math.round(detection.confidence * 100);
        const displayLabel = detection.label || detection.class_name;
        const isLoading = loadingId === detection.id;

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
                <span className="max-w-[200px] truncate">{displayLabel}</span>
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
              className="absolute opacity-0 focus:opacity-100 hover:opacity-50"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${width}px`,
                height: `${height}px`,
              }}
              onClick={() => handleSelectDetection(detection)}
              disabled={isLoading}
              aria-label={`Select detected product ${displayLabel}, confidence ${confidence} percent`}
              aria-describedby={`detection-desc-${detection.id}`}
            >
              {isLoading && (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              )}
              <span id={`detection-desc-${detection.id}`} className="sr-only">
                Press Enter to view product details for {displayLabel}
              </span>
            </Button>
          </div>
        );
      })}
    </div>
  );
}
