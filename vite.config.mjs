import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ============================================================
//  Vite 설정
//  - 빌드 결과물은 dist/ (Vercel의 Output Directory로 지정)
//  - 개발 중 /api 요청은 로컬 API 서버(scripts/dev-api.js, 3001)로 프록시.
//    덕분에 프론트 코드는 배포/로컬 구분 없이 항상 '/api/...'만 호출하면 된다
//  ※ 확장자가 .mjs인 이유: api/ 와 scripts/ 가 CommonJS라서
//    package.json에 "type": "module"을 넣을 수 없음
// ============================================================
const apiProxy = { '/api': 'http://localhost:3001' };

export default defineConfig({
    plugins: [react()],
    server: {
        port: 8081,
        proxy: apiProxy,
    },
    // npm run preview — 빌드 결과물을 배포 전에 로컬에서 확인할 때도 API가 붙어야 한다
    preview: {
        port: 4173,
        proxy: apiProxy,
    },
});
