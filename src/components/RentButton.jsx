// ============================================================
//  대여/시청 버튼 + 결제 모달(mock) + 데모 플레이어
//  흐름: 대여하기 → 결제 모달 → POST /api/purchases → 주문완료 페이지
//        (이미 대여한 영화면 바로 시청하기)
//  ⚠️ 실제 PG 연동 없음 — 데모용
// ============================================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RENT_PRICE, isPurchased, purchase } from '../lib/purchases';
import { img } from '../lib/format';
import { useAsync } from '../hooks';
import { useToast } from './ToastProvider';

// 공용 모달 껍데기 (배경 클릭 시 닫힘)
function Modal({ onClose, children, className = 'max-w-sm' }) {
    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${className} overflow-hidden`}>
                {children}
            </div>
        </div>
    );
}

function PayModal({ movie, onClose }) {
    const [status, setStatus] = useState('idle'); // idle | paying | done
    const navigate = useNavigate();
    const toast = useToast();

    const pay = async () => {
        setStatus('paying');
        try {
            await new Promise((r) => setTimeout(r, 800)); // mock 결제 연출용 딜레이
            const item = await purchase(movie);
            setStatus('done');
            // 주문완료 페이지로 이동 (영수증 + 바로 시청)
            setTimeout(() => navigate(`/order-complete/${item._id}`), 700);
        } catch {
            setStatus('idle');
            toast('결제에 실패했습니다. 서버 상태를 확인해주세요.');
        }
    };

    return (
        <Modal onClose={onClose}>
            <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">🎬 대여 결제</h3>
                <div className="flex gap-4 mb-5">
                    <img src={img(movie.poster_path, 'w185')} alt="" className="w-20 rounded-lg shadow" />
                    <div className="min-w-0">
                        <p className="font-bold text-gray-800 leading-snug">{movie.title}</p>
                        <p className="text-sm text-gray-500 mt-1">7일 동안 시청 가능</p>
                        <p className="text-xl font-bold text-indigo-600 mt-2">₩{RENT_PRICE.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 mb-5">
                    데모 결제입니다. 실제 과금되지 않습니다.
                </div>
                <button
                    type="button"
                    onClick={pay}
                    disabled={status !== 'idle'}
                    className={`w-full py-3 text-white rounded-lg font-bold min-h-[44px] transition
                                ${status === 'done' ? 'bg-green-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                    {status === 'idle' && `₩${RENT_PRICE.toLocaleString()} 결제하기`}
                    {status === 'paying' && '결제 처리 중...'}
                    {status === 'done' && '✅ 결제 완료!'}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2 mt-2 text-gray-500 text-sm hover:text-gray-700"
                >
                    취소
                </button>
            </div>
        </Modal>
    );
}

export function PlayerModal({ movie, onClose }) {
    return (
        <Modal onClose={onClose}>
            <div className="bg-black">
                <div className="aspect-video flex flex-col items-center justify-center text-center p-6">
                    <div className="text-6xl mb-4 animate-pulse">▶️</div>
                    <p className="text-white font-bold text-lg">{movie.title}</p>
                    <p className="text-gray-400 text-sm mt-2">
                        데모 플레이어 — 실제 스트리밍은 제공되지 않습니다
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-3 bg-gray-900 text-gray-300 text-sm hover:bg-gray-800"
                >
                    닫기
                </button>
            </div>
        </Modal>
    );
}

export default function RentButton({ movie }) {
    const { data: purchased, loading, error } = useAsync(() => isPurchased(movie.id), [movie.id]);
    const [modal, setModal] = useState(null); // 'pay' | 'play' | null

    // API 서버가 안 떠 있으면(로컬에서 npm run api 미실행 등) 버튼을 숨긴다
    if (loading || error) return null;

    return (
        <>
            <button
                type="button"
                onClick={() => setModal(purchased ? 'play' : 'pay')}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-lg font-bold min-h-[44px] transition text-white
                            ${purchased ? 'bg-green-500 hover:bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
                {purchased ? '▶️ 시청하기' : `🎟 대여하기 · ₩${RENT_PRICE.toLocaleString()}`}
            </button>

            {modal === 'pay' && <PayModal movie={movie} onClose={() => setModal(null)} />}
            {modal === 'play' && <PlayerModal movie={movie} onClose={() => setModal(null)} />}
        </>
    );
}
