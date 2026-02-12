import { useEffect } from 'react';

/**
 * Custom hook to handle keyboard events
 * @param {Object} handlers - Object with key handlers
 * @param {Function} [handlers.onEscape] - Function to call on Escape key
 * @param {Function} [handlers.onEnter] - Function to call on Enter key
 * @param {Array} [dependencies] - Array of dependencies to re-bind the listener
 * @param {boolean} [isEnabled=true] - Whether the listener is active
 */
const useKeyboard = ({ onEscape, onEnter }, dependencies = [], isEnabled = true) => {
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && onEscape) {
        onEscape(event);
      } else if (event.key === 'Enter' && onEnter) {
        onEnter(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onEscape, onEnter, isEnabled, ...dependencies]);
};

export default useKeyboard;
