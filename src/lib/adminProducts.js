// ============================================================
//  상품 관리 (localStorage CRUD)
//  - 필드: id, name, price, stock, category, image, createdAt
//  - 저장 키는 기존과 동일 → 기존에 등록한 상품 그대로 유지
// ============================================================
const KEY = 'cs_admin_products';

export function allProducts() {
    try {
        return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
        return [];
    }
}

function save(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
}

export function getProduct(id) {
    return allProducts().find((p) => p.id === id) || null;
}

export function addProduct(data) {
    const list = allProducts();
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
    return list;
}

export function updateProduct(id, data) {
    const list = allProducts();
    const idx = list.findIndex((p) => p.id === id);
    if (idx < 0) return list;
    list[idx] = {
        ...list[idx],
        name: data.name,
        price: Number(data.price) || 0,
        stock: Number(data.stock) || 0,
        category: data.category || '',
        image: data.image || '',
    };
    save(list);
    return list;
}

export function removeProduct(id) {
    const list = allProducts().filter((p) => p.id !== id);
    save(list);
    return list;
}

// 데모용 예시 상품 (목록이 완전히 비어있을 때 한 번만 채움)
export function seedIfEmpty() {
    if (allProducts().length > 0) return allProducts();
    const now = Date.now();
    const seed = [
        { id: 'seed3', name: '무선 블루투스 이어폰', price: 89000, stock: 42, category: '전자기기', image: '', createdAt: now - 3000 },
        { id: 'seed2', name: '스테인리스 텀블러 500ml', price: 24000, stock: 130, category: '주방용품', image: '', createdAt: now - 2000 },
        { id: 'seed1', name: '코튼 오버핏 후드티', price: 39000, stock: 0, category: '의류', image: '', createdAt: now - 1000 },
    ];
    save(seed);
    return seed;
}
