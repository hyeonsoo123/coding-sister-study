// ============================================================
//  작업 입력 폼 (제목 · 상세 설명 · 우선순위)
// ============================================================
import { useState } from 'react';

export default function TodoForm({ heading, onAdd }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');

    // onAdd는 추가에 성공했을 때만 true — 제목이 비면 입력값을 지우지 않는다
    const submit = () => {
        if (!onAdd(title, description, priority)) return;
        setTitle('');
        setDescription('');
        setPriority('medium');
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
                <span>{heading}</span>
            </h2>

            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">작업 제목</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) submit();
                    }}
                    placeholder="작업 제목을 입력하세요..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base min-h-[44px]"
                />
            </div>

            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">상세 설명</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="작업에 대한 설명을 입력하세요..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base min-h-[120px] resize-none"
                />
            </div>

            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">우선순위</label>
                <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                >
                    <option value="low">🟢 낮음</option>
                    <option value="medium">🟡 중간</option>
                    <option value="high">🔴 높음</option>
                </select>
            </div>

            <button
                type="button"
                onClick={submit}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold min-h-[44px]"
            >
                ➕ 작업 추가
            </button>
        </div>
    );
}
