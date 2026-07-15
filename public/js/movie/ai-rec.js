// ============================================================
//  AI 맞춤 추천 섹션 (index.html)
//  - 대여 이력이 있는 사용자에게만 노출
//  - POST /api/recommend → Gemini가 취향 분석 + 추천 제목 생성
//    → 제목으로 TMDB 검색 → 포스터 카드 렌더링
//  - 같은 이력이면 세션 캐시를 재사용해 LLM 호출을 아낀다
// ============================================================
(() => {
    const API_BASE = location.port === '8081' ? 'http://localhost:3001/api' : '/api';
    const CACHE_KEY = 'aiRec_v1';

    async function fetchRecommendations(purchaseCount) {
        // 대여 수가 그대로면 세션 캐시 재사용 (LLM 호출 절약)
        try {
            const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
            if (cached && cached.purchaseCount === purchaseCount) return cached.data;
        } catch { /* 캐시 파손 시 무시 */ }

        const res = await fetch(`${API_BASE}/recommend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: Purchases.userId() }),
        });
        if (!res.ok) throw new Error('recommend API 실패');
        const data = await res.json();
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ purchaseCount, data }));
        return data;
    }

    function sectionShell() {
        const sec = document.createElement('section');
        sec.id = 'aiRecSection';
        sec.className = 'mb-8';
        sec.innerHTML = `
            <div class="flex items-baseline gap-3 flex-wrap">
                <h3 class="text-lg sm:text-xl font-bold text-gray-800">🤖 AI 맞춤 추천</h3>
                <p id="aiRecTaste" class="text-sm text-indigo-500 animate-pulse">대여 이력으로 취향을 분석하는 중...</p>
            </div>
            <div id="aiRecRow" class="flex gap-4 overflow-x-auto pb-2 row-scroll mt-3"></div>`;
        return sec;
    }

    async function init() {
        // 대여 이력 확인 — 없으면 섹션 자체를 만들지 않는다
        let purchases;
        try {
            purchases = await Purchases.myList();
        } catch {
            return; // API 서버 꺼져있음 → 조용히 패스
        }
        if (!purchases.length) return;

        const homeView = document.getElementById('homeView');
        const rows = document.getElementById('rows');
        if (!homeView || !rows) return;
        const sec = sectionShell();
        homeView.insertBefore(sec, rows);

        try {
            const data = await fetchRecommendations(purchases.length);
            if (!data.recommendations?.length) return sec.remove();

            const taste = document.getElementById('aiRecTaste');
            taste.classList.remove('animate-pulse');
            taste.textContent = data.taste || '';

            const row = document.getElementById('aiRecRow');
            for (const rec of data.recommendations) {
                try {
                    const found = (await TMDBApi.search(rec.title)).results?.find((m) => m.poster_path);
                    if (!found) continue;
                    const wrap = document.createElement('div');
                    wrap.className = 'shrink-0 w-36 sm:w-40';
                    wrap.appendChild(UI.mediaCard(found));
                    const reason = document.createElement('p');
                    reason.className = 'text-xs text-gray-500 mt-1.5 leading-snug';
                    reason.textContent = `💡 ${rec.reason || ''}`;
                    wrap.appendChild(reason);
                    row.appendChild(wrap);
                } catch { /* 개별 검색 실패는 건너뜀 */ }
            }
            if (!row.children.length) sec.remove();
        } catch {
            sec.remove(); // 키 미설정(503) 등 — 섹션 조용히 제거
        }
    }

    init();
})();
