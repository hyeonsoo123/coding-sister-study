// ============================================================
//  대여(구매) API 클라이언트
//  - 서버(api/purchases.js)가 Atlas 접근과 검증을 전담한다
//  - 개발 중에는 vite.config.mjs의 프록시가 /api → localhost:3001로 넘겨주므로
//    배포/로컬 구분 없이 항상 '/api'만 호출하면 된다
//  - 회원가입 없이 브라우저별 게스트 ID(localStorage)로 사용자를 구분
// ============================================================
const API_BASE = '/api';

export const RENT_PRICE = 1200;

export function guestId() {
    let id = localStorage.getItem('guestId');
    if (!id) {
        id = 'guest_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('guestId', id);
    }
    return id;
}

async function toJson(res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `요청 실패 (${res.status})`);
    return data;
}

// 특정 영화를 이미 대여했는지
export async function isPurchased(movieId) {
    const res = await fetch(`${API_BASE}/purchases?userId=${guestId()}&movieId=${movieId}`);
    const { items } = await toJson(res);
    return items.length > 0;
}

// 결제(mock) 후 구매 기록 저장 → 저장된 주문 반환
export async function purchase(movie) {
    const res = await fetch(`${API_BASE}/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: guestId(),
            movieId: movie.id,
            title: movie.title,
            posterPath: movie.poster_path,
            price: RENT_PRICE,
        }),
    });
    const { item } = await toJson(res);
    return item;
}

// 내 대여 목록
export async function myPurchases() {
    const res = await fetch(`${API_BASE}/purchases?userId=${guestId()}`);
    const { items } = await toJson(res);
    return items;
}

// 주문 단건 (주문완료 페이지)
export async function getOrder(orderId) {
    const res = await fetch(`${API_BASE}/purchases?orderId=${encodeURIComponent(orderId)}`);
    const { item } = await toJson(res);
    return item;
}

// 전체 주문 + 매출 요약 (어드민)
export async function allOrders() {
    const res = await fetch(`${API_BASE}/purchases?scope=all`);
    return toJson(res); // { items, total, revenue }
}

// AI 맞춤 추천 (대여 이력 기반) → { basedOn, taste, recommendations }
export async function aiRecommend() {
    const res = await fetch(`${API_BASE}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: guestId() }),
    });
    return toJson(res);
}
