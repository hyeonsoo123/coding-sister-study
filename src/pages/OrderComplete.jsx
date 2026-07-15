// ============================================================
//  주문 완료 (/order-complete/:orderId)
//  결제 직후 이동하는 영수증 화면 — 주문번호/일시/금액 + 바로 시청
// ============================================================
import { Link, useParams } from 'react-router-dom';
import { getOrder } from '../lib/purchases';
import { img } from '../lib/format';
import { useAsync, useBodyTheme, useDocumentTitle } from '../hooks';

export default function OrderComplete() {
    useBodyTheme('cinema');
    useDocumentTitle('✅ 주문 완료 · Coding Sister');

    const { orderId } = useParams();
    const { data: item, loading, error } = useAsync(() => getOrder(orderId), [orderId]);

    return (
        <>
            <header className="bg-white shadow-md">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
                    <Link to="/" className="text-xl font-bold text-indigo-600">
                        🎬 Coding Sister 영화
                    </Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
                {loading && <div className="text-center py-20 text-gray-400 animate-pulse">주문 정보를 불러오는 중...</div>}

                {error && (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">😵</div>
                        <p className="text-lg font-bold text-gray-700">{error.message}</p>
                        <Link
                            to="/"
                            className="inline-block mt-5 px-5 py-3 bg-indigo-600 text-white rounded-lg font-semibold"
                        >
                            ← 홈으로
                        </Link>
                    </div>
                )}

                {item && (
                    <>
                        <div className="text-center mb-8">
                            <div className="text-6xl mb-3">🎉</div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">결제가 완료되었습니다!</h1>
                            <p className="text-gray-500 mt-2">7일 동안 시청할 수 있어요.</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className="flex gap-5 p-6">
                                <img
                                    src={img(item.posterPath, 'w342')}
                                    alt=""
                                    className="w-24 sm:w-32 rounded-xl shadow shrink-0 bg-gray-200"
                                />
                                <div className="min-w-0 text-left">
                                    <p className="font-bold text-lg sm:text-xl text-gray-900 leading-snug">{item.title}</p>
                                    <dl className="mt-3 space-y-1.5 text-sm">
                                        <div className="flex gap-2">
                                            <dt className="text-gray-400 w-16 shrink-0">주문번호</dt>
                                            <dd className="text-gray-700 font-mono break-all">{item._id}</dd>
                                        </div>
                                        <div className="flex gap-2">
                                            <dt className="text-gray-400 w-16 shrink-0">결제일시</dt>
                                            <dd className="text-gray-700">
                                                {new Date(item.createdAt).toLocaleString('ko-KR')}
                                            </dd>
                                        </div>
                                        <div className="flex gap-2">
                                            <dt className="text-gray-400 w-16 shrink-0">결제금액</dt>
                                            <dd className="text-indigo-600 font-bold">
                                                ₩{(item.price || 0).toLocaleString()}
                                            </dd>
                                        </div>
                                        <div className="flex gap-2">
                                            <dt className="text-gray-400 w-16 shrink-0">결제수단</dt>
                                            <dd className="text-gray-700">데모 결제 (실제 과금 없음)</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-px bg-gray-100">
                                <Link
                                    to={`/movie/${item.movieId}`}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-center py-4 font-bold transition"
                                >
                                    ▶️ 바로 시청하기
                                </Link>
                                <Link
                                    to="/my-page"
                                    className="bg-white hover:bg-gray-50 text-gray-700 text-center py-4 font-bold transition"
                                >
                                    🙋 마이페이지
                                </Link>
                            </div>
                        </div>

                        <p className="text-center mt-6">
                            <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">
                                ← 계속 둘러보기
                            </Link>
                        </p>
                    </>
                )}
            </main>
        </>
    );
}
