// ============================================================
//  주문 관리 (구 admin-orders.html + js/admin/orders.js)
//  - GET /api/purchases?scope=all → { items, total, revenue }
//  - 새로고침은 reloadKey를 올려 useAsync를 다시 태운다
// ============================================================
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AdminHeader from '../../components/admin/AdminHeader';
import { useAsync, useDocumentTitle } from '../../hooks';
import { isLoggedIn } from '../../lib/adminAuth';
import { img } from '../../lib/format';
import { allOrders } from '../../lib/purchases';

export default function AdminOrders() {
    useDocumentTitle('🧾 주문 관리 · Coding Sister');

    const loggedIn = isLoggedIn();
    const [reloadKey, setReloadKey] = useState(0);
    const { data, loading, error } = useAsync(() => allOrders(), [reloadKey]);

    if (!loggedIn) return <Navigate to="/admin/login" replace />;

    const items = data?.items || [];

    return (
        <>
            <AdminHeader navTo="/admin/products" navLabel="📦 상품 관리" />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">🧾 주문 관리</h1>
                        <p className="text-sm text-gray-500 mt-0.5">영화 대여 결제 내역 (MongoDB Atlas 실시간 조회)</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setReloadKey((k) => k + 1)}
                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition min-h-[44px]"
                    >
                        ↻ 새로고침
                    </button>
                </div>

                {/* 요약 카드 */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow p-4 sm:p-5">
                        <p className="text-sm text-gray-400">총 주문</p>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1">
                            {data ? `${data.total.toLocaleString()}건` : '–'}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow p-4 sm:p-5">
                        <p className="text-sm text-gray-400">총 매출</p>
                        <p className="text-2xl sm:text-3xl font-bold text-indigo-600 mt-1">
                            {data ? `₩${data.revenue.toLocaleString()}` : '–'}
                        </p>
                    </div>
                </div>

                {/* 주문 목록 */}
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-left">
                                    <th className="py-3 px-4 font-semibold">영화</th>
                                    <th className="py-3 px-4 font-semibold hidden sm:table-cell">주문번호</th>
                                    <th className="py-3 px-4 font-semibold">사용자</th>
                                    <th className="py-3 px-4 font-semibold text-right">금액</th>
                                    <th className="py-3 px-4 font-semibold hidden md:table-cell text-right">주문일시</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((p) => (
                                    <tr key={p._id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                                        <td className="py-3 px-4">
                                            <Link to={`/movie/${Number(p.movieId)}`} className="flex items-center gap-3 group">
                                                {p.posterPath ? (
                                                    <img
                                                        src={img(p.posterPath, 'w92')}
                                                        alt=""
                                                        className="w-9 h-13 rounded shadow shrink-0 bg-gray-200"
                                                    />
                                                ) : (
                                                    <div className="w-9 h-13 rounded bg-gray-200 shrink-0" />
                                                )}
                                                <span className="font-semibold text-gray-800 group-hover:text-indigo-600 leading-tight">
                                                    {p.title || '(제목 없음)'}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="py-3 px-4 hidden sm:table-cell">
                                            <code className="text-xs text-gray-400">{String(p._id).slice(-8)}</code>
                                        </td>
                                        <td className="py-3 px-4 text-gray-500 text-xs">{p.userId}</td>
                                        <td className="py-3 px-4 text-right font-semibold text-gray-700">
                                            ₩{(p.price || 0).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 hidden md:table-cell text-right text-gray-400 text-xs">
                                            {new Date(p.createdAt).toLocaleString('ko-KR')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {loading && <div className="text-center py-16 text-gray-400 animate-pulse">주문 내역을 불러오는 중...</div>}

                    {!loading && !error && items.length === 0 && (
                        <div className="text-center py-16 px-4">
                            <div className="text-5xl mb-3">🧾</div>
                            <p className="text-gray-500">아직 주문이 없습니다.</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="text-center py-16 px-4">
                            <div className="text-5xl mb-3">😵</div>
                            <p className="text-gray-500">
                                주문 내역을 불러오지 못했습니다.
                                <br />
                                API 서버가 켜져 있는지 확인해주세요.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
