// ============================================================
//  찜 목록 (localStorage) — 영화/TV 겸용, (media_type, id)로 구분
//  - useSyncExternalStore용 store: 어느 컴포넌트에서 토글해도
//    구독 중인 모든 화면(헤더 뱃지·카드 하트·찜 탭)이 함께 갱신된다
//  - 저장 키는 기존과 동일 → 기존 사용자 데이터 그대로 유지
// ============================================================
const KEY = 'cs_movie_favorites';

function read() {
    try {
        return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
        return [];
    }
}

// getSnapshot은 항상 같은 참조를 돌려줘야 하므로 캐시를 둔다 (무한 렌더 방지)
let cache = read();
const listeners = new Set();

function write(list) {
    cache = list;
    localStorage.setItem(KEY, JSON.stringify(list));
    listeners.forEach((fn) => fn());
}

export function subscribe(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
}

export function getFavorites() {
    return cache;
}

function typeOf(item, fallback) {
    return item.media_type || fallback || 'movie';
}

export function hasFavorite(id, type = 'movie') {
    return cache.some((m) => m.id === id && (m.media_type || 'movie') === type);
}

// 찜 추가/제거 토글 → 추가되면 true, 제거되면 false
export function toggleFavorite(item, type) {
    const t = typeOf(item, type);
    const list = [...cache];
    const idx = list.findIndex((m) => m.id === item.id && (m.media_type || 'movie') === t);
    if (idx >= 0) {
        list.splice(idx, 1);
        write(list);
        return false;
    }
    list.unshift({
        id: item.id,
        media_type: t,
        title: item.title || item.name,
        poster_path: item.poster_path,
        vote_average: item.vote_average,
        release_date: item.release_date || item.first_air_date,
    });
    write(list);
    return true;
}
