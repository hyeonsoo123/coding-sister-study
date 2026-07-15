// ============================================================
//  월간 캘린더 — 날짜 선택 + 작업 있는 날 강조
//  구 버전은 모바일/데스크톱 두 <div>에 같은 DOM을 두 번 그렸지만,
//  여기서는 같은 컴포넌트를 두 자리에 렌더링하면 끝난다
// ============================================================
import { useMemo } from 'react';
import { formatDateLocal, isDateEqual, isDateToday } from './todoUtils';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

export default function Calendar({ monthDate, selectedDate, todos, onPrevMonth, onNextMonth, onSelectDate }) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    // 작업이 하나라도 있는 날짜 집합 (매 칸마다 todos를 훑지 않도록)
    const datesWithTodos = useMemo(() => new Set(todos.map((todo) => todo.date)), [todos]);

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // 1일 앞을 채우는 이전 달 날짜들
    const leadingDays = [];
    for (let i = firstDay - 1; i >= 0; i--) leadingDays.push(daysInPrevMonth - i);

    const monthDays = [];
    for (let day = 1; day <= daysInMonth; day++) monthDays.push(day);

    // 6주 × 7일 = 42칸 고정 → 달을 넘겨도 캘린더 높이가 흔들리지 않는다
    const trailingDays = [];
    for (let day = 1; day <= 42 - leadingDays.length - monthDays.length; day++) trailingDays.push(day);

    return (
        <div>
            {/* 헤더 (월/연도 및 네비게이션) */}
            <div className="flex justify-between items-center mb-3 gap-2">
                <button
                    type="button"
                    onClick={onPrevMonth}
                    className="px-2 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold flex items-center justify-center flex-shrink-0"
                >
                    ◀️
                </button>
                <h3 className="text-base sm:text-lg font-bold text-gray-800 text-center flex-1">
                    📅 {year}년 {month + 1}월
                </h3>
                <button
                    type="button"
                    onClick={onNextMonth}
                    className="px-2 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold flex items-center justify-center flex-shrink-0"
                >
                    ▶️
                </button>
            </div>

            {/* 요일 표시 */}
            <div className="grid grid-cols-7 gap-0.5 mb-2">
                {DAY_NAMES.map((day) => (
                    <div key={day} className="text-center font-semibold text-gray-600 py-1 text-xs sm:text-sm">
                        {day}
                    </div>
                ))}
            </div>

            {/* 날짜 */}
            <div className="grid grid-cols-7 gap-0.5">
                {leadingDays.map((day) => (
                    <button
                        key={`prev-${day}`}
                        type="button"
                        disabled
                        className="aspect-square p-0 text-center text-gray-400 text-xs sm:text-sm rounded"
                    >
                        {day}
                    </button>
                ))}

                {monthDays.map((day) => {
                    const dateObj = new Date(year, month, day);
                    const isToday = isDateToday(dateObj);
                    const isSelected = isDateEqual(dateObj, selectedDate);
                    const hasTodos = datesWithTodos.has(formatDateLocal(dateObj));

                    let classes = 'aspect-square p-0 text-center text-xs sm:text-sm font-semibold rounded transition';
                    if (isSelected) {
                        classes += ' bg-indigo-600 text-white ring-2 ring-indigo-400';
                    } else if (isToday) {
                        classes += ' bg-blue-100 text-indigo-600 border-2 border-indigo-600';
                    } else {
                        classes += ' bg-gray-100 text-gray-800 hover:bg-gray-200';
                    }
                    if (hasTodos && !isSelected) classes += ' font-bold';

                    return (
                        <button key={day} type="button" className={classes} onClick={() => onSelectDate(dateObj)}>
                            {day}
                        </button>
                    );
                })}

                {trailingDays.map((day) => (
                    <button
                        key={`next-${day}`}
                        type="button"
                        disabled
                        className="aspect-square p-0 text-center text-gray-400 text-xs sm:text-sm rounded"
                    >
                        {day}
                    </button>
                ))}
            </div>
        </div>
    );
}
