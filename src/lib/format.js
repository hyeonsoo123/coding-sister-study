// ============================================================
//  표시용 포맷 헬퍼 (이미지 URL · 연도 · 평점 · 관람등급)
//  ※ 구 UI.escapeHtml 은 React가 자동 이스케이프하므로 불필요
// ============================================================
import { TMDB } from './tmdb';
import { t } from './i18n';

// 포스터가 없을 때 쓰는 회색 플레이스홀더 (SVG data URI)
export const POSTER_FALLBACK =
    'data:image/svg+xml;charset=utf8,' +
    encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750">
            <rect width="100%" height="100%" fill="#e5e7eb"/>
            <text x="50%" y="50%" font-size="120" text-anchor="middle" dominant-baseline="middle">🎬</text>
        </svg>`
    );

// 인물 프로필이 없을 때 쓰는 플레이스홀더 (👤)
export const PROFILE_FALLBACK =
    'data:image/svg+xml;charset=utf8,' +
    encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
            <rect width="100%" height="100%" fill="#e5e7eb"/>
            <text x="50%" y="52%" font-size="150" text-anchor="middle" dominant-baseline="middle">👤</text>
        </svg>`
    );

export function img(path, size = 'w500') {
    return path ? `${TMDB.IMG_URL}/${size}${path}` : POSTER_FALLBACK;
}

export function profileImg(path, size = 'w185') {
    return path ? `${TMDB.IMG_URL}/${size}${path}` : PROFILE_FALLBACK;
}

export function year(dateStr) {
    return dateStr ? dateStr.slice(0, 4) : t('tba');
}

export function rating(value) {
    return value ? Number(value).toFixed(1) : '–';
}

export function runtimeText(min) {
    if (!min) return '';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h ? `${h}${t('hour')} ${m}${t('min')}` : `${m}${t('min')}`;
}

// release_dates 응답에서 한국(KR) 관람등급 문자열 추출
export function certKR(releaseDates) {
    const kr = (releaseDates?.results || []).find((r) => r.iso_3166_1 === 'KR');
    if (!kr) return null;
    return (kr.release_dates || []).map((d) => d.certification).find((c) => c) || null;
}

// 관람등급 → 한글 라벨 + 색상 클래스
export function certLabel(cert) {
    if (!cert) return null;
    const c = String(cert).toUpperCase();
    if (c === 'ALL' || c === 'G') return { text: '전체', cls: 'bg-green-100 text-green-700' };
    if (c === '7') return { text: '7세', cls: 'bg-lime-100 text-lime-700' };
    if (c === '12') return { text: '12세', cls: 'bg-sky-100 text-sky-700' };
    if (c === '15') return { text: '15세', cls: 'bg-amber-100 text-amber-700' };
    if (c === '18' || c === '19' || c === 'R') return { text: '청불', cls: 'bg-red-100 text-red-700' };
    return { text: String(cert), cls: 'bg-gray-100 text-gray-700' };
}

// TMDB 영화/TV 객체 → 상세 페이지 경로
export function detailPath(item) {
    const type =
        item.media_type === 'tv' || item.media_type === 'movie'
            ? item.media_type
            : item.title
            ? 'movie'
            : 'tv';
    return type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`;
}

// videos 응답에서 재생할 유튜브 key 하나 고르기
export function pickYouTubeKey(videos) {
    const list = (videos?.results || []).filter((v) => v.site === 'YouTube');
    const v =
        list.find((x) => x.type === 'Trailer' && x.official) ||
        list.find((x) => x.type === 'Trailer') ||
        list.find((x) => x.type === 'Teaser') ||
        list[0];
    return v ? v.key : null;
}
