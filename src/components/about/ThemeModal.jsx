// ============================================================
//  테마 선택 모달 (구 js/themes.js의 setupThemeModal)
//  선택 표시는 현재 테마에서 파생 → 저장된 테마로 들어와도 항상 맞게 표시된다
//  (구버전은 마크업이 고정이라 새로고침하면 '기본'이 선택된 것처럼 보였다)
// ============================================================

const optionClass = (selected) =>
    `themeOption w-full p-4 rounded-lg border-2 transition text-left font-semibold ${
        selected
            ? 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
    }`;

export default function ThemeModal({ theme, onSelect, onClose }) {
    return (
        <div
            className="theme-modal fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            // 모달 바깥(오버레이 자신)을 클릭했을 때만 닫기
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">🎨 테마 선택</h3>

                <div className="space-y-3 mb-6">
                    <button
                        type="button"
                        onClick={() => onSelect('default')}
                        className={optionClass(theme === 'default')}
                    >
                        <span className="text-2xl mb-2">💙</span>
                        <p>기본 테마 (파란색)</p>
                        <p className="text-xs text-gray-600 font-normal">현재 테마</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => onSelect('mario')}
                        className={optionClass(theme === 'mario')}
                    >
                        <span className="inline-flex flex-col gap-0.5 mb-2">
                            <span className="flex gap-0.5">
                                <span className="w-3 h-3"></span>
                                <span className="w-3 h-3 bg-cyan-400 border border-black"></span>
                                <span className="w-3 h-3 bg-yellow-400 border border-black"></span>
                            </span>
                            <span className="flex gap-0.5">
                                <span className="w-3 h-3 bg-purple-500 border border-black"></span>
                                <span className="w-3 h-3 bg-green-500 border border-black"></span>
                                <span className="w-3 h-3"></span>
                            </span>
                        </span>
                        <p>테트리스 테마</p>
                        <p className="text-xs text-gray-600 font-normal">네온 아케이드 스타일</p>
                    </button>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold min-h-[44px]"
                >
                    닫기
                </button>
            </div>
        </div>
    );
}
