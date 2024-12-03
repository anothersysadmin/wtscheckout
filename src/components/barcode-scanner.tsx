import { useEffect, useRef, useCallback } from 'react';

type BarcodeScannerProps = {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
  minLength?: number;
  maxLength?: number;
  timeout?: number;
  prefix?: string[];
  suffix?: string[];
};

export function BarcodeScanner({
  onScan,
  onError,
  minLength = 1, // Changed from 5 to 1 to allow shorter barcodes
  maxLength = 50,
  timeout = 100,
  prefix = [],
  suffix = ['\n', '\r'],
}: BarcodeScannerProps) {
  const barcodeBuffer = useRef('');
  const timeoutRef = useRef<number>();
  const lastCharTime = useRef<number>(0);

  const resetBuffer = () => {
    barcodeBuffer.current = '';
  };

  const processBarcode = useCallback(() => {
    const barcode = barcodeBuffer.current;
    
    // Validate barcode
    if (barcode.length < minLength) {
      onError?.(`Barcode must be at least ${minLength} character${minLength === 1 ? '' : 's'}`);
      resetBuffer();
      return;
    }

    if (barcode.length > maxLength) {
      onError?.(`Barcode cannot be longer than ${maxLength} characters`);
      resetBuffer();
      return;
    }

    // Remove prefix and suffix if present
    let processedBarcode = barcode;
    prefix.forEach(p => {
      if (processedBarcode.startsWith(p)) {
        processedBarcode = processedBarcode.slice(p.length);
      }
    });
    suffix.forEach(s => {
      if (processedBarcode.endsWith(s)) {
        processedBarcode = processedBarcode.slice(0, -s.length);
      }
    });

    onScan(processedBarcode);
    resetBuffer();
  }, [onScan, onError, minLength, maxLength, prefix, suffix]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastCharTime.current;
      const isLikelyScanner = timeDiff < 50;

      lastCharTime.current = currentTime;

      if (!isLikelyScanner && barcodeBuffer.current.length > 0) {
        resetBuffer();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        processBarcode();
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => {
          if (barcodeBuffer.current.length >= minLength) {
            processBarcode();
          } else {
            resetBuffer();
          }
        }, timeout);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [processBarcode, timeout, minLength]);

  return null;
}
