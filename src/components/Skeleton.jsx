// ============================================================
//  로딩 스켈레톤 · 빈 상태
// ============================================================

export function SkeletonCards({ count = 6 }) {
    return Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shrink-0 w-36 sm:w-44 aspect-[2/3] rounded-lg bg-gray-200 animate-pulse" />
    ));
}

export function SkeletonGrid({ count = 12 }) {
    return Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-[2/3] rounded-lg bg-gray-200 animate-pulse" />
    ));
}

export function EmptyState({ emoji, title, desc }) {
    return (
        <div className="col-span-full text-center py-16">
            <div className="text-6xl mb-4">{emoji}</div>
            <p className="text-lg font-bold text-gray-700">{title}</p>
            {desc && <p className="text-gray-500 mt-1">{desc}</p>}
        </div>
    );
}
