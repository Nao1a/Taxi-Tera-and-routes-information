import React, { useState, useEffect, useCallback } from 'react';

const Toast = () => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((event) => {
        const { message, type = 'info', duration = 4000 } = event.detail;
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, exiting: false }]);

        setTimeout(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 300);
        }, duration);
    }, []);

    useEffect(() => {
        window.addEventListener('show-toast', addToast);
        return () => window.removeEventListener('show-toast', addToast);
    }, [addToast]);

    const typeStyles = {
        success: { bg: 'rgb(var(--success))', icon: '✓' },
        error: { bg: 'rgb(var(--error))', icon: '✕' },
        warning: { bg: 'rgb(var(--warning))', icon: '⚠' },
        info: { bg: 'rgb(var(--brand))', icon: 'ℹ' },
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-20 right-4 z-[9999] space-y-2 max-w-sm w-full pointer-events-none">
            {toasts.map(toast => {
                const style = typeStyles[toast.type] || typeStyles.info;
                return (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.exiting ? 'animate-slide-out-right' : 'animate-slide-in-right'
                            }`}
                        style={{ backgroundColor: style.bg }}
                    >
                        <span className="text-lg flex-shrink-0">{style.icon}</span>
                        <span className="flex-1">{toast.message}</span>
                    </div>
                );
            })}
        </div>
    );
};

// Helper function to show toasts from anywhere
export const showToast = (message, type = 'info', duration = 4000) => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type, duration } }));
};

export default Toast;
