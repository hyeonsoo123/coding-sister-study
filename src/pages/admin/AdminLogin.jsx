// ============================================================
//  관리자 로그인 (구 admin-login.html)
//  - 이미 로그인 상태면 상품 관리로 보낸다
//  ⚠ 클라이언트 전용 데모 인증 — 실제 보안 용도로는 쓰지 말 것
// ============================================================
import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { isLoggedIn, login } from '../../lib/adminAuth';
import { useDocumentTitle } from '../../hooks';

export default function AdminLogin() {
    useDocumentTitle('🔐 관리자 로그인 · Coding Sister');

    const navigate = useNavigate();
    const [id, setId] = useState('');
    const [pw, setPw] = useState('');
    const [error, setError] = useState(false);
    const pwRef = useRef(null);

    // 훅 호출 뒤에 가드 (조건부 훅 금지)
    if (isLoggedIn()) return <Navigate to="/admin/products" replace />;

    function handleSubmit(e) {
        e.preventDefault();
        if (login(id.trim(), pw)) {
            navigate('/admin/products', { replace: true });
        } else {
            setError(true);
            setPw('');
            pwRef.current?.focus();
        }
    }

    // 다시 입력하기 시작하면 에러 문구를 숨긴다
    const clearError = () => setError(false);

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 min-h-screen flex items-center justify-center px-4">
            <main className="w-full max-w-sm">
                <div className="text-center mb-6">
                    <Link to="/" className="text-2xl font-bold text-indigo-600">
                        🎬 Coding Sister
                    </Link>
                    <p className="text-gray-500 mt-1 text-sm">상품 관리 어드민</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-4">
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">🔐 관리자 로그인</h1>

                    <label className="block">
                        <span className="block text-sm font-semibold text-gray-600 mb-1">아이디</span>
                        <input
                            name="id"
                            type="text"
                            autoComplete="username"
                            placeholder="admin"
                            value={id}
                            onChange={(e) => {
                                setId(e.target.value);
                                clearError();
                            }}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-300 outline-none min-h-[48px]"
                        />
                    </label>

                    <label className="block">
                        <span className="block text-sm font-semibold text-gray-600 mb-1">비밀번호</span>
                        <input
                            ref={pwRef}
                            name="pw"
                            type="password"
                            autoComplete="current-password"
                            placeholder="••••••••"
                            value={pw}
                            onChange={(e) => {
                                setPw(e.target.value);
                                clearError();
                            }}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-300 outline-none min-h-[48px]"
                        />
                    </label>

                    {error && (
                        <p className="text-sm text-red-500 font-medium">아이디 또는 비밀번호가 올바르지 않습니다.</p>
                    )}

                    <button
                        type="submit"
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition min-h-[48px]"
                    >
                        로그인
                    </button>

                    <p className="text-xs text-gray-400 text-center pt-1">
                        데모 계정: <b>admin</b> / <b>admin1234</b>
                    </p>
                </form>

                <div className="text-center mt-4">
                    <Link to="/" className="text-sm text-indigo-500 hover:underline">
                        ← 사이트로 돌아가기
                    </Link>
                </div>
            </main>
        </div>
    );
}
