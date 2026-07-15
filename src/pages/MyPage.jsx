// ============================================================
//  마이페이지 (/my-page)
//  - 🎟 내 대여: Atlas에 저장된 대여 목록 + 바로 시청
//  - ✅ 할 일: TODO 앱을 컴포넌트로 그대로 품는다 (같은 localStorage 공유)
// ============================================================
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { guestId, myPurchases } from '../lib/purchases';
import { img } from '../lib/format';
import { useAsync, useBodyTheme, useDocumentTitle } from '../hooks';
import { PlayerModal } from '../components/RentButton';
import TodoApp from '../components/todo/TodoApp';

function Rentals() {
    const { data: items, loading, error } = useAsync(() => myPurchases(), []);
    const [playing, setPlaying] = useState(null);

    if (loading) return <div className="text-center py-16 text-gray-400 animate-pulse">대여 목록을 불러오는 중...</div>;
    if (error) {
        return (
            <div className="text-center py-16">
                <p className="text-gray-500">대여 목록을 불러오지 못했어요. API 서버가 켜져 있는지 확인해주세요.</p>
            </div>
        );
    }
    if (!items.length) {
        return (
            <div className="text-center py-16">
                <div className="text-5xl mb-3">🎟</div>
                <p className="text-gray-500">아직 대여한 영화가 없어요.</p>
                <Link
                    to="/"
                    className="inline-block mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition min-h-[44px]"
                >
                    영화 둘러보기
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((p) => (
                    <div key={p._id} className="bg-white rounded-xl shadow p-4 flex gap-4">
                        <Link to={`/movie/${p.movieId}`} className="shrink-0">
                            <img src={img(p.posterPath, 'w185')} alt="" className="w-20 rounded-lg shadow bg-gray-200" />
                        </Link>
                        <div className="min-w-0 flex-1">
                            <p className="font-bold text-gray-900 leading-snug">{p.title || '(제목 없음)'}</p>
                            <p className="text-xs text-gray-400 mt-1">
                                {new Date(p.createdAt).toLocaleDateString('ko-KR')} 대여 · ₩
                                {(p.price || 0).toLocaleString()}
                            </p>
                            <div className="mt-3 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPlaying({ id: p.movieId, title: p.title, poster_path: p.posterPath })}
                                    className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-bold min-h-[40px] transition"
                                >
                                    ▶️ 시청하기
                                </button>
                                <Link
                                    to={`/movie/${p.movieId}`}
                                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-semibold min-h-[40px] inline-flex items-center transition"
                                >
                                    상세
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {playing && <PlayerModal movie={playing} onClose={() => setPlaying(null)} />}
        </>
    );
}

export default function MyPage() {
    useBodyTheme('cinema');
    useDocumentTitle('🙋 마이페이지 · Coding Sister');

    const [tab, setTab] = useState('rentals');

    const tabClass = (name) =>
        `px-4 py-2 rounded-lg font-semibold text-sm min-h-[44px] transition ${
            tab === name ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'
        }`;

    return (
        <>
            <header className="bg-white shadow-md sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
                    <Link to="/" className="text-lg sm:text-xl font-bold text-indigo-600">
                        🎬<span className="hidden sm:inline"> Coding Sister 영화</span>
                    </Link>
                    <span className="text-sm text-gray-500">
                        👤 <b className="text-gray-700">{guestId()}</b>
                    </span>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">🙋 마이페이지</h1>

                <nav className="flex gap-2 mb-5">
                    <button type="button" className={tabClass('rentals')} onClick={() => setTab('rentals')}>
                        🎟 내 대여
                    </button>
                    <button type="button" className={tabClass('todo')} onClick={() => setTab('todo')}>
                        ✅ 할 일
                    </button>
                </nav>

                {tab === 'rentals' ? (
                    <Rentals />
                ) : (
                    // iframe이 아니라 컴포넌트로 직접 품는다 (SPA 전환의 이점)
                    <div className="bg-white rounded-xl shadow p-4 sm:p-6">
                        <TodoApp />
                    </div>
                )}
            </main>
        </>
    );
}
