// ============================================================
//  예고편 전체화면 모달 — 어디서든 useTrailer()(youtubeKey) 로 재생
// ============================================================
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const TrailerContext = createContext(() => {});

export function useTrailer() {
    return useContext(TrailerContext);
}

export function TrailerProvider({ children }) {
    const [key, setKey] = useState(null);
    const play = useCallback((youtubeKey) => setKey(youtubeKey), []);
    const close = useCallback(() => setKey(null), []);

    // ESC로 닫기
    useEffect(() => {
        if (!key) return undefined;
        const onKey = (e) => e.key === 'Escape' && close();
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [key, close]);

    return (
        <TrailerContext.Provider value={play}>
            {children}
            {key && (
                <div
                    className="fixed inset-0 z-[110] bg-black/85 flex items-center justify-center p-4"
                    onClick={(e) => e.target === e.currentTarget && close()}
                >
                    <div className="relative w-full max-w-4xl">
                        <button
                            type="button"
                            aria-label="close"
                            onClick={close}
                            className="absolute -top-10 right-0 text-white text-3xl leading-none hover:text-gray-300"
                        >
                            ✕
                        </button>
                        <div
                            className="relative w-full rounded-xl overflow-hidden shadow-2xl bg-black"
                            style={{ aspectRatio: '16/9' }}
                        >
                            <iframe
                                className="absolute inset-0 w-full h-full"
                                src={`https://www.youtube.com/embed/${key}?autoplay=1`}
                                title="예고편"
                                frameBorder="0"
                                allowFullScreen
                                allow="autoplay; encrypted-media; picture-in-picture"
                            />
                        </div>
                    </div>
                </div>
            )}
        </TrailerContext.Provider>
    );
}
