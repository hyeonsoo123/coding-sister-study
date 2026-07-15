// ============================================================
//  가짜 결제(대여) 모듈
//  - 회원가입 없이 브라우저별 게스트 ID(localStorage)로 사용자를 구분
//  - 흐름: 대여하기 → 결제 모달(mock) → POST /api/purchases → 시청하기
//  - 실제 영상은 없으므로 "시청"은 데모 플레이어 화면을 띄운다
// ============================================================
const Purchases = (() => {
    // 배포(Vercel)에서는 같은 도메인의 /api,
    // 로컬 live-server(8081)에서는 vercel dev(3000)를 바라본다
    const API_BASE = location.port === '8081' ? 'http://localhost:3001/api' : '/api';
    const PRICE = 1200;

    function userId() {
        let id = localStorage.getItem('guestId');
        if (!id) {
            id = 'guest_' + Math.random().toString(36).slice(2, 10);
            localStorage.setItem('guestId', id);
        }
        return id;
    }

    async function isPurchased(movieId) {
        const res = await fetch(`${API_BASE}/purchases?userId=${userId()}&movieId=${movieId}`);
        if (!res.ok) throw new Error('구매 조회 실패');
        const data = await res.json();
        return data.items.length > 0;
    }

    async function purchase(movie) {
        const res = await fetch(`${API_BASE}/purchases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId(),
                movieId: movie.id,
                title: movie.title,
                posterPath: movie.poster_path,
                price: PRICE,
            }),
        });
        if (!res.ok) throw new Error('결제 실패');
        return (await res.json()).item;
    }

    async function myList() {
        const res = await fetch(`${API_BASE}/purchases?userId=${userId()}`);
        if (!res.ok) throw new Error('구매 목록 조회 실패');
        return (await res.json()).items;
    }

    // ---------- UI ----------

    function closeModal() {
        document.getElementById('purchaseModal')?.remove();
    }

    function modalShell(inner) {
        closeModal();
        const wrap = document.createElement('div');
        wrap.id = 'purchaseModal';
        wrap.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4';
        wrap.innerHTML = `
            <div class="absolute inset-0 bg-black/70" data-close></div>
            <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">${inner}</div>`;
        wrap.addEventListener('click', (e) => {
            if (e.target.dataset.close !== undefined) closeModal();
        });
        document.body.appendChild(wrap);
        return wrap;
    }

    // 결제 모달 (mock — 실제 PG 연동 없음)
    function openPayModal(movie) {
        const wrap = modalShell(`
            <div class="p-6">
                <h3 class="text-lg font-bold text-gray-900 mb-4">🎬 대여 결제</h3>
                <div class="flex gap-4 mb-5">
                    <img src="${UI.img(movie.poster_path, 'w185')}" alt="" class="w-20 rounded-lg shadow">
                    <div class="min-w-0">
                        <p class="font-bold text-gray-800 leading-snug">${UI.escapeHtml(movie.title)}</p>
                        <p class="text-sm text-gray-500 mt-1">7일 동안 시청 가능</p>
                        <p class="text-xl font-bold text-indigo-600 mt-2">₩${PRICE.toLocaleString()}</p>
                    </div>
                </div>
                <div class="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 mb-5">
                    데모 결제입니다. 실제 과금되지 않습니다.
                </div>
                <button id="payBtn" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold min-h-[44px] transition">
                    ₩${PRICE.toLocaleString()} 결제하기
                </button>
                <button data-close class="w-full py-2 mt-2 text-gray-500 text-sm hover:text-gray-700">취소</button>
            </div>`);

        wrap.querySelector('#payBtn').addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.textContent = '결제 처리 중...';
            try {
                // mock 결제 연출용 딜레이
                await new Promise((r) => setTimeout(r, 800));
                const item = await purchase(movie);
                btn.textContent = '✅ 결제 완료!';
                btn.classList.replace('bg-indigo-600', 'bg-green-500');
                setTimeout(() => {
                    // 주문완료 페이지로 이동 (영수증 + 시청하기)
                    location.href = `order-complete.html?orderId=${item._id}`;
                }, 700);
            } catch (err) {
                btn.disabled = false;
                btn.textContent = '다시 시도';
                UI.toast('결제에 실패했습니다. 서버 상태를 확인해주세요.');
            }
        });
    }

    // 데모 플레이어 (실제 스트리밍 없음)
    function openPlayer(movie) {
        const wrap = modalShell(`
            <div class="bg-black">
                <div class="aspect-video flex flex-col items-center justify-center text-center p-6">
                    <div class="text-6xl mb-4 animate-pulse">▶️</div>
                    <p class="text-white font-bold text-lg">${UI.escapeHtml(movie.title)}</p>
                    <p class="text-gray-400 text-sm mt-2">데모 플레이어 — 실제 스트리밍은 제공되지 않습니다</p>
                </div>
                <button data-close class="w-full py-3 bg-gray-900 text-gray-300 text-sm hover:bg-gray-800">닫기</button>
            </div>`);
    }

    // 상세 페이지에 대여/시청 버튼을 붙인다
    async function mountButton(movie, container) {
        if (!container) return;

        const render = (purchased) => {
            container.innerHTML = `
                <button id="rentBtn" type="button"
                    class="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-bold min-h-[44px] transition
                           ${purchased
                               ? 'bg-green-500 text-white hover:bg-green-600'
                               : 'bg-indigo-600 text-white hover:bg-indigo-700'}">
                    ${purchased ? '▶️ 시청하기' : `🎟 대여하기 · ₩${PRICE.toLocaleString()}`}
                </button>`;
            container.querySelector('#rentBtn').addEventListener('click', () => {
                if (purchased) openPlayer(movie);
                else openPayModal(movie);
            });
        };

        try {
            render(await isPurchased(movie.id));
        } catch {
            // API 서버가 안 떠 있으면(로컬에서 vercel dev 미실행 등) 버튼을 숨긴다
            container.innerHTML = '';
        }
    }

    return { userId, myList, mountButton, openPlayer };
})();
