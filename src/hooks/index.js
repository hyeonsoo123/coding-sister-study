// ============================================================
//  공용 훅 모음
// ============================================================
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { getFavorites, subscribe } from '../lib/favorites';

// 찜 목록 구독 — 어디서 토글해도 구독 중인 화면이 함께 갱신된다
export function useFavorites() {
    return useSyncExternalStore(subscribe, getFavorites);
}

// 비동기 로더 → { data, loading, error }
// deps가 바뀌면 다시 부르고, 언마운트/재요청 시 늦게 온 응답은 버린다
export function useAsync(loader, deps = []) {
    const [state, setState] = useState({ data: null, loading: true, error: null });

    useEffect(() => {
        let alive = true;
        setState({ data: null, loading: true, error: null });
        Promise.resolve()
            .then(loader)
            .then((data) => alive && setState({ data, loading: false, error: null }))
            .catch((error) => alive && setState({ data: null, loading: false, error }));
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return state;
}

// body에 테마 클래스 부여 (영화 페이지 = 다크 시네마틱)
// 페이지를 떠나면 자동 해제 → TODO/포트폴리오는 라이트 테마 유지
export function useBodyTheme(theme) {
    useEffect(() => {
        if (!theme) return undefined;
        const cls = `theme-${theme}`;
        document.body.classList.add(cls);
        return () => document.body.classList.remove(cls);
    }, [theme]);
}

// 문서 제목
export function useDocumentTitle(title) {
    useEffect(() => {
        if (title) document.title = title;
    }, [title]);
}

// 마우스로 가로줄을 잡아끌어 스크롤 + 가벼운 관성 (터치는 네이티브 그대로)
export function useDragScroll() {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;

        const reduced =
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        let startX = 0;
        let startScroll = 0;
        let dragging = false;
        let moved = false;
        let velX = 0; // px/ms
        let lastX = 0;
        let lastT = 0;
        let raf = 0;

        const onDown = (e) => {
            if (e.pointerType !== 'mouse' || e.button !== 0) return; // 터치/우클릭 제외
            cancelAnimationFrame(raf);
            startX = e.clientX;
            startScroll = el.scrollLeft;
            dragging = true;
            moved = false;
            velX = 0;
            lastX = e.clientX;
            lastT = performance.now();
        };

        const onMove = (e) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            if (Math.abs(dx) > 4) moved = true;
            el.scrollLeft = startScroll - dx;
            const now = performance.now();
            const dt = now - lastT;
            if (dt > 0) velX = (e.clientX - lastX) / dt;
            lastX = e.clientX;
            lastT = now;
            if (moved) {
                el.classList.add('dragging');
                e.preventDefault();
            }
        };

        const onUp = () => {
            if (!dragging) return;
            dragging = false;
            const dragged = moved;
            el.classList.remove('dragging');

            // 드래그였다면 뒤이어 발생하는 카드 클릭(링크 이동) 1회 무시
            if (dragged) {
                const suppress = (ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    el.removeEventListener('click', suppress, true);
                };
                el.addEventListener('click', suppress, true);
                setTimeout(() => el.removeEventListener('click', suppress, true), 50);
            }

            // 가벼운 관성: 프레임당 이동 상한(±40px) + 마찰 0.92
            if (dragged && !reduced && Math.abs(velX) > 0.05) {
                let v = Math.max(-40, Math.min(40, velX * 16));
                const step = () => {
                    el.scrollLeft -= v;
                    v *= 0.92;
                    if (Math.abs(v) > 0.5) raf = requestAnimationFrame(step);
                };
                raf = requestAnimationFrame(step);
            }
        };

        el.addEventListener('pointerdown', onDown);
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onUp);
        return () => {
            cancelAnimationFrame(raf);
            el.removeEventListener('pointerdown', onDown);
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
            document.removeEventListener('pointercancel', onUp);
        };
    }, []);

    return ref;
}

// 요소가 뷰포트 근처에 오면 콜백 (무한 스크롤)
export function useInView(onEnter, enabled = true) {
    const ref = useRef(null);
    const cb = useRef(onEnter);
    cb.current = onEnter;

    useEffect(() => {
        const el = ref.current;
        if (!el || !enabled) return undefined;
        const io = new IntersectionObserver(
            (entries) => entries.forEach((e) => e.isIntersecting && cb.current()),
            { rootMargin: '600px' }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [enabled]);

    return ref;
}

// 이미지 로드되면 .loaded 부여 (부드러운 페이드인, 팝 튐 방지)
export function useFadeIn() {
    return useCallback((e) => e.currentTarget.classList.add('loaded'), []);
}
