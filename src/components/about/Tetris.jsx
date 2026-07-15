// ============================================================
//  테트리스 미니게임 (구 js/tetris.js)
//  ------------------------------------------------------------
//  - 캔버스는 ref로 직접 그리고, 점수/레벨/라인만 state로 노출한다
//  - 보드·조각 같은 게임 상태는 매 프레임 바뀌므로 ref에 둔다
//    (리렌더를 유발하지 않고, 콜백이 옛 값을 붙잡는 일도 없다)
//  - SPA라 언마운트 시 rAF/keydown 정리가 필수 — 안 하면 루프가 계속 돈다
// ============================================================
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../ToastProvider';

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

// 테트리스 블록 정의
const PIECES = [
    { shape: [[1, 1, 1, 1]], color: '#00FFFF' }, // I
    { shape: [[1, 1], [1, 1]], color: '#FFFF00' }, // O
    { shape: [[0, 1, 0], [1, 1, 1]], color: '#9933FF' }, // T
    { shape: [[1, 0, 0], [1, 1, 1]], color: '#0000FF' }, // J
    { shape: [[0, 0, 1], [1, 1, 1]], color: '#FFA500' }, // L
    { shape: [[0, 1, 1], [1, 1, 0]], color: '#00FF00' }, // S
    { shape: [[1, 1, 0], [0, 1, 1]], color: '#FF0000' } // Z
];

const createGrid = () => Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 0));

// 원본을 회전으로 훼손하지 않도록 shape를 복사해서 넘긴다
function getRandomPiece() {
    const piece = PIECES[Math.floor(Math.random() * PIECES.length)];
    return { shape: piece.shape.map((row) => [...row]), color: piece.color };
}

// 그 자리에 놓을 수 있는지 — 좌우 벽/바닥/쌓인 블록과 충돌 검사
// (y가 음수인 칸은 아직 보드 위쪽이라 통과시킨다)
function canPlace(grid, piece, pos) {
    return piece.shape.every((row, y) =>
        row.every((cell, x) => {
            if (!cell) return true;

            const newY = pos.y + y;
            const newX = pos.x + x;

            if (newX < 0 || newX >= COLS || newY >= ROWS) return false;
            if (newY < 0) return true;

            return grid[newY][newX] === 0;
        })
    );
}

export default function Tetris() {
    const canvasRef = useRef(null);
    const rafRef = useRef(0);
    const toast = useToast();

    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [lines, setLines] = useState(0);
    const [status, setStatus] = useState('idle'); // idle | running | paused | over

    const game = useRef({
        grid: createGrid(),
        piece: null,
        pos: { x: 0, y: 0 },
        score: 0,
        lines: 0,
        level: 1,
        running: false,
        paused: false,
        dropCounter: 0,
        lastTime: 0,
    });

    // 보드 + 현재 조각 한 프레임 그리기
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const s = game.current;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 격자선
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= ROWS; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * BLOCK_SIZE);
            ctx.lineTo(canvas.width, i * BLOCK_SIZE);
            ctx.stroke();
        }
        for (let i = 0; i <= COLS; i++) {
            ctx.beginPath();
            ctx.moveTo(i * BLOCK_SIZE, 0);
            ctx.lineTo(i * BLOCK_SIZE, canvas.height);
            ctx.stroke();
        }

        const drawBlock = (x, y, color) => {
            ctx.fillStyle = color;
            ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
        };

        // 쌓인 블록
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (s.grid[row][col]) drawBlock(col, row, s.grid[row][col]);
            }
        }

        // 낙하 중인 조각
        if (s.piece) {
            s.piece.shape.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell) drawBlock(s.pos.x + x, s.pos.y + y, s.piece.color);
                });
            });
        }
    }, []);

    const spawnPiece = useCallback(() => {
        const s = game.current;
        s.piece = getRandomPiece();
        s.pos = { x: Math.floor(COLS / 2) - 1, y: 0 };

        // 새 조각이 들어갈 자리가 없으면 게임 오버
        if (!canPlace(s.grid, s.piece, s.pos)) {
            s.running = false;
            setStatus('over');
            toast(`게임 오버! 점수 ${s.score} · 라인 ${s.lines}`);
        }
    }, [toast]);

    const clearLines = useCallback(() => {
        const s = game.current;
        let clearedLines = 0;

        for (let row = ROWS - 1; row >= 0; row--) {
            if (s.grid[row].every((cell) => cell !== 0)) {
                s.grid.splice(row, 1);
                s.grid.unshift(Array.from({ length: COLS }, () => 0));
                clearedLines++;
                row++; // 윗줄이 내려왔으니 같은 행을 한 번 더 검사
            }
        }

        if (clearedLines > 0) {
            s.lines += clearedLines;
            s.score += clearedLines * 100 * s.level;
            s.level = Math.floor(s.lines / 10) + 1;
            setScore(s.score);
            setLines(s.lines);
            setLevel(s.level);
        }
    }, []);

    const placePiece = useCallback(() => {
        const s = game.current;
        s.piece.shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    const newY = s.pos.y + y;
                    const newX = s.pos.x + x;
                    if (newY >= 0) s.grid[newY][newX] = s.piece.color;
                }
            });
        });

        clearLines();
        spawnPiece();
    }, [clearLines, spawnPiece]);

    const moveDown = useCallback(() => {
        const s = game.current;
        if (canPlace(s.grid, s.piece, { x: s.pos.x, y: s.pos.y + 1 })) s.pos.y++;
        else placePiece();
    }, [placePiece]);

    // 렌더링은 매 프레임, 낙하는 시간 기반으로 분리 (입력 즉각 반응)
    const update = useCallback(
        (time = 0) => {
            const s = game.current;
            if (!s.running) return;
            if (!s.lastTime) s.lastTime = time;

            if (s.paused) {
                s.lastTime = time;
                rafRef.current = requestAnimationFrame(update);
                return;
            }

            const delta = time - s.lastTime;
            s.lastTime = time;
            s.dropCounter += delta;

            const dropInterval = Math.max(80, 500 - (s.level - 1) * 50);
            if (s.dropCounter >= dropInterval) {
                moveDown();
                s.dropCounter = 0;
            }

            render();
            rafRef.current = requestAnimationFrame(update);
        },
        [moveDown, render]
    );

    const startGame = useCallback(() => {
        const s = game.current;
        s.grid = createGrid();
        s.score = 0;
        s.lines = 0;
        s.level = 1;
        s.running = true;
        s.paused = false;
        s.dropCounter = 0;
        s.lastTime = 0;
        setScore(0);
        setLines(0);
        setLevel(1);
        setStatus('running');
        spawnPiece();

        cancelAnimationFrame(rafRef.current); // 이전 루프가 남아 이중으로 도는 것 방지
        rafRef.current = requestAnimationFrame(update);
    }, [spawnPiece, update]);

    const togglePause = useCallback(() => {
        const s = game.current;
        if (!s.running) {
            startGame();
            return;
        }
        s.paused = !s.paused;
        setStatus(s.paused ? 'paused' : 'running');
    }, [startGame]);

    // 조작 동작 — 키보드와 터치 버튼이 함께 쓴다
    const actLeft = useCallback(() => {
        const s = game.current;
        if (!s.running || s.paused) return;
        if (canPlace(s.grid, s.piece, { x: s.pos.x - 1, y: s.pos.y })) s.pos.x--;
    }, []);

    const actRight = useCallback(() => {
        const s = game.current;
        if (!s.running || s.paused) return;
        if (canPlace(s.grid, s.piece, { x: s.pos.x + 1, y: s.pos.y })) s.pos.x++;
    }, []);

    const actRotate = useCallback(() => {
        const s = game.current;
        if (!s.running || s.paused) return;
        // 열↔행을 뒤집어 시계방향 회전, 벽/블록에 걸리면 회전 취소
        const rotated = {
            ...s.piece,
            shape: s.piece.shape[0].map((_, i) => s.piece.shape.map((row) => row[i]).reverse()),
        };
        if (canPlace(s.grid, rotated, s.pos)) s.piece = rotated;
    }, []);

    const actDown = useCallback(() => {
        const s = game.current;
        if (!s.running || s.paused) return;
        moveDown();
        s.dropCounter = 0;
    }, [moveDown]);

    const actHardDrop = useCallback(() => {
        const s = game.current;
        if (!s.running || s.paused) return;
        while (canPlace(s.grid, s.piece, { x: s.pos.x, y: s.pos.y + 1 })) s.pos.y++;
        placePiece();
    }, [placePiece]);

    useEffect(() => {
        const onKeyDown = (e) => {
            if (!game.current.running) return;

            const key = e.key.toLowerCase();
            let handled = true;

            switch (key) {
                case 'arrowleft':
                    actLeft();
                    break;
                case 'arrowright':
                    actRight();
                    break;
                case 'arrowup':
                    actRotate();
                    break;
                case 'arrowdown':
                    actDown();
                    break;
                case ' ':
                    actHardDrop();
                    break;
                case 'p':
                    togglePause();
                    break;
                default:
                    handled = false;
            }

            if (handled) e.preventDefault(); // 방향키·스페이스의 페이지 스크롤 차단
        };

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [actLeft, actRight, actRotate, actDown, actHardDrop, togglePause]);

    // 첫 진입 시 빈 보드 한 번 그려두기
    useEffect(() => {
        render();
    }, [render]);

    // 페이지를 떠나면 루프 정지 (rAF가 남으면 백그라운드에서 계속 돈다)
    useEffect(
        () => () => {
            game.current.running = false;
            cancelAnimationFrame(rafRef.current);
        },
        []
    );

    const startLabel = {
        idle: '🎮 게임 시작',
        running: '⏸️ 일시정지',
        paused: '▶️ 계속',
        over: '🎮 게임 오버! 다시 시작',
    }[status];

    return (
        <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">🧩 테트리스 미니게임</h2>
            <p className="text-gray-300 text-base sm:text-lg mb-6">클래식 테트리스를 즐겨보세요!</p>

            {/* 게임 영역: 캔버스를 정중앙, 정보는 우측(데스크톱)/아래(모바일) */}
            <div className="flex flex-col items-center gap-4 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-start sm:gap-6 mb-6">
                {/* 좌측 균형용 빈 칸 (데스크톱에서 캔버스를 정중앙에 두기 위함) */}
                <div className="hidden sm:block"></div>

                {/* 캔버스 (가운데) */}
                <div className="flex justify-center">
                    <canvas
                        ref={canvasRef}
                        width="300"
                        height="600"
                        className="border-4 border-yellow-400 bg-black max-w-full"
                    ></canvas>
                </div>

                {/* 우측 사이드바: 점수/레벨/라인 + 조작법 (모바일: 게임 아래) */}
                <div className="flex flex-col gap-3 w-full sm:gap-4 sm:w-56 sm:justify-self-start sm:self-stretch">
                    {/* 통계 (모바일: 가로 / 데스크톱: 세로) */}
                    <div className="flex flex-row sm:flex-col gap-3 sm:gap-4">
                        <div className="bg-gray-900 rounded p-4 flex-1">
                            <p className="text-gray-400 text-sm">점수</p>
                            <p className="text-2xl font-bold text-yellow-400">{score}</p>
                        </div>
                        <div className="bg-gray-900 rounded p-4 flex-1">
                            <p className="text-gray-400 text-sm">레벨</p>
                            <p className="text-2xl font-bold text-cyan-400">{level}</p>
                        </div>
                        <div className="bg-gray-900 rounded p-4 flex-1">
                            <p className="text-gray-400 text-sm">라인</p>
                            <p className="text-2xl font-bold text-red-400">{lines}</p>
                        </div>
                    </div>
                    {/* 조작법 (데스크톱에선 캔버스 밑단에 맞춰 하단 정렬) */}
                    <div className="bg-gray-900 rounded p-4 text-left sm:mt-auto">
                        <p className="text-white font-bold mb-2">🎮 조작법</p>
                        <ul className="text-gray-300 text-sm space-y-1">
                            <li><span className="lg:hidden">버튼 또는 </span>방향키 ⬅️ ➡️: 좌우 이동</li>
                            <li>⬆️ (또는 🔄): 회전</li>
                            <li>⬇️: 빠르게 내려오기</li>
                            <li><span className="lg:hidden">⏬ 버튼 / </span>스페이스: 한 번에 내리기</li>
                            <li>P: 일시정지</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* 모바일/태블릿 터치 조작 패드 */}
            <div className="lg:hidden max-w-xs mx-auto mb-6 select-none">
                <div className="grid grid-cols-3 gap-2 mb-2">
                    <div></div>
                    <button
                        type="button"
                        onClick={actRotate}
                        className="touch-manipulation py-4 bg-gray-800 text-white text-2xl rounded-lg active:bg-gray-600"
                        aria-label="회전"
                    >
                        🔄
                    </button>
                    <div></div>
                    <button
                        type="button"
                        onClick={actLeft}
                        className="touch-manipulation py-4 bg-gray-800 text-white text-2xl rounded-lg active:bg-gray-600"
                        aria-label="왼쪽 이동"
                    >
                        ⬅️
                    </button>
                    <button
                        type="button"
                        onClick={actDown}
                        className="touch-manipulation py-4 bg-gray-800 text-white text-2xl rounded-lg active:bg-gray-600"
                        aria-label="아래로 이동"
                    >
                        ⬇️
                    </button>
                    <button
                        type="button"
                        onClick={actRight}
                        className="touch-manipulation py-4 bg-gray-800 text-white text-2xl rounded-lg active:bg-gray-600"
                        aria-label="오른쪽 이동"
                    >
                        ➡️
                    </button>
                </div>
                <button
                    type="button"
                    onClick={actHardDrop}
                    className="touch-manipulation w-full py-3 bg-yellow-500 text-black font-bold rounded-lg active:bg-yellow-400"
                    aria-label="한 번에 내리기"
                >
                    ⏬ 한 번에 내리기
                </button>
            </div>

            <button
                type="button"
                onClick={togglePause}
                className="px-6 py-3 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition font-bold min-h-[44px]"
            >
                {startLabel}
            </button>
        </div>
    );
}
