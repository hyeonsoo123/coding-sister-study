// ============================================================
//  /tv/:id — TV 시리즈 상세
//  방영등급 · 시즌/화수 · 제공처 · 줄거리/키워드 · 예고편 ·
//  출연진(인물 링크) · 추천/비슷한 시리즈 · 리뷰 · 스틸컷
// ============================================================
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import { RowShell, StaticRow } from '../components/Row';
import TrailerBlock from '../components/TrailerBlock';
import { useToast } from '../components/ToastProvider';
import { useAsync, useBodyTheme, useDocumentTitle, useFavorites } from '../hooks';
import { t } from '../lib/i18n';
import { TMDBApi } from '../lib/tmdb';
import { certLabel, img, pickYouTubeKey, profileImg, rating, runtimeText, year } from '../lib/format';
import { hasFavorite, toggleFavorite } from '../lib/favorites';
import { addRecent } from '../lib/recent';

// TMDB 방영 상태 → i18n 키
const STATUS_KEY = {
    'Returning Series': 'st_returning',
    Ended: 'st_ended',
    Canceled: 'st_canceled',
    'In Production': 'st_production',
    Planned: 'st_planned',
    Pilot: 'st_pilot',
};

// ko-KR 리뷰는 대부분 비어 있어 en-US로 한 번 더 시도한다
async function loadTv(id) {
    const show = await TMDBApi.tvDetail(id);
    if (!show.reviews?.results?.length) {
        try {
            show.reviews = await TMDBApi.tvReviews(id);
        } catch {
            /* 리뷰 실패는 무시 */
        }
    }
    return show;
}

// 페이지 껍데기 (헤더 + 본문 + 푸터) — 로딩/에러/본문이 모두 공유
function Shell({ children }) {
    return (
        <>
            <Header />
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
            <footer className="text-center text-gray-400 text-sm py-8">
                {t('footer_data')}{' '}
                <a
                    href="https://www.themoviedb.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-indigo-500"
                >
                    TMDB
                </a>
            </footer>
        </>
    );
}

function ErrorView({ message }) {
    return (
        <div className="text-center py-20">
            <div className="text-6xl mb-4">😵</div>
            <p className="text-lg font-bold text-gray-700">{message}</p>
            <Link to="/" className="inline-block mt-5 px-5 py-3 bg-indigo-600 text-white rounded-lg font-semibold">
                ← {t('home_btn')}
            </Link>
        </div>
    );
}

// 찜 버튼 — 다른 화면에서 토글해도 함께 갱신되도록 스토어를 구독한다
function FavButton({ show }) {
    useFavorites();
    const toast = useToast();
    const isFav = hasFavorite(show.id, 'tv');

    const onClick = () => {
        const added = toggleFavorite(show, 'tv');
        toast(added ? t('toast_added') : t('toast_removed'));
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-lg font-bold min-h-[44px] transition
                       ${isFav ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-gray-800 border-2 border-gray-300 hover:border-red-400'}`}
        >
            <span>{isFav ? '❤️' : '🤍'}</span>
            <span>{isFav ? t('fav_done') : t('fav_do')}</span>
        </button>
    );
}

function Hero({ show }) {
    const genres = (show.genres || []).map((g) => g.name);
    // episode_run_time은 배열로 오는 경우가 대부분이라 첫 값만 쓴다
    const runtime = Array.isArray(show.episode_run_time) ? show.episode_run_time[0] : show.episode_run_time;
    const networks = (show.networks || []).map((n) => n.name).filter(Boolean);
    const creators = (show.created_by || []).map((c) => c.name).filter(Boolean);
    const statusLabel = STATUS_KEY[show.status] ? t(STATUS_KEY[show.status]) : show.status;
    const krCert = (show.content_ratings?.results || []).find((r) => r.iso_3166_1 === 'KR');
    const badge = certLabel(krCert?.rating);

    return (
        <div className="relative rounded-2xl overflow-hidden mb-8 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                {show.backdrop_path && (
                    <img src={img(show.backdrop_path, 'w1280')} alt="" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1015] via-[#0f1015]/85 to-[#0f1015]/25" />
            </div>
            <div className="relative flex flex-col sm:flex-row gap-6 p-6 sm:p-8">
                <img
                    src={img(show.poster_path)}
                    alt={show.name}
                    className="w-40 sm:w-56 rounded-xl shadow-lg shrink-0 mx-auto sm:mx-0"
                />
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl sm:text-4xl font-bold text-gray-900">
                        {show.name}{' '}
                        <span className="text-gray-400 font-medium text-xl">{year(show.first_air_date)}</span>
                        <span className="align-middle ml-1 px-2 py-0.5 bg-indigo-600 text-white text-xs font-extrabold rounded">
                            TV
                        </span>
                    </h2>
                    {show.original_name && show.original_name !== show.name && (
                        <p className="text-gray-400 text-sm mt-1">{show.original_name}</p>
                    )}
                    {show.tagline && <p className="text-indigo-600 font-semibold mt-1 italic">{show.tagline}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-4 text-sm">
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-bold">
                            ⭐ {rating(show.vote_average)}
                        </span>
                        {badge && <span className={`px-3 py-1 ${badge.cls} rounded-full font-bold`}>{badge.text}</span>}
                        {show.number_of_seasons ? (
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                                📚 {t('seasons', { s: show.number_of_seasons, e: show.number_of_episodes || '?' })}
                            </span>
                        ) : null}
                        {runtime ? (
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                                ⏱ {t('per_ep', { t: runtimeText(runtime) })}
                            </span>
                        ) : null}
                        {statusLabel && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">{statusLabel}</span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                        {genres.map((g) => (
                            <span
                                key={g}
                                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold"
                            >
                                {g}
                            </span>
                        ))}
                    </div>
                    {networks.length > 0 && (
                        <p className="text-sm text-gray-500 mt-3">
                            📡 {t('ch_label')}: {networks.join(', ')}
                        </p>
                    )}
                    {creators.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                            ✍️ {t('creator_label')}: {creators.join(', ')}
                        </p>
                    )}
                    <FavButton show={show} />
                </div>
            </div>
        </div>
    );
}

// 제공처 한 그룹(스트리밍/대여/구매) — provider_id 중복 제거
function ProviderGroup({ label, items }) {
    const seen = new Set();
    const list = (items || []).filter((p) => (seen.has(p.provider_id) ? false : seen.add(p.provider_id)));
    if (!list.length) return null;

    return (
        <div className="mb-3">
            <p className="text-sm text-gray-500 mb-2">{label}</p>
            <div className="flex flex-wrap gap-3">
                {list.map((p) => (
                    <div key={p.provider_id} className="flex flex-col items-center w-16 text-center">
                        <img
                            src={img(p.logo_path, 'w92')}
                            alt={p.provider_name}
                            title={p.provider_name}
                            className="w-12 h-12 rounded-xl object-cover shadow"
                        />
                        <span className="text-[11px] text-gray-500 mt-1 leading-tight">{p.provider_name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Providers({ show }) {
    const kr = show['watch/providers']?.results?.KR;
    if (!kr) return null;
    // 세 그룹이 모두 비면 섹션 자체를 숨긴다
    if (!kr.flatrate?.length && !kr.rent?.length && !kr.buy?.length) return null;

    return (
        <section className="mb-8 bg-white rounded-xl shadow p-5">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
                📺 {t('sec_providers')} <span className="text-xs font-normal text-gray-400">({t('region_kr')})</span>
            </h3>
            <ProviderGroup label={`🔵 ${t('prov_stream')}`} items={kr.flatrate} />
            <ProviderGroup label={`💰 ${t('prov_rent')}`} items={kr.rent} />
            <ProviderGroup label={`🛒 ${t('prov_buy')}`} items={kr.buy} />
            {kr.link && (
                <a
                    href={kr.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-1 text-sm text-indigo-600 hover:underline"
                >
                    {t('prov_justwatch')}
                </a>
            )}
        </section>
    );
}

function CastRow({ cast }) {
    if (!cast.length) return null;

    return (
        <RowShell
            title={
                <>
                    🎭 {t('sec_cast')} <span className="text-xs font-normal text-gray-400">({t('cast_hint')})</span>
                </>
            }
        >
            {cast.map((p) => (
                <Link key={p.id} to={`/person/${p.id}`} className="shrink-0 w-24 text-center group">
                    <img
                        src={profileImg(p.profile_path, 'w185')}
                        alt={p.name}
                        loading="lazy"
                        className="w-24 h-24 rounded-full object-cover mx-auto shadow group-hover:ring-2 group-hover:ring-indigo-400 transition"
                    />
                    <p className="text-sm font-semibold text-gray-800 mt-2 leading-tight group-hover:text-indigo-600">
                        {p.name}
                    </p>
                    {/* aggregate_credits는 배역이 roles 배열로 온다 (credits의 character와 다름) */}
                    <p className="text-xs text-gray-500 leading-tight">{p.roles?.[0]?.character || ''}</p>
                </Link>
            ))}
        </RowShell>
    );
}

// 320자가 넘으면 접고 더보기 버튼을 붙인다
function ReviewCard({ review }) {
    const [expanded, setExpanded] = useState(false);
    const content = review.content || '';
    const long = content.length > 320;
    const score = review.author_details?.rating;

    return (
        <div className="bg-white rounded-xl shadow p-5">
            <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-800">{review.author}</span>
                {score ? (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">
                        ⭐ {score}
                    </span>
                ) : null}
            </div>
            <p className={`text-gray-600 text-sm leading-relaxed ${long && !expanded ? 'clamped-5' : ''}`}>{content}</p>
            {long && (
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="text-indigo-600 text-sm font-semibold mt-1"
                >
                    {expanded ? t('less_btn') : t('more_btn')}
                </button>
            )}
        </div>
    );
}

function Reviews({ show }) {
    const list = (show.reviews?.results || []).slice(0, 3);
    if (!list.length) return null;

    return (
        <section className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-3">📝 {t('sec_reviews')}</h3>
            <div className="space-y-4">
                {list.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                ))}
            </div>
        </section>
    );
}

function Stills({ show }) {
    const stills = (show.images?.backdrops || []).slice(0, 10);
    if (!stills.length) return null;

    return (
        <RowShell title={`🖼 ${t('sec_stills')}`}>
            {stills.map((s) => (
                <a
                    key={s.file_path}
                    href={img(s.file_path, 'original')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                >
                    <img
                        src={img(s.file_path, 'w500')}
                        alt="still"
                        loading="lazy"
                        className="h-40 rounded-lg object-cover shadow hover:opacity-90 transition"
                    />
                </a>
            ))}
        </RowShell>
    );
}

export default function TvDetail() {
    const { id } = useParams();
    const valid = /^\d+$/.test(id || '');

    useBodyTheme('cinema');

    const { data: show, loading, error } = useAsync(() => (valid ? loadTv(id) : Promise.resolve(null)), [id, valid]);

    useDocumentTitle(show ? `${show.name} · Coding Sister` : '시리즈 상세 · Coding Sister');

    // 최근 본 작품 기록
    useEffect(() => {
        if (show) addRecent(show, 'tv');
    }, [show]);

    if (!valid) {
        return (
            <Shell>
                <ErrorView message={t('err_bad')} />
            </Shell>
        );
    }
    if (loading) {
        return (
            <Shell>
                <div className="text-center py-20 text-gray-400 animate-pulse">{t('loading')}</div>
            </Shell>
        );
    }
    if (error || !show) {
        return (
            <Shell>
                <ErrorView message={`${t('err_load_tv')} (${error?.message})`} />
            </Shell>
        );
    }

    const trailerKey = pickYouTubeKey(show.videos);
    const cast = (show.aggregate_credits?.cast || []).slice(0, 20);
    const recommendations = (show.recommendations?.results || []).filter((m) => m.poster_path).slice(0, 15);
    const similar = (show.similar?.results || []).filter((m) => m.poster_path).slice(0, 15);
    const keywords = (show.keywords?.results || []).slice(0, 12);

    return (
        <Shell>
            <Hero show={show} />

            <Providers show={show} />

            {show.overview && (
                <section className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">📖 {t('sec_overview')}</h3>
                    <p className="text-gray-700 leading-relaxed">{show.overview}</p>
                    {keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {keywords.map((k) => (
                                <span
                                    key={k.id}
                                    className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-xs"
                                >
                                    # {k.name}
                                </span>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {trailerKey && (
                <section className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-3">▶️ {t('sec_trailer')}</h3>
                    <TrailerBlock youtubeKey={trailerKey} />
                </section>
            )}

            <CastRow cast={cast} />

            <StaticRow title={`👍 ${t('sec_rec_tv')}`} items={recommendations} />
            <StaticRow title={`🎞 ${t('sec_sim_tv')}`} items={similar} />

            <Reviews show={show} />
            <Stills show={show} />
        </Shell>
    );
}
