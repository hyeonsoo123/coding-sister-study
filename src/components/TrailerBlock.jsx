// ============================================================
//  예고편 인라인 블록
//  썸네일 + ▶ 버튼 → 클릭할 때만 유튜브 iframe 로드 (상세 페이지 가볍게)
// ============================================================
import { useState } from 'react';

export default function TrailerBlock({ youtubeKey }) {
    const [playing, setPlaying] = useState(false);

    return (
        <div
            className="relative w-full rounded-xl overflow-hidden shadow-lg cursor-pointer"
            style={{ aspectRatio: '16/9' }}
        >
            {playing ? (
                <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${youtubeKey}?autoplay=1`}
                    title="예고편"
                    frameBorder="0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
            ) : (
                <>
                    <img
                        src={`https://img.youtube.com/vi/${youtubeKey}/hqdefault.jpg`}
                        alt="예고편 썸네일"
                        className="w-full h-full object-cover"
                    />
                    <button
                        type="button"
                        onClick={() => setPlaying(true)}
                        aria-label="예고편 재생"
                        className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/35 transition"
                    >
                        <span className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center text-2xl shadow-lg">
                            ▶
                        </span>
                    </button>
                </>
            )}
        </div>
    );
}
