// ============================================================
//  주문 관리 페이지 컨트롤러
//  - GET /api/purchases?scope=all 로 전체 주문을 조회해 테이블 렌더링
//  - AdminAuth 가드 통과 후에만 로드된다
// ============================================================
(() => {
    const API_BASE = location.port === '8081' ? 'http://localhost:3001/api' : '/api';

    const rows = document.getElementById('orderRows');
    const loading = document.getElementById('loadingState');
    const empty = document.getElementById('emptyState');
    const error = document.getElementById('errorState');

    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function show(el) {
        [loading, empty, error].forEach((x) => x.classList.add('hidden'));
        if (el) el.classList.remove('hidden');
    }

    function rowHtml(p) {
        const poster = p.posterPath
            ? `<img src="https://image.tmdb.org/t/p/w92${esc(p.posterPath)}" alt="" class="w-9 h-13 rounded shadow shrink-0 bg-gray-200">`
            : '<div class="w-9 h-13 rounded bg-gray-200 shrink-0"></div>';
        return `
            <tr class="border-t border-gray-100 hover:bg-gray-50 transition">
                <td class="py-3 px-4">
                    <a href="movie-detail.html?id=${Number(p.movieId)}" class="flex items-center gap-3 group">
                        ${poster}
                        <span class="font-semibold text-gray-800 group-hover:text-indigo-600 leading-tight">${esc(p.title || '(제목 없음)')}</span>
                    </a>
                </td>
                <td class="py-3 px-4 hidden sm:table-cell"><code class="text-xs text-gray-400">${esc(p._id).slice(-8)}</code></td>
                <td class="py-3 px-4 text-gray-500 text-xs">${esc(p.userId)}</td>
                <td class="py-3 px-4 text-right font-semibold text-gray-700">₩${(p.price || 0).toLocaleString()}</td>
                <td class="py-3 px-4 hidden md:table-cell text-right text-gray-400 text-xs">${new Date(p.createdAt).toLocaleString('ko-KR')}</td>
            </tr>`;
    }

    async function load() {
        show(loading);
        rows.innerHTML = '';
        try {
            const res = await fetch(`${API_BASE}/purchases?scope=all`);
            if (!res.ok) throw new Error('조회 실패');
            const { items, total, revenue } = await res.json();

            document.getElementById('statCount').textContent = `${total.toLocaleString()}건`;
            document.getElementById('statRevenue').textContent = `₩${revenue.toLocaleString()}`;

            if (!items.length) return show(empty);
            show(null);
            rows.innerHTML = items.map(rowHtml).join('');
        } catch {
            show(error);
        }
    }

    document.getElementById('adminName').textContent = AdminAuth.current()?.id || 'admin';
    document.getElementById('logoutBtn').addEventListener('click', () => {
        AdminAuth.logout();
        location.replace(AdminAuth.LOGIN_PAGE);
    });
    document.getElementById('refreshBtn').addEventListener('click', load);

    load();
})();
