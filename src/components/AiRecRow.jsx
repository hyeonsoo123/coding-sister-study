// ============================================================
//  AI 맞춤 추천 줄 (홈 최상단)
//  - 대여 이력이 있는 사용자에게만 노출
//  - POST /api/recommend → 서버가 Atlas에서 대여 이력을 읽어 Gemini에 전달
//    → 취향 분석 + 추천 제목 → 그 제목으로 TMDB 검색 → 포스터 카드
//  - 같은 이력이면 세션 캐시를 재사용해 LLM 호출을 아낀다
//  - 키 미설정(503)·서버 다운 등 실패 시에는 조용히 숨긴다 (홈이 깨지면 안 되므로)
// ============================================================
import { useEffect, useState } from 'react';
import { TMDBApi } from '../lib/tmdb';
import { aiRecommend, myPurchases } from '../lib/purchases';
import { RowShell } from './Row';
import MediaCard from './MediaCard';
import { SkeletonCards } from './Skeleton';

const CACHE_KEY = 'aiRec_v1';

async function fetchRecommendations(purchaseCount) {
    try {
        const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
        if (cached && cached.purchaseCount === purchaseCount) return cached.data;
    } catch {
        /* 캐시 파손 시 무시하고 새로 요청 */
    }
    const data = await aiRecommend();
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ purchaseCount, data }));
    return data;
}

export default function AiRecRow() {
    const [state, setState] = useState({ status: 'loading', taste: null, cards: [] });

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const purchases = await myPurchases();
                if (!alive) return;
                if (!purchases.length) return setState({ status: 'hidden' }); // 추천할 근거 없음

                const data = await fetchRecommendations(purchases.length);
                if (!alive) return;
                if (!data.recommendations?.length) return setState({ status: 'hidden' });

                // LLM이 준 제목으로 TMDB를 찾아 포스터를 붙인다 (못 찾은 건 건너뜀)
                const found = await Promise.all(
                    data.recommendations.map(async (rec) => {
                        try {
                            const hit = (await TMDBApi.search(rec.title)).results?.find((m) => m.poster_path);
                            return hit ? { movie: hit, reason: rec.reason } : null;
                        } catch {
                            return null;
                        }
                    })
                );
                if (!alive) return;

                const cards = found.filter(Boolean);
                setState(cards.length ? { status: 'ready', taste: data.taste, cards } : { status: 'hidden' });
            } catch {
                if (alive) setState({ status: 'hidden' }); // API 서버 꺼짐 / 키 미설정 등
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    if (state.status === 'hidden') return null;

    const title = (
        <span className="inline-flex items-baseline gap-3 flex-wrap">
            🤖 AI 맞춤 추천
            <span className={`text-sm font-normal text-indigo-400 ${state.status === 'loading' ? 'animate-pulse' : ''}`}>
                {state.status === 'loading' ? '대여 이력으로 취향을 분석하는 중...' : state.taste}
            </span>
        </span>
    );

    if (state.status === 'loading') {
        return (
            <RowShell title={title}>
                <SkeletonCards count={5} />
            </RowShell>
        );
    }

    return (
        <RowShell title={title}>
            {state.cards.map(({ movie, reason }) => (
                <div key={movie.id} className="shrink-0 w-36 sm:w-44">
                    <MediaCard item={movie} />
                    <p className="text-xs text-gray-500 mt-1.5 leading-snug">💡 {reason}</p>
                </div>
            ))}
        </RowShell>
    );
}
