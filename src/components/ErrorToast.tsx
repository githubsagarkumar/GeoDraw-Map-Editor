import { useEffect } from 'react';
import { useMapStore } from '../store/useMapStore';
import './ErrorToast.css';

/**
 * Error toast component that displays non-intrusive error messages.
 */
export function ErrorToast() {
  const { error, clearError } = useMapStore();

  useEffect(() => {
    if (error) {
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        clearError();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  if (!error) {
    return null;
  }

  return (
    <div className="error-toast" onClick={clearError}>
      <div className="error-toast-content">
        <span className="error-icon">⚠️</span>
        <span className="error-message">{error}</span>
        <button className="error-close" onClick={clearError}>×</button>
      </div>
    </div>
  );
}
