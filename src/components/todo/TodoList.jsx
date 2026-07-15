// ============================================================
//  필터 바 + 작업 목록 + 통계 (구 버전의 흰 카드 한 장 = 이 컴포넌트)
// ============================================================
import { getPriorityColor, getPriorityLabel } from './todoUtils';

const FILTERS = [
    { key: 'all', label: '전체' },
    { key: 'active', label: '진행중' },
    { key: 'completed', label: '완료' },
];

// todos는 이미 날짜·필터·정렬이 끝난 목록
export default function TodoList({ todos, filter, onFilterChange, onToggle, onDelete }) {
    const completedCount = todos.filter((t) => t.completed).length;

    return (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            {/* TODO 필터 */}
            <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b">
                {FILTERS.map(({ key, label }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onFilterChange(key)}
                        className={`px-4 py-3 sm:py-2 rounded-full font-semibold min-h-[44px] text-sm ${
                            filter === key ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* TODO 목록 */}
            <div className="space-y-4">
                {todos.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">이 날짜에 작업이 없습니다.</p>
                ) : (
                    <>
                        {todos.map((todo) => (
                            <div
                                key={todo.id}
                                className={`p-4 rounded-lg border-2 transition ${
                                    todo.completed
                                        ? 'bg-gray-100 border-gray-300 opacity-60'
                                        : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md'
                                }`}
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    <input
                                        type="checkbox"
                                        checked={todo.completed}
                                        onChange={() => onToggle(todo.id)}
                                        className="w-5 h-5 text-indigo-600 rounded cursor-pointer mt-1 min-h-[44px] sm:min-h-5"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={`text-lg font-semibold text-gray-800 ${
                                                todo.completed ? 'line-through text-gray-500' : ''
                                            } break-words`}
                                        >
                                            {todo.title}
                                        </p>
                                        {todo.description && (
                                            <p className="text-sm text-gray-600 mt-2 break-words">{todo.description}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-semibold border ${getPriorityColor(
                                            todo.priority
                                        )}`}
                                    >
                                        {getPriorityLabel(todo.priority)}
                                    </span>
                                    <span className="text-xs text-gray-500">생성: {todo.createdAt}</span>
                                    {todo.completedAt && (
                                        <span className="text-xs text-green-600 font-semibold">
                                            완료: {todo.completedAt}
                                        </span>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => onDelete(todo.id)}
                                    className="w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded transition font-semibold min-h-[44px] border border-red-200"
                                >
                                    🗑️ 삭제
                                </button>
                            </div>
                        ))}

                        {/* 통계 — 구 버전과 동일하게 목록이 비면 표시하지 않는다 */}
                        <div className="mt-6 pt-4 border-t text-sm text-gray-600">
                            <p>
                                완료: <strong>{completedCount}</strong> / 총: <strong>{todos.length}</strong>
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
