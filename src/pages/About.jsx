// ============================================================
//  포트폴리오 (/about) — 구 about.html + js/themes.js
//  ------------------------------------------------------------
//  테마(기본/테트리스)는 body가 아니라 이 페이지 래퍼(.about-page)에 붙인다.
//  SPA는 CSS가 전역이라 body에 붙이면 다른 라우트까지 물들기 때문 → styles/about.css
//  ※ 영화 페이지의 다크 시네마 테마(useBodyTheme('cinema'))와는 무관한 페이지다
// ============================================================
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks';
import Tetris from '../components/about/Tetris';
import ThemeModal from '../components/about/ThemeModal';
import '../styles/about.css';

// 저장 키는 구버전과 동일하게 유지 (기존 방문자의 선택을 그대로 이어받는다)
const readSavedTheme = () => localStorage.getItem('currentTheme') || 'default';

export default function About() {
    useDocumentTitle('임현수 · 백엔드 개발자 포트폴리오');

    const [theme, setTheme] = useState(readSavedTheme);
    const [modalOpen, setModalOpen] = useState(false);

    const applyTheme = useCallback((next) => {
        setTheme(next);
        localStorage.setItem('currentTheme', next);
        setModalOpen(false);
    }, []);

    return (
        <div
            className={`about-page theme-${theme} bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen font-sans transition-colors duration-300`}
        >
            {/* 헤더 */}
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600">💻 Coding Sister</h1>

                        {/* 테마 전환 버튼 */}
                        <div className="flex gap-2 items-center">
                            <button
                                type="button"
                                onClick={() => setModalOpen(true)}
                                className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition font-semibold min-h-[44px] text-sm"
                            >
                                🎨 테마
                            </button>
                            <Link
                                to="/"
                                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-semibold min-h-[44px] inline-block"
                            >
                                🎬 영화
                            </Link>
                            <Link
                                to="/todo"
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold min-h-[44px] inline-block"
                            >
                                📅 TODO 앱
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* 메인 컨텐츠 */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 기본 프로필 섹션 (두 테마 모두에서 항상 표시) */}
                <section className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-8">
                    <div className="text-center">
                        <div className="mb-6">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-indigo-600 rounded-full flex items-center justify-center text-5xl">
                                💻
                            </div>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1">
                            임현수 <span className="text-gray-400 font-medium text-xl sm:text-2xl">Lim Hyeon Soo</span>
                        </h2>
                        <p className="text-indigo-600 font-bold text-lg sm:text-xl mb-4">열심히 배우고 일하는 2년차 개발자</p>
                        <p className="text-gray-600 text-base sm:text-lg mb-6">
                            요구사항을 정확히 이해하고 팀과 소통하는 것을 중요하게 생각합니다.<br />
                            코드 품질, 명확한 문서화, 팀과의 협력으로 더 좋은 결과를 만드는 개발자입니다.
                        </p>

                        <div className="flex flex-wrap justify-center gap-3 mb-6">
                            <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full font-semibold min-h-[44px] flex items-center">
                                ☕ Java
                            </span>
                        </div>

                        <Link
                            to="/todo"
                            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold min-h-[44px]"
                        >
                            📅 TODO 앱 시작하기
                        </Link>
                    </div>
                </section>

                {/* 테트리스 게임 섹션 (테트리스 테마에서만 노출, CSS order로 맨 위에 올라간다) */}
                <section
                    className={`tetris-section bg-black rounded-lg shadow-lg p-6 sm:p-8 mb-8 ${
                        theme === 'mario' ? '' : 'hidden'
                    }`}
                >
                    <Tetris />
                </section>

                {/* 프로젝트 소개 */}
                <section className="mb-8">
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">📚 주요 프로젝트</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* 프로젝트 0: 영화 탐색 사이트 */}
                        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105">
                            <div className="text-4xl mb-4">🎬</div>
                            <h4 className="text-xl font-bold text-gray-800 mb-2">영화 탐색 사이트 (OTT 스타일)</h4>
                            <p className="text-gray-600 text-sm mb-4">
                                TMDB API를 연동해 인기·최신·장르별 영화를 둘러보고, 상세 정보와 예고편·출연진을 확인하고, 찜해두는 영화 탐색 사이트입니다.
                            </p>
                            <Link
                                to="/"
                                className="inline-flex items-center justify-center px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-semibold text-sm min-h-[44px]"
                            >
                                영화 보러가기
                            </Link>
                        </div>

                        {/* 프로젝트 1: TODO 앱 */}
                        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105">
                            <div className="text-4xl mb-4">📅</div>
                            <h4 className="text-xl font-bold text-gray-800 mb-2">스케줄 관리 TODO 앱</h4>
                            <p className="text-gray-600 text-sm mb-4">
                                날짜별로 작업을 등록하고 우선순위와 완료 상태로 관리하는 일정 관리 앱. 기획부터 구현까지 직접 진행했습니다.
                            </p>
                            <Link
                                to="/todo"
                                className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm min-h-[44px]"
                            >
                                앱 체험하기
                            </Link>
                        </div>

                        {/* 프로젝트 2: 교과검정시스템 */}
                        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105">
                            <div className="text-4xl mb-4">📚</div>
                            <h4 className="text-xl font-bold text-gray-800 mb-2">교과검정시스템</h4>
                            <p className="text-gray-600 text-sm mb-4">
                                교과서 검정 업무를 전산화한 시스템. 데이터 등록·심사 흐름과 관련 기능 개발을 맡았습니다.
                            </p>
                        </div>

                        {/* 프로젝트 3: AI API 서비스 */}
                        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105">
                            <div className="text-4xl mb-4">🤖</div>
                            <h4 className="text-xl font-bold text-gray-800 mb-2">AI 기반 API 서비스</h4>
                            <p className="text-gray-600 text-sm mb-4">
                                LangChain으로 LLM을 연동해 사용자 요청을 처리하는 API 서비스. API 설계와 연동 로직 구현을 맡았습니다.
                            </p>
                        </div>

                        {/* 프로젝트 4: PG결제 솔루션 */}
                        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105">
                            <div className="text-4xl mb-4">💳</div>
                            <h4 className="text-xl font-bold text-gray-800 mb-2">PG결제 통합 솔루션</h4>
                            <p className="text-gray-600 text-sm mb-4">
                                여러 PG(결제대행)사를 하나로 묶어 연동하는 결제 모듈. 결제 연동과 거래 처리 로직 개발을 맡았습니다.
                            </p>
                        </div>

                        {/* 프로젝트 5: 개인 프로젝트들 */}
                        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105">
                            <div className="text-4xl mb-4">🛍️</div>
                            <h4 className="text-xl font-bold text-gray-800 mb-2">개인 프로젝트</h4>
                            <p className="text-gray-600 text-sm mb-4">
                                쇼핑몰, 학습용 토이 프로젝트, 스케줄러 등 관심 분야를 직접 만들어보며 꾸준히 학습하고 있습니다.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 연락처 */}
                <section className="bg-indigo-600 text-white rounded-lg shadow-lg p-6 sm:p-8 text-center">
                    <h3 className="text-2xl sm:text-3xl font-bold mb-4">📬 연락처</h3>
                    <p className="text-lg mb-6">궁금한 점이 있으시면 편하게 연락 주세요.</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a
                            href="mailto:hyen8221@gmail.com"
                            className="px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition font-semibold min-h-[44px] flex items-center"
                        >
                            📧 hyen8221@gmail.com
                        </a>
                        <a
                            href="https://github.com/hyeonsoo123"
                            target="_blank"
                            rel="noreferrer"
                            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition font-semibold min-h-[44px] flex items-center"
                        >
                            🐙 github.com/hyeonsoo123
                        </a>
                    </div>
                </section>
            </main>

            {/* 테마 모달 */}
            {modalOpen && (
                <ThemeModal theme={theme} onSelect={applyTheme} onClose={() => setModalOpen(false)} />
            )}
        </div>
    );
}
