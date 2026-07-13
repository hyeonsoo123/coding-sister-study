// ============================================================
//  상품 관리 (localStorage 기반 CRUD, 백엔드 불필요)
//  - 필드: id, name, price, stock, category, image, createdAt
//  - AdminAuth.guard()로 보호되는 페이지에서만 동작
// ============================================================
const AdminProducts = (() => {
    const KEY = 'cs_admin_products';

    function all() {
        try {
            return JSON.parse(localStorage.getItem(KEY)) || [];
        } catch {
            return [];
        }
    }

    function save(list) {
        localStorage.setItem(KEY, JSON.stringify(list));
    }

    function get(id) {
        return all().find((p) => p.id === id) || null;
    }

    function add(data) {
        const list = all();
        const product = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            name: data.name,
            price: Number(data.price) || 0,
            stock: Number(data.stock) || 0,
            category: data.category || '',
            image: data.image || '',
            createdAt: Date.now(),
        };
        list.unshift(product);
        save(list);
        return product;
    }

    function update(id, data) {
        const list = all();
        const idx = list.findIndex((p) => p.id === id);
        if (idx < 0) return null;
        list[idx] = {
            ...list[idx],
            name: data.name,
            price: Number(data.price) || 0,
            stock: Number(data.stock) || 0,
            category: data.category || '',
            image: data.image || '',
        };
        save(list);
        return list[idx];
    }

    function remove(id) {
        save(all().filter((p) => p.id !== id));
    }

    // 데모용 예시 상품 (목록이 완전히 비어있을 때 한 번만 채움)
    function seedIfEmpty() {
        if (all().length > 0) return;
        const now = Date.now();
        save([
            { id: 'seed3', name: '무선 블루투스 이어폰', price: 89000, stock: 42, category: '전자기기', image: '', createdAt: now - 3000 },
            { id: 'seed2', name: '스테인리스 텀블러 500ml', price: 24000, stock: 130, category: '주방용품', image: '', createdAt: now - 2000 },
            { id: 'seed1', name: '코튼 오버핏 후드티', price: 39000, stock: 0, category: '의류', image: '', createdAt: now - 1000 },
        ]);
    }

    return { all, get, add, update, remove, seedIfEmpty };
})();

// ============================================================
//  화면 로직
// ============================================================
(() => {
    if (!AdminAuth.guard()) return; // 미로그인 → 로그인 페이지로

    AdminProducts.seedIfEmpty();

    const $ = (sel) => document.querySelector(sel);
    const won = (n) => n.toLocaleString('ko-KR') + '원';
    const esc = (s) =>
        String(s ?? '').replace(/[&<>"']/g, (c) =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
        );

    const tbody = $('#productRows');
    const emptyState = $('#emptyState');
    const searchInput = $('#searchInput');
    const countLabel = $('#countLabel');
    const adminName = $('#adminName');

    // ---- 모달 ----
    const modal = $('#productModal');
    const form = $('#productForm');
    const modalTitle = $('#modalTitle');
    let editingId = null;

    function openModal(product) {
        editingId = product?.id || null;
        modalTitle.textContent = editingId ? '상품 수정' : '상품 추가';
        const f = form.elements;
        f.name.value = product?.name || '';
        f.price.value = product?.price ?? '';
        f.stock.value = product?.stock ?? '';
        f.category.value = product?.category || '';
        f.image.value = product?.image || '';
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        f.name.focus();
    }

    function closeModal() {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        editingId = null;
        form.reset();
    }

    function stockBadge(stock) {
        if (stock <= 0) return '<span class="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-semibold">품절</span>';
        if (stock < 10) return `<span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">${stock}개 · 부족</span>`;
        return `<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">${stock}개</span>`;
    }

    function thumb(p) {
        if (p.image) {
            return `<img src="${esc(p.image)}" alt="" class="w-12 h-12 rounded-lg object-cover bg-gray-100" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xl',textContent:'📦'}))">`;
        }
        return '<div class="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xl">📦</div>';
    }

    function render() {
        const q = searchInput.value.trim().toLowerCase();
        const list = AdminProducts.all().filter(
            (p) => !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
        );

        countLabel.textContent = `총 ${list.length}개`;

        if (list.length === 0) {
            tbody.innerHTML = '';
            emptyState.classList.remove('hidden');
            emptyState.querySelector('p').textContent = q ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다.';
            return;
        }
        emptyState.classList.add('hidden');

        tbody.innerHTML = list
            .map(
                (p) => `
            <tr class="border-b border-gray-100 hover:bg-indigo-50/40 transition">
                <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                        ${thumb(p)}
                        <div>
                            <p class="font-semibold text-gray-800">${esc(p.name)}</p>
                            <p class="text-xs text-gray-400 sm:hidden">${esc(p.category) || '미분류'} · ${won(p.price)}</p>
                        </div>
                    </div>
                </td>
                <td class="py-3 px-4 hidden sm:table-cell text-gray-600">${esc(p.category) || '<span class="text-gray-300">미분류</span>'}</td>
                <td class="py-3 px-4 hidden sm:table-cell text-right font-semibold text-gray-800">${won(p.price)}</td>
                <td class="py-3 px-4 text-center">${stockBadge(p.stock)}</td>
                <td class="py-3 px-4">
                    <div class="flex justify-end gap-1">
                        <button data-edit="${p.id}" class="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-sm font-semibold transition">수정</button>
                        <button data-del="${p.id}" class="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm font-semibold transition">삭제</button>
                    </div>
                </td>
            </tr>`
            )
            .join('');
    }

    // ---- 이벤트 ----
    adminName.textContent = AdminAuth.current()?.id || 'admin';

    $('#logoutBtn').addEventListener('click', () => {
        AdminAuth.logout();
        location.replace(AdminAuth.LOGIN_PAGE);
    });

    $('#addBtn').addEventListener('click', () => openModal(null));
    $('#emptyAddBtn').addEventListener('click', () => openModal(null));

    searchInput.addEventListener('input', render);

    tbody.addEventListener('click', (e) => {
        const editId = e.target.getAttribute('data-edit');
        const delId = e.target.getAttribute('data-del');
        if (editId) {
            openModal(AdminProducts.get(editId));
        } else if (delId) {
            const p = AdminProducts.get(delId);
            if (p && confirm(`'${p.name}' 상품을 삭제할까요?`)) {
                AdminProducts.remove(delId);
                render();
            }
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const f = form.elements;
        const data = {
            name: f.name.value.trim(),
            price: f.price.value,
            stock: f.stock.value,
            category: f.category.value.trim(),
            image: f.image.value.trim(),
        };
        if (!data.name) {
            f.name.focus();
            return;
        }
        if (editingId) AdminProducts.update(editingId, data);
        else AdminProducts.add(data);
        closeModal();
        render();
    });

    $('#cancelBtn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
    });

    render();
})();
