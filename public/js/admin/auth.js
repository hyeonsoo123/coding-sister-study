// ============================================================
//  관리자 인증 (localStorage 기반, 백엔드 불필요)
//  - 고정 관리자 계정으로 로그인, 세션은 localStorage에 저장
//  - guard()로 보호 페이지 진입을 막음
//  ⚠ 클라이언트 전용 데모 인증 — 실제 보안 용도로는 쓰지 말 것
// ============================================================
const AdminAuth = (() => {
    const SESSION_KEY = 'cs_admin_session';
    const LOGIN_PAGE = 'admin-login.html';
    const ADMIN_PAGE = 'admin-products.html';

    // 고정 관리자 계정 (데모용)
    const ADMIN = { id: 'admin', pw: 'admin1234' };

    function login(id, pw) {
        if (id === ADMIN.id && pw === ADMIN.pw) {
            const session = { id, loginAt: Date.now() };
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            return true;
        }
        return false;
    }

    function logout() {
        localStorage.removeItem(SESSION_KEY);
    }

    function current() {
        try {
            return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
        } catch {
            return null;
        }
    }

    function isLoggedIn() {
        return current() !== null;
    }

    // 보호 페이지 진입 가드: 미로그인이면 로그인 페이지로 이동
    function guard() {
        if (!isLoggedIn()) {
            location.replace(LOGIN_PAGE);
            return false;
        }
        return true;
    }

    // 로그인 페이지에서 이미 로그인 상태면 관리자 페이지로
    function redirectIfLoggedIn() {
        if (isLoggedIn()) {
            location.replace(ADMIN_PAGE);
        }
    }

    return { login, logout, current, isLoggedIn, guard, redirectIfLoggedIn, LOGIN_PAGE, ADMIN_PAGE };
})();
