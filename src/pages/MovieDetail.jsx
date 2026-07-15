// ============================================================
//  영화 상세 (/movie/:id)
//  관람등급 · 대여/시청 · 어디서 볼 수 있나 · 줄거리/키워드 · 예고편 ·
//  출연진(인물 링크) · 추천작 · 비슷한 영화 · 리뷰 · 스틸컷
// ============================================================
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TMDBApi } from '../lib/tmdb';
import { t } from '../lib/i18n';
import { certKR, certLabel, img, pickYouTubeKey, profileImg, rating, runtimeText, year } from '../lib/format';
import { hasFavorite, toggleFavorite } from '../lib/favorites';
import { addRecent } from '../lib/recent';
import { useAsync, useBodyTheme, useDocumentTitle, useDragScroll, useFavorites } from '../hooks';
import { useToast } from '../components/ToastProvider';
import Header from '../components/Header';
import MediaCard from '../components/MediaCard';
import { RowShell } from '../components/Row';
import TrailerBlock from '../components/TrailerBlock';
import RentButton from '../components/RentButton';

// ---------- 어디서 볼 수 있나 (KR 기준) ----------
function ProviderGroup({ label, items }) {
    // 같은 서비스가 여러 번 오는 경우가 있어 provider_id로 중복 제거
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

function Providers({ providers }) {
    const kr = providers?.results?.KR;
    if (!kr) return null;
    const hasAny = [kr.flatrate, kr.rent, kr.buy].some((a) => a?.length);
    if (!hasAny) return null;

    return (
        <section className="mb-8 bg-white rounded-xl shadow p-5">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
                📺 {t('sec_providers')} <span className="text-xs font-normal text-gray-400">({t('region_kr')})</span>
            </h3>
            <ProviderGroup label={'🔵 ' + t('prov_stream')} items={kr.flatrate} />
            <ProviderGroup label={'💰 ' + t('prov_rent')} items={kr.rent} />
            <ProviderGroup label={'🛒 ' + t('prov_buy')} items={kr.buy} />
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

// ---------- 리뷰 (긴 글은 접기) ----------
function Review({ review }) {
    const long = (review.content || '').length > 320;
    const [expanded, setExpanded] = useState(false);
    const score = review.author_details?.rating;

    return (
        <div className="bg-white rounded-xl shadow p-5">
            <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-800">{review.author}</span>
                {score && (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">
                        ⭐ {score}
                    </span>
                )}
            </div>
            <p className={`text-gray-600 text-sm leading-relaxed ${long && !expanded ? 'clamped-5' : ''}`}>
                {review.content}
            </p>
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

function Reviews({ reviews }) {
    const list = (reviews?.results || []).slice(0, 3);
    if (!list.length) return null;
    return (
        <section className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-3">📝 {t('sec_reviews')}</h3>
            <div className="space-y-4">
                {list.map((r) => (
                    <Review key={r.id} review={r} />
                ))}
            </div>
        </section>
    );
}

// ---------- 스틸컷 ----------
function Stills({ images }) {
    const stills = (images?.backdrops || []).slice(0, 10);
    const ref = useDragScroll();
    if (!stills.length) return null;
    return (
        <section className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-3">🖼 {t('sec_stills')}</h3>
            <div ref={ref} className="flex gap-3 overflow-x-auto pb-2 row-scroll">
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
            </div>
        </section>
    );
}

// ---------- 출연진 ----------
function Cast({ credits }) {
    const cast = (credits?.cast || []).slice(0, 20);
    const ref = useDragScroll();
    if (!cast.length) return null;
    return (
        <section className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
                🎭 {t('sec_cast')} <span className="text-xs font-normal text-gray-400">({t('cast_hint')})</span>
            </h3>
            <div ref={ref} className="flex gap-4 overflow-x-auto pb-2 row-scroll">
                {cast.map((p) => (
                    <Link key={p.credit_id || p.id} to={`/person/${p.id}`} className="shrink-0 w-24 text-center group">
                        <img
                            src={profileImg(p.profile_path, 'w185')}
                            alt={p.name}
                            loading="lazy"
                            className="w-24 h-24 rounded-full object-cover mx-auto shadow group-hover:ring-2 group-hover:ring-indigo-400 transition"
                        />
                        <p className="text-sm font-semibold text-gray-800 mt-2 leading-tight group-hover:text-indigo-600">
                            {p.name}
                        </p>
                        <p className="text-xs text-gray-500 leading-tight">{p.character || ''}</p>
                    </Link>
                ))}
            </div>
        </section>
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

export default function MovieDetail() {
    useBodyTheme('cinema');
    const { id } = useParams();
    const valid = /^\d+$/.test(id || '');

    useFavorites(); // 찜 상태 구독
    const toast = useToast();

    const { data: movie, loading, error } = useAsync(async () => {
        if (!valid) return null;
        const m = await TMDBApi.detail(id);
        // ko-KR 리뷰는 대부분 비어있어 en-US로 한 번 더 시도
        if (!m.reviews?.results?.length) {
            try {
                m.reviews = await TMDBApi.reviews(id);
            } catch {
                /* 리뷰는 없어도 페이지는 보여야 하므로 무시 */
            }
        }
        return m;
    }, [id]);

    useDocumentTitle(movie ? `${movie.title} · Coding Sister` : null);

    // 최근 본 작품에 기록
    useEffect(() => {
        if (movie) addRecent(movie, 'movie');
    }, [movie]);

    let body;
    if (!valid) body = <ErrorView message={t('err_bad')} />;
    else if (loading) body = <div className="text-center py-20 text-gray-400 animate-pulse">{t('loading')}</div>;
    else if (error || !movie) body = <ErrorView message={t('err_load_movie')} />;
    else {
        const genres = (movie.genres || []).map((g) => g.name);
        const trailerKey = pickYouTubeKey(movie.videos);
        const badge = certLabel(certKR(movie.release_dates));
        const keywords = (movie.keywords?.keywords || []).slice(0, 12);
        const recommendations = (movie.recommendations?.results || []).filter((m) => m.poster_path).slice(0, 15);
        const similar = (movie.similar?.results || []).filter((m) => m.poster_path).slice(0, 15);
        const faved = hasFavorite(movie.id, 'movie');

        const onFav = () => {
            const added = toggleFavorite(movie, 'movie');
            toast(added ? t('toast_added') : t('toast_removed'));
        };

        body = (
            <>
                {/* 헤드 (백드롭 + 포스터 + 메타) */}
                <div className="relative rounded-2xl overflow-hidden mb-8 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                        {movie.backdrop_path && (
                            <img src={img(movie.backdrop_path, 'w1280')} alt="" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1015] via-[#0f1015]/85 to-[#0f1015]/25" />
                    </div>
                    <div className="relative flex flex-col sm:flex-row gap-6 p-6 sm:p-8">
                        <img
                            src={img(movie.poster_path)}
                            alt={movie.title}
                            className="w-40 sm:w-56 rounded-xl shadow-lg shrink-0 mx-auto sm:mx-0"
                        />
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900">
                                {movie.title}{' '}
                                <span className="text-gray-400 font-medium text-xl">{year(movie.release_date)}</span>
                            </h2>
                            {movie.original_title && movie.original_title !== movie.title && (
                                <p className="text-gray-400 text-sm mt-1">{movie.original_title}</p>
                            )}
                            {movie.tagline && (
                                <p className="text-indigo-600 font-semibold mt-1 italic">{movie.tagline}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 mt-4 text-sm">
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-bold">
                                    ⭐ {rating(movie.vote_average)}
                                </span>
                                {badge && <span className={`px-3 py-1 ${badge.cls} rounded-full font-bold`}>{badge.text}</span>}
                                {movie.runtime > 0 && (
                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                                        ⏱ {runtimeText(movie.runtime)}
                                    </span>
                                )}
                                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                                    🗳 {t('votes', { n: (movie.vote_count || 0).toLocaleString() })}
                                </span>
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

                            <div className="flex flex-wrap items-center gap-2 mt-5">
                                <RentButton movie={movie} />
                                <button
                                    type="button"
                                    onClick={onFav}
                                    className={`inline-flex items-center gap-2 px-5 py-3 rounded-lg font-bold min-h-[44px] transition ${
                                        faved
                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                            : 'bg-white text-gray-800 border-2 border-gray-300 hover:border-red-400'
                                    }`}
                                >
                                    <span>{faved ? '❤️' : '🤍'}</span>
                                    <span>{faved ? t('fav_done') : t('fav_do')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <Providers providers={movie['watch/providers']} />

                {movie.overview && (
                    <section className="mb-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">📖 {t('sec_overview')}</h3>
                        <p className="text-gray-700 leading-relaxed">{movie.overview}</p>
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

                <Cast credits={movie.credits} />

                {recommendations.length > 0 && (
                    <RowShell title={'👍 ' + t('sec_rec_movie')}>
                        {recommendations.map((m) => (
                            <MediaCard key={m.id} item={m} />
                        ))}
                    </RowShell>
                )}
                {similar.length > 0 && (
                    <RowShell title={'🎞 ' + t('sec_sim_movie')}>
                        {similar.map((m) => (
                            <MediaCard key={m.id} item={m} />
                        ))}
                    </RowShell>
                )}

                <Reviews reviews={movie.reviews} />
                <Stills images={movie.images} />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{body}</main>
        </>
    );
}
