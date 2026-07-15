// ============================================================
//  상품 관리 (구 admin-products.html + js/admin/products.js)
//  - CRUD는 lib/adminProducts가 담당, 여기서는 화면/상태만
//  - add/update/remove는 새 목록을 반환 → 그대로 state에 넣는다
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminHeader from '../../components/admin/AdminHeader';
import { useToast } from '../../components/ToastProvider';
import { useDocumentTitle } from '../../hooks';
import { isLoggedIn } from '../../lib/adminAuth';
import { addProduct, removeProduct, seedIfEmpty, updateProduct } from '../../lib/adminProducts';

const EMPTY_FORM = { name: '', price: '', stock: '', category: '', image: '' };

const won = (n) => n.toLocaleString('ko-KR') + '원';

// 이미지가 없거나 로드 실패하면 📦 플레이스홀더 (구 onerror 대체)
function Thumb({ src }) {
    const [broken, setBroken] = useState(false);

    if (!src || broken) {
        return (
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xl">
                📦
            </div>
        );
    }
    return (
        <img
            src={src}
            alt=""
            onError={() => setBroken(true)}
            className="w-12 h-12 rounded-lg object-cover bg-gray-100"
        />
    );
}

function StockBadge({ stock }) {
    if (stock <= 0) {
        return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-semibold">품절</span>;
    }
    if (stock < 10) {
        return (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                {stock}개 · 부족
            </span>
        );
    }
    return (
        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
            {stock}개
        </span>
    );
}

export default function AdminProducts() {
    useDocumentTitle('📦 상품 관리 · Coding Sister');

    const toast = useToast();
    const loggedIn = isLoggedIn();

    // 미로그인이면 씨드를 심지 않는다 (가드에서 어차피 튕김)
    const [products, setProducts] = useState(() => (loggedIn ? seedIfEmpty() : []));
    const [q, setQ] = useState('');
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const nameRef = useRef(null);

    // 모달 열려 있을 때만 ESC로 닫기
    useEffect(() => {
        if (!open) return undefined;
        const onKeyDown = (e) => e.key === 'Escape' && closeModal();
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open]);

    const list = useMemo(() => {
        const key = q.trim().toLowerCase();
        return products.filter(
            (p) => !key || p.name.toLowerCase().includes(key) || p.category.toLowerCase().includes(key)
        );
    }, [products, q]);

    if (!loggedIn) return <Navigate to="/admin/login" replace />;

    function openModal(product) {
        setEditingId(product?.id || null);
        setForm({
            name: product?.name || '',
            price: product?.price ?? '',
            stock: product?.stock ?? '',
            category: product?.category || '',
            image: product?.image || '',
        });
        setOpen(true);
    }

    function closeModal() {
        setOpen(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
    }

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    }

    function handleSubmit(e) {
        e.preventDefault();
        const data = {
            name: form.name.trim(),
            price: form.price,
            stock: form.stock,
            category: form.category.trim(),
            image: form.image.trim(),
        };
        if (!data.name) {
            nameRef.current?.focus();
            return;
        }
        setProducts(editingId ? updateProduct(editingId, data) : addProduct(data));
        toast(editingId ? '상품을 수정했어요' : '상품을 추가했어요');
        closeModal();
    }

    function handleDelete(p) {
        if (confirm(`'${p.name}' 상품을 삭제할까요?`)) {
            setProducts(removeProduct(p.id));
            toast('상품을 삭제했어요');
        }
    }

    return (
        <>
            <AdminHeader navTo="/admin/orders" navLabel="🧾 주문 관리" />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                {/* 타이틀 + 액션 */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">📦 상품 관리</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            <span>총 {list.length}개</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <input
                                type="search"
                                placeholder="상품명·카테고리 검색…"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                className="w-full sm:w-64 pl-4 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-300 outline-none min-h-[44px]"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => openModal(null)}
                            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition min-h-[44px] whitespace-nowrap"
                        >
                            + 상품 추가
                        </button>
                    </div>
                </div>

                {/* 목록 */}
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-left">
                                    <th className="py-3 px-4 font-semibold">상품</th>
                                    <th className="py-3 px-4 font-semibold hidden sm:table-cell">카테고리</th>
                                    <th className="py-3 px-4 font-semibold hidden sm:table-cell text-right">가격</th>
                                    <th className="py-3 px-4 font-semibold text-center">재고</th>
                                    <th className="py-3 px-4 font-semibold text-right">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.map((p) => (
                                    <tr key={p.id} className="border-b border-gray-100 hover:bg-indigo-50/40 transition">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <Thumb src={p.image} />
                                                <div>
                                                    <p className="font-semibold text-gray-800">{p.name}</p>
                                                    <p className="text-xs text-gray-400 sm:hidden">
                                                        {p.category || '미분류'} · {won(p.price)}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 hidden sm:table-cell text-gray-600">
                                            {p.category || <span className="text-gray-300">미분류</span>}
                                        </td>
                                        <td className="py-3 px-4 hidden sm:table-cell text-right font-semibold text-gray-800">
                                            {won(p.price)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <StockBadge stock={p.stock} />
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => openModal(p)}
                                                    className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-sm font-semibold transition"
                                                >
                                                    수정
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(p)}
                                                    className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm font-semibold transition"
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 빈 상태 */}
                    {list.length === 0 && (
                        <div className="text-center py-16 px-4">
                            <div className="text-5xl mb-3">📦</div>
                            <p className="text-gray-500">
                                {q.trim() ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다.'}
                            </p>
                            <button
                                type="button"
                                onClick={() => openModal(null)}
                                className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition min-h-[44px]"
                            >
                                + 첫 상품 추가
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* 상품 추가/수정 모달 */}
            {open && (
                <div
                    onClick={(e) => e.target === e.currentTarget && closeModal()} // 배경 클릭만 닫기
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                >
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <h2 className="text-xl font-bold text-gray-800">{editingId ? '상품 수정' : '상품 추가'}</h2>

                            <label className="block">
                                <span className="block text-sm font-semibold text-gray-600 mb-1">
                                    상품명 <span className="text-red-400">*</span>
                                </span>
                                <input
                                    ref={nameRef}
                                    autoFocus
                                    name="name"
                                    type="text"
                                    required
                                    maxLength={80}
                                    value={form.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-300 outline-none min-h-[44px]"
                                />
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="block text-sm font-semibold text-gray-600 mb-1">가격(원)</span>
                                    <input
                                        name="price"
                                        type="number"
                                        min="0"
                                        step="100"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={form.price}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-300 outline-none min-h-[44px]"
                                    />
                                </label>
                                <label className="block">
                                    <span className="block text-sm font-semibold text-gray-600 mb-1">재고(개)</span>
                                    <input
                                        name="stock"
                                        type="number"
                                        min="0"
                                        step="1"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={form.stock}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-300 outline-none min-h-[44px]"
                                    />
                                </label>
                            </div>

                            <label className="block">
                                <span className="block text-sm font-semibold text-gray-600 mb-1">카테고리</span>
                                <input
                                    name="category"
                                    type="text"
                                    maxLength={40}
                                    placeholder="예: 전자기기"
                                    value={form.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-300 outline-none min-h-[44px]"
                                />
                            </label>

                            <label className="block">
                                <span className="block text-sm font-semibold text-gray-600 mb-1">이미지 URL</span>
                                <input
                                    name="image"
                                    type="url"
                                    placeholder="https://…"
                                    value={form.image}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-300 outline-none min-h-[44px]"
                                />
                            </label>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg font-semibold hover:bg-gray-200 transition min-h-[44px]"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition min-h-[44px]"
                                >
                                    저장
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
