// ============================================================
//  TODO 공용 헬퍼 (저장소 · 날짜 · 우선순위)
//  ※ 구 escapeHtml 은 React가 자동 이스케이프하므로 불필요
// ============================================================

// 구 버전과 동일한 키 — 기존 사용자의 데이터를 그대로 이어 쓴다
export const STORAGE_KEY = 'todos';

// 저장된 TODO 배열 읽기 (손상된 JSON이어도 앱이 죽지 않게 방어)
export function loadTodos() {
    try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(raw) ? raw : [];
    } catch {
        return [];
    }
}

export function saveTodos(todos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// 로컬 시간 기준 YYYY-MM-DD (toISOString의 UTC 변환으로 인한 하루 밀림 방지)
export function formatDateLocal(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function isDateToday(date) {
    return isDateEqual(date, new Date());
}

export function isDateEqual(date1, date2) {
    return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
    );
}

// 우선순위별 색상
export function getPriorityColor(priority) {
    switch (priority) {
        case 'high':
            return 'bg-red-100 text-red-800 border-red-300';
        case 'medium':
            return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'low':
            return 'bg-green-100 text-green-800 border-green-300';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// 우선순위 표시
export function getPriorityLabel(priority) {
    switch (priority) {
        case 'high':
            return '🔴 높음';
        case 'medium':
            return '🟡 중간';
        case 'low':
            return '🟢 낮음';
        default:
            return priority;
    }
}

// 정렬 기준: 높음 > 중간 > 낮음
export const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
