import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
    key: string;
    alt?: boolean;
    ctrl?: boolean;
    shift?: boolean;
    action: () => void;
    description: string;
}

interface UsePOSKeyboardOptions {
    enabled?: boolean;
    shortcuts: KeyboardShortcut[];
}

/**
 * POS Keyboard Shortcuts Hook
 * 
 * Default shortcuts (Alt + Key to avoid browser conflicts):
 * - Alt + N: New Sale
 * - Alt + H: Hold Order
 * - Alt + R: Recall Order
 * - Alt + P: Payment
 * - Escape: Cancel/Back
 */
export function usePOSKeyboard({
    enabled = true,
    shortcuts,
}: UsePOSKeyboardOptions) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return;

            // Don't trigger shortcuts when typing in inputs
            const target = event.target as HTMLElement;
            const isInputField =
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            // Allow Escape in input fields
            if (isInputField && event.key !== 'Escape') {
                return;
            }

            for (const shortcut of shortcuts) {
                const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
                const altMatch = shortcut.alt ? event.altKey : !event.altKey;
                const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
                const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;

                if (keyMatch && altMatch && ctrlMatch && shiftMatch) {
                    event.preventDefault();
                    event.stopPropagation();
                    shortcut.action();
                    return;
                }
            }
        },
        [enabled, shortcuts]
    );

    useEffect(() => {
        if (!enabled) return;

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [enabled, handleKeyDown]);
}

// Pre-defined shortcut configurations
export const POS_SHORTCUTS = {
    NEW_SALE: { key: 'n', alt: true, description: 'New Sale (Alt+N)' },
    HOLD_ORDER: { key: 'h', alt: true, description: 'Hold Order (Alt+H)' },
    RECALL_ORDER: { key: 'r', alt: true, description: 'Recall Order (Alt+R)' },
    PAYMENT: { key: 'p', alt: true, description: 'Payment (Alt+P)' },
    CANCEL: { key: 'Escape', description: 'Cancel (Esc)' },
    SEARCH_FOCUS: { key: '/', description: 'Focus Search (/)' },
} as const;

export default usePOSKeyboard;
