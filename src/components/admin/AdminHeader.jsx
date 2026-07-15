// ============================================================
//  어드민 공용 헤더 (로고 + 반대편 페이지 링크 + 관리자명 + 로그아웃)
//  - 상품/주문 페이지가 서로를 가리키므로 링크는 prop으로 받는다
// ============================================================
import { Link, useNavigate } from 'react-router-dom';
import { currentAdmin, logout } from '../../lib/adminAuth';

export default function AdminHeader({ navTo, navLabel }) {
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate('/admin/login', { replace: true });
    }

    return (
        <header className="bg-white shadow-md sticky top-0 z-40">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
                <Link to="/" className="text-lg sm:text-xl font-bold text-indigo-600 shrink-0">
                    🎬<span className="hidden sm:inline"> Coding Sister</span>
                </Link>
                <div className="flex items-center gap-2 sm:gap-3">
                    <Link
                        to={navTo}
                        className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition text-sm font-semibold min-h-[44px] inline-flex items-center"
                    >
                        {navLabel}
                    </Link>
                    <span className="text-sm text-gray-500 hidden sm:inline">
                        👤 <b className="text-gray-700">{currentAdmin()?.id || 'admin'}</b>
                    </span>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition text-sm font-semibold min-h-[44px]"
                    >
                        로그아웃
                    </button>
                </div>
            </div>
        </header>
    );
}
