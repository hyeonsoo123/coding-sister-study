// ============================================================
//  TMDB API 호출 래퍼
//  - 모든 요청에 언어(i18n 선택값)를 붙이고 Bearer 토큰으로 인증
//  ⚠️ 이 토큰은 프론트 번들에 포함되어 공개됩니다.
//     읽기 전용(api_read)이라 조회만 가능하고 쓰기/삭제는 불가합니다.
//     (결제·AI 키처럼 민감한 값은 절대 여기 두지 말고 api/ 서버로)
// ============================================================
import { tmdbLang } from './i18n';

export const TMDB = {
    // v4 액세스 토큰 (Bearer 인증)
    ACCESS_TOKEN:
        'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlOTUwZmMwZWM0NjU1ZGRiZmM5MGI5OWVjMzJmYTMyNiIsIm5iZiI6MTc4Mjg3NzczMC4yNzksInN1YiI6IjZhNDQ4ZTIyYzRhMGYxMjViOGRmMGRkYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.0el8e3-qoPJDV9SDxSWyzH4wF9Xgqiuv5bU5AF9znuE',
    BASE_URL: 'https://api.themoviedb.org/3',
    IMG_URL: 'https://image.tmdb.org/t/p',
    REGION: 'KR',
};

const headers = {
    Authorization: `Bearer ${TMDB.ACCESS_TOKEN}`,
    accept: 'application/json',
};

export async function get(path, params = {}) {
    const url = new URL(`${TMDB.BASE_URL}${path}`);
    url.searchParams.set('language', tmdbLang());
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, value);
        }
    }

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`TMDB 요청 실패 (${res.status} ${res.statusText})`);
    return res.json();
}

// 상세 1회 호출에 붙일 수 있는 부가 정보 (append_to_response)
const DETAIL_APPEND =
    'videos,credits,similar,recommendations,reviews,release_dates,watch/providers,images,keywords';

export const TMDBApi = {
    get,

    // ----- 목록/둘러보기 -----
    popular: (page = 1) => get('/movie/popular', { page }),
    nowPlaying: (page = 1) => get('/movie/now_playing', { page, region: TMDB.REGION }),
    upcoming: (page = 1) => get('/movie/upcoming', { page, region: TMDB.REGION }),
    topRated: (page = 1) => get('/movie/top_rated', { page }),
    trending: (window = 'week') => get(`/trending/movie/${window}`),

    // ----- 장르/탐색 -----
    genres: () => get('/genre/movie/list'),
    discover: (params = {}) =>
        get('/discover/movie', { sort_by: 'popularity.desc', include_adult: false, ...params }),
    byGenre: (genreId, page = 1) =>
        get('/discover/movie', { with_genres: genreId, sort_by: 'popularity.desc', page }),

    // ----- 검색 -----
    search: (query, page = 1) => get('/search/movie', { query, page, include_adult: false }),
    searchMulti: (query, page = 1) => get('/search/multi', { query, page, include_adult: false }),

    // ----- 상세 -----
    detail: (id) =>
        get(`/movie/${id}`, {
            append_to_response: DETAIL_APPEND,
            include_image_language: 'ko,en,null',
        }),
    // 리뷰: ko-KR은 대부분 비어있어 en-US로 별도 조회
    reviews: (id, page = 1) => get(`/movie/${id}/reviews`, { page, language: 'en-US' }),
    movieVideos: (id) => get(`/movie/${id}/videos`),

    // ----- TV / 시리즈 -----
    tvPopular: (page = 1) => get('/tv/popular', { page }),
    tvOnTheAir: (page = 1) => get('/tv/on_the_air', { page }),
    tvTopRated: (page = 1) => get('/tv/top_rated', { page }),
    tvTrending: (window = 'week') => get(`/trending/tv/${window}`),
    tvGenres: () => get('/genre/tv/list'),
    tvByGenre: (genreId, page = 1) =>
        get('/discover/tv', { with_genres: genreId, sort_by: 'popularity.desc', page }),
    tvDetail: (id) =>
        get(`/tv/${id}`, {
            append_to_response:
                'videos,aggregate_credits,similar,recommendations,reviews,content_ratings,watch/providers,images,keywords',
            include_image_language: 'ko,en,null',
        }),
    tvReviews: (id, page = 1) => get(`/tv/${id}/reviews`, { page, language: 'en-US' }),

    // 추천작 (찜 기반 개인화 줄용) — movie/tv 겸용
    recommendations: (mediaType, id) =>
        get(`/${mediaType === 'tv' ? 'tv' : 'movie'}/${id}/recommendations`),

    // ----- 인물 -----
    person: (id) => get(`/person/${id}`, { append_to_response: 'combined_credits,images' }),
};
