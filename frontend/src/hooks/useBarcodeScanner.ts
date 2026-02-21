import { useEffect, useCallback, useRef } from 'react';

interface UseBarcodeScavengerOptions {
    onScan: (barcode: string) => void;
    minLength?: number; // Minimum barcode length (default: 6)
    maxDelay?: number; // Max delay between keystrokes in ms (default: 50)
    enabled?: boolean; // Enable/disable the scanner (default: true)
    preventDefault?: boolean; // Prevent default for scanned input (default: true)
}

/**
 * Custom hook to detect barcode scanner input
 * 
 * Barcode scanners typically:
 * 1. Type very fast (< 50ms between characters)
 * 2. End with Enter key
 * 3. Produce 6-30 character codes
 * 
 * This distinguishes scanner input from keyboard typing.
 */
export function useBarcodeScanner({
    onScan,
    minLength = 6,
    maxDelay = 50,
    enabled = true,
    preventDefault = true,
}: UseBarcodeScavengerOptions) {
    const bufferRef = useRef<string>('');
    const lastKeyTimeRef = useRef<number>(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const resetBuffer = useCallback(() => {
        bufferRef.current = '';
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return;

            const now = Date.now();
            const timeSinceLastKey = now - lastKeyTimeRef.current;

            // If too much time passed, reset the buffer
            if (timeSinceLastKey > maxDelay && bufferRef.current.length > 0) {
                resetBuffer();
            }

            lastKeyTimeRef.current = now;

            // Clear any pending timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Handle Enter key - submit if we have enough characters
            if (event.key === 'Enter') {
                if (bufferRef.current.length >= minLength) {
                    if (preventDefault) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                    onScan(bufferRef.current);
                }
                resetBuffer();
                return;
            }

            // Only accept alphanumeric characters for barcodes
            if (event.key.length === 1 && /^[a-zA-Z0-9-]$/.test(event.key)) {
                bufferRef.current += event.key;

                // Set a timeout to clear buffer if typing stops
                timeoutRef.current = setTimeout(() => {
                    resetBuffer();
                }, maxDelay * 2);
            }
        },
        [enabled, maxDelay, minLength, onScan, preventDefault, resetBuffer]
    );

    useEffect(() => {
        if (!enabled) return;

        // Use capture phase to get events before other handlers
        document.addEventListener('keydown', handleKeyDown, { capture: true });

        return () => {
            document.removeEventListener('keydown', handleKeyDown, { capture: true });
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [enabled, handleKeyDown]);

    return {
        resetBuffer,
    };
}

export default useBarcodeScanner;
