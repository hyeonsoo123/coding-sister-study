// ============================================================
//  로컬 개발용 API 서버
//  - Vercel 서버리스 함수(api/*.js)를 로컬(3000 포트)에서 그대로 실행한다
//  - 배포 환경에서는 Vercel이 이 역할을 대신하므로 이 파일은 로컬 전용
//  - 실행: npm run api
// ============================================================
const http = require('http');
const path = require('path');

const PORT = 3001;

// /api/purchases → api/purchases.js 처럼 경로를 파일로 매핑
function resolveHandler(pathname) {
    const name = pathname.replace(/^\/api\//, '').replace(/\/$/, '');
    if (!name || name.startsWith('_') || !/^[\w-]+$/.test(name)) return null;
    try {
        return require(path.join(__dirname, '..', 'api', name + '.js'));
    } catch {
        return null;
    }
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    // Vercel이 해주는 req.query / req.body 파싱을 로컬에서 흉내낸다
    req.query = Object.fromEntries(url.searchParams);
    if (req.method === 'POST' || req.method === 'PUT') {
        const chunks = [];
        for await (const c of req) chunks.push(c);
        const raw = Buffer.concat(chunks).toString();
        try {
            req.body = raw ? JSON.parse(raw) : {};
        } catch {
            req.body = {};
        }
    }

    // res.status().json() / res.status().end() 셋업
    res.status = (code) => ((res.statusCode = code), res);
    res.json = (obj) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(obj));
    };

    const handler = resolveHandler(url.pathname);
    if (!handler) {
        res.status(404).json({ error: 'Not Found: ' + url.pathname });
        return;
    }
    try {
        await handler(req, res);
    } catch (err) {
        console.error(err);
        if (!res.writableEnded) res.status(500).json({ error: err.message });
    }
});

server.listen(PORT, () => {
    console.log(`✅ 로컬 API 서버: http://localhost:${PORT}/api/purchases`);
});
