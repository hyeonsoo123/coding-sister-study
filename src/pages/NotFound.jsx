// ============================================================
//  404 — 없는 경로
// ============================================================
import { Link } from 'react-router-dom';
import { useBodyTheme, useDocumentTitle } from '../hooks';

export default function NotFound() {
    useBodyTheme('cinema');
    useDocumentTitle('404 · Coding Sister');

    return (
        <main className="max-w-3xl mx-auto px-4 py-24 text-center">
            <div className="text-7xl mb-4">🎬</div>
            <h1 className="text-3xl font-bold text-gray-800">페이지를 찾을 수 없어요</h1>
            <p className="text-gray-500 mt-2">주소가 바뀌었거나 삭제된 페이지일 수 있어요.</p>
            <Link
                to="/"
                className="inline-block mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition min-h-[44px]"
            >
                ← 홈으로
            </Link>
        </main>
    );
}
