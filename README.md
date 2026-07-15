# 🎬 Coding Sister — 영화 OTT + 포트폴리오

임현수의 학습·포트폴리오 프로젝트. **React(Vite) SPA + Vercel 서버리스 API + MongoDB Atlas**로 구성된
OTT 스타일 영화 사이트입니다. TMDB로 영화를 둘러보고, 대여 결제를 하고,
대여 이력을 바탕으로 **AI(Gemini)가 맞춤 추천**을 해줍니다.

## 📄 페이지 구성

| 경로 | 설명 |
| --- | --- |
| `/` | 영화 홈 — 히어로 배너, AI 맞춤 추천, 인기/상영중/장르별 슬라이드, 시리즈·탐색·내 찜 탭 |
| `/movie/:id` | 영화 상세 — 예고편·출연진·리뷰·스틸컷 + **대여 결제** |
| `/tv/:id` | 시리즈 상세 |
| `/person/:id` | 인물 상세 (필모그래피) |
| `/order-complete/:orderId` | 주문 완료 (영수증 + 바로 시청) |
| `/my-page` | 마이페이지 — 내 대여 목록 + 할 일(TODO) 탭 |
| `/todo` | 캘린더 기반 TODO 앱 |
| `/about` | 포트폴리오 (테트리스 미니게임 테마 포함) |
| `/admin/login` · `/admin/products` · `/admin/orders` | 관리자 — 로그인 / 상품 관리 / 주문·매출 관리 |

## ✨ 주요 기능

- **🎟 영화 대여 결제** (데모 PG) — 결제 → 주문완료 → 시청. DB 유니크 인덱스로 **중복 결제 차단**
- **🤖 AI 맞춤 추천** — 대여 이력을 서버에서 Gemini에 전달해 취향 분석 + 추천작 생성 → TMDB에서 포스터 매칭
- **🌐 다국어** — 한국어 / English / 日本語 (UI + TMDB 콘텐츠 언어 동시 전환)
- **❤️ 찜 · 🕘 최근 본 작품** — localStorage 기반 개인화 슬라이드
- **📅 TODO + 캘린더** — 우선순위·필터·완료 기록
- **🎮 테트리스** — Canvas API 미니게임 (포트폴리오 테마)

## 🔑 API 키를 프론트에 두지 않는 이유

`MONGODB_URI`와 `GEMINI_API_KEY`는 **서버(`api/`)에만** 존재합니다. 브라우저는 `/api/...`만 호출하고,
서버가 대신 Atlas·Gemini에 접근합니다. 프론트에 두면 개발자도구로 누구나 꺼내
DB를 조작하거나 AI 크레딧을 소진할 수 있기 때문입니다.

```
브라우저 ──→ TMDB API                 (읽기 전용 토큰, 공개돼도 조회만 가능)
브라우저 ──→ /api/* (Vercel 서버리스) ──→ MongoDB Atlas  (결제·주문)
                                     └──→ Gemini        (AI 추천)
```

## 📁 프로젝트 구조

```
coding-sister-study/
├── index.html              # Vite 진입점
├── vite.config.mjs         # 빌드 설정 + /api 프록시(로컬)
├── vercel.json             # 배포 설정 (SPA 리라이트)
├── api/                    # Vercel 서버리스 함수 (백엔드)
│   ├── _db.js              #   Atlas 연결 + 스키마
│   ├── purchases.js        #   결제 저장/조회, 주문 목록
│   └── recommend.js        #   Gemini AI 추천
├── scripts/dev-api.js      # 로컬에서 api/를 실행하는 개발 서버
└── src/
    ├── main.jsx            # 진입 + 라우터
    ├── App.jsx             # 라우팅 (구 .html URL 리다이렉트 포함)
    ├── lib/                # 순수 로직 (UI 없음)
    │   ├── tmdb.js         #   TMDB API 래퍼
    │   ├── i18n.js         #   다국어 사전
    │   ├── purchases.js    #   결제 API 클라이언트
    │   ├── favorites.js    #   찜 (구독 가능한 store)
    │   ├── recent.js       #   최근 본 작품
    │   ├── format.js       #   이미지/연도/평점/등급 포맷
    │   ├── adminAuth.js    #   관리자 인증 (데모)
    │   └── adminProducts.js#   상품 CRUD
    ├── hooks/              # useAsync · useFavorites · useDragScroll · useBodyTheme …
    ├── components/         # 공용 UI (MediaCard, Row, Hero, RentButton, Toast …)
    ├── pages/              # 라우트별 페이지
    └── styles/
        ├── index.css       #   전역 (Tailwind + 반응형)
        ├── cinema.css      #   영화 페이지 다크 테마 (body.theme-cinema로 스코프)
        └── about.css       #   포트폴리오 테마 (.about-page로 스코프)
```

> SPA는 CSS가 전역이라, 페이지별 테마는 반드시 래퍼 클래스로 스코프해야
> 다른 라우트로 새지 않습니다 (`cinema.css`, `about.css`).

## 🚀 로컬 실행

터미널 2개가 필요합니다 — 프론트(Vite)와 API 서버를 따로 띄웁니다.

```bash
npm install

npm run dev    # 프론트 → http://localhost:8081
npm run api    # API 서버 → http://localhost:3001 (Vite가 /api 요청을 여기로 프록시)
```

`.env` 파일에 아래 두 값이 필요합니다:

```
MONGODB_URI=mongodb+srv://...       # MongoDB Atlas 연결 문자열
GEMINI_API_KEY=...                  # https://aistudio.google.com/apikey (없으면 AI 추천만 숨겨짐)
```

빌드 결과물을 배포 전에 확인하려면:

```bash
npm run build && npm run preview     # → http://localhost:4173 (API 프록시 포함)
```

## ☁️ Vercel 배포

1. GitHub 저장소를 Vercel에 Import
2. **Output Directory**: `dist` (`vercel.json`에 명시돼 있어 자동 인식)
3. **Environment Variables**에 `MONGODB_URI`, `GEMINI_API_KEY` 등록 (`.env`는 커밋되지 않음)
4. MongoDB Atlas → **Network Access**에서 `0.0.0.0/0` 허용 (Vercel 서버가 접속해야 함)

`api/` 폴더는 Vercel이 자동으로 서버리스 함수로 인식합니다.

## 💻 기술 스택

- **React 19 + Vite + React Router 7** — SPA
- **Tailwind CSS 3** (PostCSS 빌드)
- **Vercel Serverless Functions** — 백엔드 (`api/`)
- **MongoDB Atlas + Mongoose** — 결제·주문 데이터
- **Google Gemini** — AI 맞춤 추천
- **TMDB API** — 영화·시리즈·인물 데이터

## 📝 참고

- 결제는 **데모**입니다. 실제 PG 연동이 없고 과금되지 않으며, 영상도 실제로 재생되지 않습니다.
- 관리자 인증은 localStorage 기반 **데모**입니다 (실서비스라면 서버 세션/JWT 필요).
- 찜·최근 본 작품·TODO는 브라우저 localStorage에 저장되어 캐시를 지우면 사라집니다.
- 대여 기록은 회원가입 없이 브라우저별 게스트 ID로 구분됩니다.

---

**버전**: 2.0.0 (React 전환)
