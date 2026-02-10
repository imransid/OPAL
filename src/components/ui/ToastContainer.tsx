import { useState, useEffect, useRef } from 'react';

interface ToastItem {
  id: number;
  message: string;
  productName?: string;
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(0);

  useEffect(() => {
    const handler = (e: CustomEvent<{ message?: string; productName?: string }>) => {
      const { message = 'Added to cart', productName } = e.detail ?? {};
      const id = nextIdRef.current++;
      setToasts((prev) => [...prev, { id, message, productName }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    };
    window.addEventListener('opal-show-toast', handler as EventListener);
    return () => window.removeEventListener('opal-show-toast', handler as EventListener);
  }, []);

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="position-fixed top-0 end-0 p-3"
      style={{ zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem', pointerEvents: 'none' }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-opal d-flex align-items-center gap-3 shadow-lg border-0 overflow-hidden"
          role="alert"
        >
          <div className="toast-opal__icon">
            <i className="bi bi-check-circle-fill text-white" style={{ fontSize: '1.25rem' }}></i>
          </div>
          <div className="toast-opal__body py-2">
            <strong className="d-block text-dark">{t.message}</strong>
            {t.productName && <span className="text-body-secondary small">{t.productName}</span>}
          </div>
        </div>
      ))}
      <style>{`
        .toast-opal {
          background: #fff;
          border-radius: 12px;
          padding: 0.5rem 1rem 0.5rem 0.75rem;
          min-width: 280px;
          max-width: 360px;
          animation: toastOpalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .toast-opal__icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2d5016 0%, #4a7c23 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        @keyframes toastOpalIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
