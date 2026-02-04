import React from 'react';
import { useDonor } from '../context/DonorContext';

const ToastContainer = () => {
    const { toasts, removeToast } = useDonor();

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container" id="toast-container">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`toast toast-${toast.type}`}
                    onClick={() => removeToast(toast.id)}
                >
                    <div style={{ fontSize: '1.25rem' }}>
                        {toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : '🔔'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Notification</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {toast.message}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
