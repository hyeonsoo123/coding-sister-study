// ============================================================
//  하단 토스트 알림 — 앱 어디서든 useToast()로 호출
// ============================================================
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const ToastContext = createContext(() => {});

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }) {
    const [message, setMessage] = useState('');
    const [visible, setVisible] = useState(false);
    const timer = useRef(null);

    const toast = useCallback((text) => {
        setMessage(text);
        setVisible(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setVisible(false), 1800);
    }, []);

    useEffect(() => () => clearTimeout(timer.current), []);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div
                role="status"
                aria-live="polite"
                className={`fixed left-1/2 -translate-x-1/2 bottom-6 z-[100] px-5 py-3 rounded-full
                            bg-gray-900 text-white text-sm font-semibold shadow-lg pointer-events-none
                            transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
            >
                {message}
            </div>
        </ToastContext.Provider>
    );
}
