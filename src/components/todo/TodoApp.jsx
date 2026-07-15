// ============================================================
//  TODO + 캘린더 본체 (구 calendar.js + todo.js + app.js)
//  페이지 크롬(헤더·제목·배경)은 여기 두지 않는다 —
//  /todo 페이지와 마이페이지 탭 양쪽에 그대로 얹히기 위함.
//  ※ 마이페이지는 다크(시네마) 테마 위에서 이걸 렌더링하므로
//    바깥 배경은 감싸는 쪽 컨테이너에 맡긴다
// ============================================================
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../ToastProvider';
import Calendar from './Calendar';
import TodoForm from './TodoForm';
import TodoList from './TodoList';
import { PRIORITY_ORDER, formatDateLocal, loadTodos, saveTodos } from './todoUtils';

export default function TodoApp() {
    const toast = useToast();

    const [todos, setTodos] = useState(loadTodos);
    const [filter, setFilter] = useState('all');
    const [monthDate, setMonthDate] = useState(() => new Date()); // 캘린더가 보고 있는 달
    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [tab, setTab] = useState('calendar'); // 모바일 전용 탭

    // 구 버전은 beforeunload에서 저장했지만, SPA에서는 목록이 바뀔 때마다 저장한다.
    // 탭이 강제 종료되거나 라우트만 이동해도 데이터가 남으므로 더 안전하다.
    useEffect(() => {
        saveTodos(todos);
    }, [todos]);

    // 선택한 날짜의 작업만 → 상태 필터 → 정렬(미완료 먼저, 그 다음 우선순위)
    const visibleTodos = useMemo(() => {
        const selectedDateStr = formatDateLocal(selectedDate);
        return todos
            .filter((todo) => todo.date === selectedDateStr)
            .filter((todo) => {
                if (filter === 'active') return !todo.completed;
                if (filter === 'completed') return todo.completed;
                return true;
            })
            .sort((a, b) => {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
            });
    }, [todos, selectedDate, filter]);

    const selectedDateText = useMemo(() => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        return `${selectedDate.toLocaleDateString('ko-KR', options)} 작업`;
    }, [selectedDate]);

    // 저장되는 객체 모양은 구 버전과 완전히 동일해야 한다 (기존 데이터 호환)
    const addTodo = (title, description, priority) => {
        if (!title.trim()) {
            toast('작업 제목을 입력하세요.');
            return false;
        }
        const newTodo = {
            id: Date.now(),
            title: title.trim(),
            description: description.trim(),
            priority,
            completed: false,
            date: formatDateLocal(selectedDate),
            createdAt: new Date().toLocaleString('ko-KR'),
            completedAt: null,
        };
        setTodos((prev) => [newTodo, ...prev]); // 구 unshift와 동일 (최신순 저장)
        return true;
    };

    const deleteTodo = (id) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;
        setTodos((prev) => prev.filter((todo) => todo.id !== id));
    };

    const toggleTodo = (id) => {
        setTodos((prev) =>
            prev.map((todo) => {
                if (todo.id !== id) return todo;
                const completed = !todo.completed;
                return { ...todo, completed, completedAt: completed ? new Date().toLocaleString('ko-KR') : null };
            })
        );
    };

    // 달 이동은 항상 1일 기준 — 31일에 30일뿐인 달로 넘어갈 때 날짜가 튀지 않는다
    const goPrevMonth = () => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const goNextMonth = () => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

    const selectTab = (next) => {
        setTab(next);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const calendar = (
        <Calendar
            monthDate={monthDate}
            selectedDate={selectedDate}
            todos={todos}
            onPrevMonth={goPrevMonth}
            onNextMonth={goNextMonth}
            onSelectDate={setSelectedDate}
        />
    );

    return (
        <>
            {/* 모바일: 탭 네비게이션 */}
            <div className="lg:hidden mb-6">
                <div className="flex gap-2 bg-gray-200 rounded-lg p-1">
                    <button
                        type="button"
                        onClick={() => selectTab('calendar')}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition min-h-[44px] ${
                            tab === 'calendar' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        📅 캘린더
                    </button>
                    <button
                        type="button"
                        onClick={() => selectTab('todo')}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition min-h-[44px] ${
                            tab === 'todo' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        ✅ TODO
                    </button>
                </div>
            </div>

            {/* 모바일: 캘린더 탭 (데스크톱에서는 항상 숨김 — 아래 3단 그리드가 대신 보여준다) */}
            <div className={`lg:hidden mb-6 ${tab === 'todo' ? 'hidden' : ''}`}>
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">{calendar}</div>
            </div>

            {/* 모바일: TODO 탭 & 데스크톱: 전체 레이아웃 */}
            <div className={`${tab === 'calendar' ? 'hidden ' : ''}lg:block lg:grid grid-cols-1 lg:grid-cols-3 gap-6`}>
                {/* 데스크톱: 캘린더 */}
                <div className="hidden lg:block">
                    <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">{calendar}</div>
                </div>

                {/* TODO 섹션 */}
                <div className="lg:col-span-2">
                    <TodoForm heading={selectedDateText} onAdd={addTodo} />
                    <TodoList
                        todos={visibleTodos}
                        filter={filter}
                        onFilterChange={setFilter}
                        onToggle={toggleTodo}
                        onDelete={deleteTodo}
                    />
                </div>
            </div>
        </>
    );
}
