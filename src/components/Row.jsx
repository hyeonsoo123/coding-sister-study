// ============================================================
//  가로 슬라이드 줄 (제목 + 좌우 화살표 + 드래그 스크롤)
//  - items를 직접 주거나(고정 배열), load()로 비동기 로드
//  - 결과가 비면 줄 자체를 렌더하지 않는다 (빈 줄 안 보이게)
// ============================================================
import { useAsync, useDragScroll } from '../hooks';
import { SkeletonCards } from './Skeleton';
import MediaCard from './MediaCard';

export function RowShell({ title, children }) {
    const scrollRef = useDragScroll();

    const by = (dir) => {
        const el = scrollRef.current;
        if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
    };

    return (
        <section className="mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 px-1">{title}</h3>
            <div className="relative group/row">
                <button type="button" className="row-arrow left" aria-label="왼쪽" onClick={() => by(-1)}>
                    ‹
                </button>
                <div ref={scrollRef} className="row-scroll flex gap-3 overflow-x-auto pb-2">
                    {children}
                </div>
                <button type="button" className="row-arrow right" aria-label="오른쪽" onClick={() => by(1)}>
                    ›
                </button>
            </div>
        </section>
    );
}

// 이미 가진 배열로 줄 만들기 (최근 본 작품 등)
export function StaticRow({ title, items }) {
    const list = (items || []).filter((m) => m.poster_path);
    if (!list.length) return null;
    return (
        <RowShell title={title}>
            {list.map((m) => (
                <MediaCard key={`${m.media_type || 'movie'}-${m.id}`} item={m} />
            ))}
        </RowShell>
    );
}

// 스스로 로드하는 줄 — 홈에서 줄마다 병렬로 뜬다 (한 줄이 느려도 나머지는 먼저 표시)
export function LoadRow({ title, load }) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const state = useAsync(load, []);
    return <AsyncRow title={title} state={state} />;
}

// 비동기 로드 줄 — state: { data, loading, error }
export function AsyncRow({ title, state }) {
    const { data, loading, error } = state;

    if (loading) {
        return (
            <RowShell title={title}>
                <SkeletonCards count={6} />
            </RowShell>
        );
    }
    if (error) {
        return (
            <RowShell title={title}>
                <p className="text-red-500 text-sm py-8">불러오기 실패: {error.message}</p>
            </RowShell>
        );
    }

    const items = (data?.results || []).filter((m) => m.poster_path);
    if (!items.length) return null; // 빈 줄은 숨김

    return (
        <RowShell title={title}>
            {items.map((m) => (
                <MediaCard key={`${m.media_type || 'movie'}-${m.id}`} item={m} />
            ))}
        </RowShell>
    );
}
