// ============================================================
//  프로젝트 작업 캘린더 페이지 (구 todo.html)
//  실제 TODO+캘린더 로직은 <TodoApp />에 있다 (마이페이지 탭과 공유)
//  ※ 영화 페이지가 아니므로 시네마(다크) 테마를 쓰지 않는다 — 라이트 유지
// ============================================================
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks';
import TodoApp from '../components/todo/TodoApp';

export default function TodoPage() {
    useDocumentTitle('프로젝트 작업 캘린더 · 임현수 포트폴리오');

    return (
        <>
            {/* 헤더 */}
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600">📅 프로젝트 작업 캘린더</h1>
                        <div className="flex gap-2">
                            <Link
                                to="/"
                                className="inline-flex items-center justify-center px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-semibold min-h-[44px] text-sm"
                            >
                                🎬 영화
                            </Link>
                            <Link
                                to="/about"
                                className="inline-flex items-center justify-center px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition font-semibold min-h-[44px] text-sm"
                            >
                                👤 내 정보
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* 메인 컨텐츠 */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <TodoApp />
            </main>
        </>
    );
}
