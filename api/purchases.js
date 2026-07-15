// ============================================================
//  구매(대여) API — Vercel 서버리스 함수
//  GET  /api/purchases?userId=...           → 내 구매 목록
//  GET  /api/purchases?userId=...&movieId=… → 특정 영화 구매 여부
//  GET  /api/purchases?orderId=...          → 주문 단건 조회 (주문완료 페이지)
//  GET  /api/purchases?scope=all            → 전체 주문 목록 (어드민)
//  POST /api/purchases                      → 결제(mock) 후 구매 기록 저장
// ============================================================
const { connectDB, Purchase } = require('./_db');

module.exports = async (req, res) => {
    // 로컬 개발: live-server(8081)에서 vercel dev(3000)로 호출할 수 있게 CORS 허용
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();

    try {
        await connectDB();

        if (req.method === 'GET') {
            const { userId, movieId, orderId, scope } = req.query;

            // 주문 단건 조회 (주문완료 페이지용)
            if (orderId) {
                if (!/^[a-f\d]{24}$/i.test(orderId)) return res.status(400).json({ error: '잘못된 주문번호입니다' });
                const item = await Purchase.findById(orderId).lean();
                if (!item) return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
                return res.status(200).json({ item });
            }

            // 전체 주문 목록 (어드민 — 데모 수준: 클라이언트 인증과 동일한 보안 레벨)
            if (scope === 'all') {
                const items = await Purchase.find({}).sort({ createdAt: -1 }).limit(500).lean();
                const revenue = items.reduce((sum, p) => sum + (p.price || 0), 0);
                return res.status(200).json({ items, total: items.length, revenue });
            }

            if (!userId) return res.status(400).json({ error: 'userId가 필요합니다' });
            const filter = { userId };
            if (movieId) filter.movieId = Number(movieId);
            const items = await Purchase.find(filter).sort({ createdAt: -1 }).lean();
            return res.status(200).json({ items });
        }

        if (req.method === 'POST') {
            const { userId, movieId, title, posterPath, price } = req.body || {};
            if (!userId || !movieId) {
                return res.status(400).json({ error: 'userId와 movieId가 필요합니다' });
            }
            // upsert: 이미 구매한 영화면 기존 기록을 그대로 돌려준다 (중복 결제 방지)
            const item = await Purchase.findOneAndUpdate(
                { userId, movieId: Number(movieId) },
                { $setOnInsert: { title, posterPath, price: price ?? 1200 } },
                { upsert: true, returnDocument: 'after' }
            ).lean();
            return res.status(201).json({ item });
        }

        return res.status(405).json({ error: 'Method Not Allowed' });
    } catch (err) {
        console.error('[purchases]', err);
        return res.status(500).json({ error: '서버 오류가 발생했습니다' });
    }
};
