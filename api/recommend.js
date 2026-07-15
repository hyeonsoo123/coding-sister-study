// ============================================================
//  AI 맞춤 추천 API — Vercel 서버리스 함수
//  POST /api/recommend  { userId }
//  - 사용자의 대여(구매) 이력을 DB에서 꺼내 Gemini에게 전달
//  - 취향 분석 + 추천 영화 목록을 JSON으로 받아 그대로 반환
//  - 프론트는 받은 제목으로 TMDB를 검색해 포스터 카드로 렌더링
//  필요 환경변수: GEMINI_API_KEY (https://aistudio.google.com/apikey)
// ============================================================
const { connectDB, Purchase } = require('./_db');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function buildPrompt(titles) {
    return `당신은 영화 추천 전문가입니다.
아래는 한 사용자가 돈을 내고 대여한 영화 목록입니다. 이 사용자의 취향을 분석하고,
다음에 볼 영화 5편을 추천해주세요.

대여한 영화: ${titles.join(', ')}

규칙:
- 이미 대여한 영화는 추천하지 마세요.
- title은 반드시 한국 개봉명(TMDB에서 검색 가능한 제목)으로 쓰세요.
- reason은 이 사용자의 대여 이력과 연결지어 한 문장으로 쓰세요.
- taste는 사용자의 취향을 한 문장으로 요약하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{"taste": "...", "recommendations": [{"title": "...", "reason": "..."}]}`;
}

async function askGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: 'application/json', // JSON 출력 강제
                temperature: 0.9,
            },
        }),
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Gemini API ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini 응답이 비어있습니다');
    return JSON.parse(text);
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다' });
    }

    try {
        const { userId } = req.body || {};
        if (!userId) return res.status(400).json({ error: 'userId가 필요합니다' });

        await connectDB();
        const purchases = await Purchase.find({ userId }).sort({ createdAt: -1 }).limit(20).lean();

        // 대여 이력이 없으면 추천할 근거가 없음 — 프론트에서 섹션을 숨긴다
        if (!purchases.length) {
            return res.status(200).json({ basedOn: [], taste: null, recommendations: [] });
        }

        const titles = [...new Set(purchases.map((p) => p.title).filter(Boolean))];
        const result = await askGemini(buildPrompt(titles));

        return res.status(200).json({
            basedOn: titles,
            taste: result.taste || null,
            recommendations: (result.recommendations || []).slice(0, 5),
        });
    } catch (err) {
        console.error('[recommend]', err);
        return res.status(500).json({ error: 'AI 추천 생성에 실패했습니다' });
    }
};
