// ============================================================
//  영화 사이트 공용 헤더 (로고 + 언어 선택 + 메뉴)
//  모바일에서는 햄버거로 접힌다
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LANGS, currentLang, setLang, t } from '../lib/i18n';

export default function Header() {
    const [open, setOpen] = useState(false);
    const panelRef = useRef(null);
    const btnRef = useRef(null);

    // 바깥 클릭 시 메뉴 닫기
    useEffect(() => {
        if (!open) return undefined;
        const onClick = (e) => {
            if (!panelRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, [open]);

    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative">
                <div className="flex justify-between items-center gap-3">
                    <Link to="/" className="text-xl sm:text-2xl font-bold text-indigo-600 shrink-0">
                        🎬<span className="hidden sm:inline"> Coding Sister 영화</span>
                    </Link>

                    <button
                        ref={btnRef}
                        type="button"
                        aria-label="menu"
                        onClick={() => setOpen((v) => !v)}
                        className="sm:hidden px-3 py-2 bg-indigo-100 text-indigo-600 rounded-lg min-h-[44px] text-xl leading-none"
                    >
                        ☰
                    </button>

                    <div
                        ref={panelRef}
                        className={`${open ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row items-stretch sm:items-center gap-2
                                    absolute sm:static top-full right-4 sm:right-auto mt-2 sm:mt-0 p-3 sm:p-0
                                    rounded-xl sm:rounded-none bg-[#16171d] sm:bg-transparent
                                    border border-white/10 sm:border-0 shadow-xl sm:shadow-none z-50`}
                    >
                        <select
                            aria-label="Language"
                            value={currentLang()}
                            onChange={(e) => setLang(e.target.value)}
                            className="px-2 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold min-h-[44px] outline-none cursor-pointer border border-indigo-100"
                        >
                            {Object.entries(LANGS).map(([k, v]) => (
                                <option key={k} value={k}>
                                    {v.label}
                                </option>
                            ))}
                        </select>
                        <Link
                            to="/my-page"
                            className="px-3 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition font-semibold text-sm min-h-[44px] flex items-center"
                        >
                            🙋 <span className="ml-1">마이페이지</span>
                        </Link>
                        <Link
                            to="/about"
                            className="px-3 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition font-semibold text-sm min-h-[44px] flex items-center"
                        >
                            👤 <span className="ml-1">{t('header_about')}</span>
                        </Link>
                        <Link
                            to="/todo"
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm min-h-[44px] flex items-center"
                        >
                            📅 <span className="ml-1">TODO</span>
                        </Link>
                        <Link
                            to="/admin/products"
                            className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition font-semibold text-sm min-h-[44px] flex items-center"
                        >
                            🔐 <span className="ml-1">관리자</span>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}
