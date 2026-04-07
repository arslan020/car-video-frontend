import { createContext, useCallback, useMemo, useRef, useState } from 'react';

export const ToastContext = createContext(null);

const DEFAULT_DURATION_MS = 3500;

const variantStyles = {
    success: {
        border: 'border-emerald-200',
        bg: 'bg-white',
        title: 'text-emerald-800',
        message: 'text-gray-700',
        dot: 'bg-emerald-500'
    },
    error: {
        border: 'border-rose-200',
        bg: 'bg-white',
        title: 'text-rose-800',
        message: 'text-gray-700',
        dot: 'bg-rose-500'
    },
    info: {
        border: 'border-blue-200',
        bg: 'bg-white',
        title: 'text-blue-800',
        message: 'text-gray-700',
        dot: 'bg-blue-600'
    }
};

function normalizeToastInput(input) {
    if (typeof input === 'string') return { message: input };
    return input || {};
}

export default function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef(new Map());

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
    }, []);

    const pushToast = useCallback((variant, input) => {
        const { title, message, durationMs } = normalizeToastInput(input);
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        setToasts((prev) => [
            ...prev,
            {
                id,
                variant,
                title:
                    title ||
                    (variant === 'success'
                        ? 'Success'
                        : variant === 'error'
                            ? 'Something went wrong'
                            : 'Info'),
                message: message || '',
            }
        ]);

        const timeout = setTimeout(() => removeToast(id), durationMs ?? DEFAULT_DURATION_MS);
        timersRef.current.set(id, timeout);

        return id;
    }, [removeToast]);

    const api = useMemo(() => ({
        success: (input) => pushToast('success', input),
        error: (input) => pushToast('error', input),
        info: (input) => pushToast('info', input),
        dismiss: (id) => removeToast(id),
        dismissAll: () => setToasts([])
    }), [pushToast, removeToast]);

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div className="fixed top-4 right-4 z-[100] w-[92vw] sm:w-[380px] space-y-3 pointer-events-none">
                {toasts.map((t) => {
                    const s = variantStyles[t.variant] || variantStyles.info;
                    return (
                        <div
                            key={t.id}
                            className={`pointer-events-auto ${s.bg} border ${s.border} shadow-soft rounded-xl px-4 py-3`}
                            role="status"
                            aria-live="polite"
                        >
                            <div className="flex items-start gap-3">
                                <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${s.dot}`} />
                                <div className="min-w-0 flex-1">
                                    <div className={`text-sm font-semibold ${s.title} leading-tight`}>{t.title}</div>
                                    {t.message ? (
                                        <div className={`mt-0.5 text-sm ${s.message} leading-snug break-words`}>{t.message}</div>
                                    ) : null}
                                </div>
                                <button
                                    onClick={() => removeToast(t.id)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors -mt-0.5"
                                    aria-label="Dismiss notification"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

