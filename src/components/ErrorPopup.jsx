import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ErrorPopup({isOpen,message,onClose,title = "Something went wrong",}) {
  useEffect(() => {
    if (!isOpen || !message) return undefined;

    const timer = window.setTimeout(() => {
      onClose?.();
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [isOpen, message, onClose]);

  if (!isOpen || !message) return null;

  return (
    <div className="error-popup" role="alert" aria-live="assertive">
      <div className="error-popup-icon">
        <AlertTriangle size={18} />
      </div>

      <div className="error-popup-content">
        <strong>{title}</strong>
        <span>{message}</span>
      </div>

      <button
        type="button"
        className="error-popup-close"
        onClick={onClose}
        aria-label="Close error popup"
      >
        <X size={16} />
      </button>
    </div>
  );
}
