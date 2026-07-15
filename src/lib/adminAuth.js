// ============================================================
//  관리자 인증 (localStorage 기반)
//  ⚠ 클라이언트 전용 데모 인증 — 실제 보안 용도로는 쓰지 말 것
//    (진짜였다면 서버에서 세션/JWT를 발급해야 함)
// ============================================================
const SESSION_KEY = 'cs_admin_session';

// 고정 관리자 계정 (데모용)
const ADMIN = { id: 'admin', pw: 'admin1234' };

export function login(id, pw) {
    if (id === ADMIN.id && pw === ADMIN.pw) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ id, loginAt: Date.now() }));
        return true;
    }
    return false;
}

export function logout() {
    localStorage.removeItem(SESSION_KEY);
}

export function currentAdmin() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
    } catch {
        return null;
    }
}

export function isLoggedIn() {
    return currentAdmin() !== null;
}
