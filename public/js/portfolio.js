// 포트폴리오 페이지 인터랙션

// 모바일 햄버거 메뉴 토글
function setupMobileNav() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileNav = document.getElementById('mobileNav');

    if (!hamburgerBtn || !mobileNav) return;

    hamburgerBtn.addEventListener('click', () => {
        mobileNav.classList.toggle('open');
    });

    // 모바일 nav 내 링크 클릭 시 자동 닫힘
    mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileNav.classList.remove('open');
        });
    });

    // 외부 클릭 시 닫힘
    document.addEventListener('click', (e) => {
        if (!hamburgerBtn.contains(e.target) && !mobileNav.contains(e.target)) {
            mobileNav.classList.remove('open');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupMobileNav();
});
