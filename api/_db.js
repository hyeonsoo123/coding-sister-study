// ============================================================
//  MongoDB Atlas 연결 (Vercel 서버리스용)
//  - 서버리스는 요청마다 함수가 새로 뜰 수 있어서, 연결을 전역에
//    캐시해두고 재사용해야 커넥션 폭주를 막을 수 있다
// ============================================================
const mongoose = require('mongoose');

// 윈도우 로컬 개발 시 mongodb+srv(SRV) DNS 조회가 통신사 DNS에서
// 실패하는 경우가 있어 공개 DNS로 우회한다. 배포(Vercel)에는 영향 없음.
if (process.platform === 'win32') {
    require('dns').setServers(['8.8.8.8', '1.1.1.1']);
}

let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

async function connectDB() {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 8000,
        });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

// 구매(대여) 기록 — userId는 회원가입 없이 쓰는 브라우저별 게스트 ID
const purchaseSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    movieId: { type: Number, required: true },
    title: String,
    posterPath: String,
    price: { type: Number, default: 1200 },
    createdAt: { type: Date, default: Date.now },
});
// 같은 사용자가 같은 영화를 중복 결제하지 못하게 막는다
purchaseSchema.index({ userId: 1, movieId: 1 }, { unique: true });

const Purchase = mongoose.models.Purchase || mongoose.model('Purchase', purchaseSchema);

module.exports = { connectDB, Purchase };
