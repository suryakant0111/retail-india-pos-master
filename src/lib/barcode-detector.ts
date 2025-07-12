// Barcode Detection Utility
// Provides a consistent interface for barcode detection

interface BarcodeDetectionResult {
  success: boolean;
  barcode?: string;
  error?: string;
}

class BarcodeDetector {
  private detector: any = null;
  private isSupported: boolean = false;

  constructor() {
    this.initializeDetector();
  }

  private initializeDetector() {
    // Check if BarcodeDetector is supported
    if ('BarcodeDetector' in window) {
      try {
        this.detector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93']
        });
        this.isSupported = true;
      } catch (error) {
        console.warn('BarcodeDetector initialization failed:', error);
        this.isSupported = false;
      }
    } else {
      this.isSupported = false;
    }
  }

  isBarcodeDetectionSupported(): boolean {
    return this.isSupported;
  }

  async detectFromVideo(video: HTMLVideoElement): Promise<BarcodeDetectionResult> {
    if (!this.isSupported || !this.detector) {
      console.log('[BarcodeDetector] Detection not supported');
      return {
        success: false,
        error: 'Barcode detection not supported in this browser'
      };
    }

    try {
      console.log('[BarcodeDetector] Starting video detection...');
      console.log('[BarcodeDetector] Video dimensions:', video.videoWidth, 'x', video.videoHeight);
      
      // Create a canvas to capture the video frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('[BarcodeDetector] Failed to get canvas context');
        return {
          success: false,
          error: 'Failed to get canvas context'
        };
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      console.log('[BarcodeDetector] Canvas dimensions:', canvas.width, 'x', canvas.height);
      
      // Draw the current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      console.log('[BarcodeDetector] Video frame captured, detecting barcodes...');
      
      // Detect barcodes in the image
      const barcodes = await this.detector.detect(canvas);
      
      console.log('[BarcodeDetector] Detection completed, found barcodes:', barcodes.length);
      
      if (barcodes.length > 0) {
        // Return the first detected barcode
        console.log('[BarcodeDetector] First barcode:', barcodes[0].rawValue);
        return {
          success: true,
          barcode: barcodes[0].rawValue
        };
      }
      
      console.log('[BarcodeDetector] No barcodes detected');
      return {
        success: false,
        error: 'No barcode detected'
      };
      
    } catch (error) {
      console.error('[BarcodeDetector] Detection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Detection failed'
      };
    }
  }

  async detectFromImage(imageUrl: string): Promise<BarcodeDetectionResult> {
    if (!this.isSupported || !this.detector) {
      return {
        success: false,
        error: 'Barcode detection not supported in this browser'
      };
    }

    try {
      const barcodes = await this.detector.detect(imageUrl);
      
      if (barcodes.length > 0) {
        return {
          success: true,
          barcode: barcodes[0].rawValue
        };
      }
      
      return {
        success: false,
        error: 'No barcode detected'
      };
      
    } catch (error) {
      console.error('Barcode detection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Detection failed'
      };
    }
  }
}

// Create a singleton instance
export const barcodeDetector = new BarcodeDetector(); 