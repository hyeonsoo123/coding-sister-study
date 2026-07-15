// ============================================================
//  영화 홈 (/)
//  - 홈: AI 추천 · 최근 본 · 찜 기반 추천 + 인기/상영중/장르별 가로 슬라이드
//  - 시리즈: TV 가로 슬라이드 (탭 처음 열 때 로드)
//  - 탐색: 전체 장르 + 정렬/평점/연도 필터 + 더보기
//  - 검색: 통합 검색(영화+TV) + 더보기
//  - 내 찜: localStorage 목록
// ============================================================
import { useCallback, useMemo, useRef, useState } from 'react';
import { TMDBApi } from '../lib/tmdb';
import { t } from '../lib/i18n';
import { getRecent } from '../lib/recent';
import { useAsync, useBodyTheme, useDocumentTitle, useFavorites, useInView } from '../hooks';
import { useToast } from '../components/ToastProvider';
import Header from '../components/Header';
import Hero from '../components/Hero';
import MediaCard from '../components/MediaCard';
import AiRecRow from '../components/AiRecRow';
import { LoadRow, StaticRow } from '../components/Row';
import { EmptyState, SkeletonGrid } from '../components/Skeleton';

const GRID = 'movie-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4';

// 포스터 있는 것만 (영화 홈/탐색)
const withPoster = (data) => (data.results || []).filter((m) => m.poster_path);
// 통합 검색: 영화/TV만 (인물 제외)
const searchable = (data) =>
    (data.results || []).filter(
        (m) => (m.media_type === 'movie' || m.media_type === 'tv') && m.poster_path
    );

// ---------- 페이지네이션 피드 (검색·탐색 공용) ----------
function useFeed(filter) {
    const [state, setState] = useState({
        items: [],
        page: 0,
        totalPages: 1,
        totalResults: 0,
        loading: false,
        error: null,
        started: false,
    });
    // 현재 살아있는 로더 — 필터를 바꾸면 이전 요청의 늦은 응답을 버리는 기준이 된다
    const loaderRef = useRef(null);
    // 중복 요청 방지·다음 페이지 계산은 ref로 (setState 업데이터는 순수해야 하고,
    // StrictMode에서 두 번 호출되므로 그 안에서 fetch를 걸면 안 됨)
    const busyRef = useRef(false);
    const pageRef = useRef(0);
    const totalRef = useRef(1);
    const toast = useToast();

    const start = useCallback(
        async (loader) => {
            loaderRef.current = loader;
            busyRef.current = true;
            pageRef.current = 0;
            totalRef.current = 1;
            setState({
                items: [],
                page: 0,
                totalPages: 1,
                totalResults: 0,
                loading: true,
                error: null,
                started: true,
            });
            try {
                const data = await loader(1);
                if (loaderRef.current !== loader) return;
                pageRef.current = 1;
                totalRef.current = data.total_pages || 1;
                setState({
                    items: filter(data),
                    page: 1,
                    totalPages: totalRef.current,
                    totalResults: data.total_results || 0,
                    loading: false,
                    error: null,
                    started: true,
                });
            } catch (error) {
                if (loaderRef.current !== loader) return;
                setState((s) => ({ ...s, loading: false, error }));
            } finally {
                if (loaderRef.current === loader) busyRef.current = false;
            }
        },
        [filter]
    );

    const loadMore = useCallback(async () => {
        const loader = loaderRef.current;
        if (!loader || busyRef.current || pageRef.current === 0 || pageRef.current >= totalRef.current) return;
        busyRef.current = true;
        const next = pageRef.current + 1;
        setState((s) => ({ ...s, loading: true }));
        try {
            const data = await loader(next);
            if (loaderRef.current !== loader) return;
            pageRef.current = next;
            setState((s) => ({ ...s, items: [...s.items, ...filter(data)], page: next, loading: false }));
        } catch (err) {
            if (loaderRef.current !== loader) return;
            setState((s) => ({ ...s, loading: false }));
            toast(`${t('toast_more_fail')}: ${err.message}`);
        } finally {
            busyRef.current = false;
        }
    }, [filter, toast]);

    return { ...state, start, loadMore };
}

// ---------- 더 보기 버튼 (뷰포트 근처 오면 자동 로드) ----------
function LoadMore({ show, onLoad }) {
    const ref = useInView(onLoad, show);
    if (!show) return null;
    return (
        <div className="text-center mt-6">
            <button
                ref={ref}
                type="button"
                onClick={onLoad}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold min-h-[44px]"
            >
                {t('more')}
            </button>
        </div>
    );
}

export default function Home() {
    useBodyTheme('cinema');
    useDocumentTitle('🎬 영화 탐색 · Coding Sister');

    const [view, setView] = useState('home');
    const [query, setQuery] = useState('');
    const [submitted, setSubmitted] = useState('');
    const favorites = useFavorites();
    const recent = useMemo(() => getRecent(), []);

    const search = useFeed(searchable);
    const browse = useFeed(withPoster);

    // ---------- 검색 ----------
    const runSearch = () => {
        const q = query.trim();
        if (!q) return;
        setSubmitted(q);
        setView('search');
        search.start((page) => TMDBApi.searchMulti(q, page));
    };

    // ---------- 탐색 ----------
    const [genres, setGenres] = useState(() => new Set());
    const [sort, setSort] = useState('popularity.desc');
    const [minRating, setMinRating] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const genreList = useAsync(() => TMDBApi.genres(), []);
    const browseStarted = useRef(false);

    const runBrowse = (opts = {}) => {
        const g = opts.genres ?? genres;
        const s = opts.sort ?? sort;
        const r = opts.minRating ?? minRating;
        const y = opts.year ?? yearFilter;
        browse.start((page) => {
            const params = { sort_by: s, page };
            if (g.size) params.with_genres = [...g].join(',');
            if (r) params['vote_average.gte'] = r;
            if (y) params.primary_release_year = y;
            // 평점순 정렬 시 표본 적은 영화가 상위를 독식하지 않도록 최소 투표수 제한
            if (s === 'vote_average.desc') params['vote_count.gte'] = 200;
            return TMDBApi.discover(params);
        });
    };

    const openView = (name) => {
        setView(name);
        // 탐색 탭을 처음 열면 기본(인기순) 결과를 먼저 보여준다
        if (name === 'browse' && !browseStarted.current) {
            browseStarted.current = true;
            runBrowse();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleGenre = (id) => {
        setGenres((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const resetFilters = () => {
        const empty = new Set();
        setGenres(empty);
        setSort('popularity.desc');
        setMinRating('');
        setYearFilter('');
        runBrowse({ genres: empty, sort: 'popularity.desc', minRating: '', year: '' });
    };

    const tab = (name, active) =>
        `nav-tab px-4 py-2 rounded-lg font-semibold text-sm min-h-[44px] transition ${
            active ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'
        }`;

    return (
        <>
            <Header />
            <Hero query={query} onQueryChange={setQuery} onSearch={runSearch} />

            {/* 서브 내비 (탭) */}
            <div className="bg-white/80 backdrop-blur sticky top-[76px] z-40 border-b border-indigo-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <nav className="flex gap-2 flex-wrap">
                        <button type="button" className={tab('home', view === 'home')} onClick={() => openView('home')}>
                            🏠 <span>{t('nav_home')}</span>
                        </button>
                        <button type="button" className={tab('tv', view === 'tv')} onClick={() => openView('tv')}>
                            📺 <span>{t('nav_series')}</span>
                        </button>
                        <button type="button" className={tab('browse', view === 'browse')} onClick={() => openView('browse')}>
                            🎛 <span>{t('nav_browse')}</span>
                        </button>
                        <button
                            type="button"
                            className={`${tab('fav', view === 'fav')} relative`}
                            onClick={() => openView('fav')}
                        >
                            ❤️ <span>{t('nav_fav')}</span>
                            {favorites.length > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {favorites.length}
                                </span>
                            )}
                        </button>
                    </nav>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* ---------- 홈 ---------- */}
                {view === 'home' && <HomeRows recent={recent} favorites={favorites} />}

                {/* ---------- 시리즈 ---------- */}
                {view === 'tv' && <TvRows />}

                {/* ---------- 검색 ---------- */}
                {view === 'search' && (
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                            {search.loading && !search.items.length
                                ? t('search_searching', { q: submitted })
                                : search.error
                                ? t('search_fail')
                                : t('search_results', {
                                      q: submitted,
                                      n: (search.totalResults || search.items.length).toLocaleString(),
                                  })}
                        </h2>
                        <div className={GRID}>
                            {search.loading && !search.items.length && <SkeletonGrid count={12} />}
                            {search.error && <p className="text-red-500 col-span-full">{search.error.message}</p>}
                            {!search.loading && !search.error && !search.items.length && (
                                <EmptyState emoji="🔍" title={t('empty_search_t')} desc={t('empty_search_d')} />
                            )}
                            {search.items.map((m) => (
                                <MediaCard key={`${m.media_type}-${m.id}`} item={m} />
                            ))}
                        </div>
                        <LoadMore show={search.page > 0 && search.page < search.totalPages} onLoad={search.loadMore} />
                    </div>
                )}

                {/* ---------- 탐색 ---------- */}
                {view === 'browse' && (
                    <div>
                        <div className="bg-white rounded-xl shadow p-4 sm:p-5 mb-6">
                            <p className="text-sm font-semibold text-gray-700 mb-2">{t('f_genre')}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {genreList.loading && <span className="text-gray-400 text-sm">{t('genre_loading')}</span>}
                                {genreList.error && (
                                    <span className="text-red-500 text-sm">
                                        {t('genre_fail')}: {genreList.error.message}
                                    </span>
                                )}
                                {(genreList.data?.genres || []).map((g) => (
                                    <button
                                        key={g.id}
                                        type="button"
                                        onClick={() => toggleGenre(g.id)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-semibold transition min-h-[40px] ${
                                            genres.has(g.id)
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {g.name}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-3 items-end">
                                <label className="text-sm">
                                    <span className="block text-gray-500 mb-1">{t('f_sort')}</span>
                                    <select
                                        value={sort}
                                        onChange={(e) => setSort(e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-gray-300 min-h-[44px]"
                                    >
                                        <option value="popularity.desc">{t('sort_pop')}</option>
                                        <option value="vote_average.desc">{t('sort_rating')}</option>
                                        <option value="primary_release_date.desc">{t('sort_new')}</option>
                                        <option value="revenue.desc">{t('sort_revenue')}</option>
                                    </select>
                                </label>
                                <label className="text-sm">
                                    <span className="block text-gray-500 mb-1">{t('f_rating')}</span>
                                    <select
                                        value={minRating}
                                        onChange={(e) => setMinRating(e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-gray-300 min-h-[44px]"
                                    >
                                        <option value="">{t('rating_all')}</option>
                                        <option value="5">5+</option>
                                        <option value="6">6+</option>
                                        <option value="7">7+</option>
                                        <option value="8">8+</option>
                                    </select>
                                </label>
                                <label className="text-sm">
                                    <span className="block text-gray-500 mb-1">{t('f_year')}</span>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        min="1900"
                                        max="2100"
                                        placeholder={t('year_ph')}
                                        value={yearFilter}
                                        onChange={(e) => setYearFilter(e.target.value)}
                                        className="w-28 px-3 py-2 rounded-lg border border-gray-300 min-h-[44px]"
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={() => runBrowse()}
                                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold min-h-[44px]"
                                >
                                    {t('f_apply')}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition font-semibold min-h-[44px]"
                                >
                                    {t('f_reset')}
                                </button>
                            </div>
                        </div>

                        <div className={GRID}>
                            {browse.loading && !browse.items.length && <SkeletonGrid count={12} />}
                            {browse.error && <p className="text-red-500 col-span-full">{browse.error.message}</p>}
                            {browse.started && !browse.loading && !browse.error && !browse.items.length && (
                                <EmptyState emoji="🎬" title={t('empty_browse_t')} desc={t('empty_browse_d')} />
                            )}
                            {browse.items.map((m) => (
                                <MediaCard key={m.id} item={m} />
                            ))}
                        </div>
                        <LoadMore show={browse.page > 0 && browse.page < browse.totalPages} onLoad={browse.loadMore} />
                    </div>
                )}

                {/* ---------- 내 찜 ---------- */}
                {view === 'fav' && (
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">❤️ {t('fav_heading')}</h2>
                        <div className={GRID}>
                            {favorites.length ? (
                                favorites.map((m) => <MediaCard key={`${m.media_type || 'movie'}-${m.id}`} item={m} />)
                            ) : (
                                <EmptyState emoji="🤍" title={t('empty_fav_t')} desc={t('empty_fav_d')} />
                            )}
                        </div>
                    </div>
                )}
            </main>

            <footer className="text-center text-gray-400 text-sm py-8">
                {t('footer_data')}{' '}
                <a
                    href="https://www.themoviedb.org/"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-indigo-500"
                >
                    TMDB
                </a>
            </footer>
        </>
    );
}

// 홈 가로 슬라이드 구성
function HomeRows({ recent, favorites }) {
    const fav = favorites[0]; // 가장 최근에 찜한 작품 기반 추천
    return (
        <div>
            <AiRecRow />
            {recent.length > 0 && <StaticRow title={'🕘 ' + t('row_recent')} items={recent} />}
            {fav && (
                <LoadRow
                    title={'❤️ ' + t('row_because', { title: fav.title })}
                    load={() => TMDBApi.recommendations(fav.media_type || 'movie', fav.id)}
                />
            )}
            <LoadRow title={'🔥 ' + t('row_popular')} load={() => TMDBApi.popular()} />
            <LoadRow title={'🎬 ' + t('row_now')} load={() => TMDBApi.nowPlaying()} />
            <LoadRow title={'🗓 ' + t('row_upcoming')} load={() => TMDBApi.upcoming()} />
            <LoadRow title={'📈 ' + t('row_trend')} load={() => TMDBApi.trending()} />
            <LoadRow title={'⭐ ' + t('row_top')} load={() => TMDBApi.topRated()} />
            <LoadRow title={'💥 ' + t('row_action')} load={() => TMDBApi.byGenre(28)} />
            <LoadRow title={'😂 ' + t('row_comedy')} load={() => TMDBApi.byGenre(35)} />
            <LoadRow title={'👻 ' + t('row_horror')} load={() => TMDBApi.byGenre(27)} />
            <LoadRow title={'🎈 ' + t('row_anim')} load={() => TMDBApi.byGenre(16)} />
        </div>
    );
}

// TV/시리즈 탭 (TV 전용 장르 ID)
function TvRows() {
    return (
        <div>
            <LoadRow title={'🔥 ' + t('tv_popular')} load={() => TMDBApi.tvPopular()} />
            <LoadRow title={'📡 ' + t('tv_onair')} load={() => TMDBApi.tvOnTheAir()} />
            <LoadRow title={'📈 ' + t('tv_trend')} load={() => TMDBApi.tvTrending()} />
            <LoadRow title={'⭐ ' + t('tv_top')} load={() => TMDBApi.tvTopRated()} />
            <LoadRow title={'🎭 ' + t('tv_drama')} load={() => TMDBApi.tvByGenre(18)} />
            <LoadRow title={'😂 ' + t('row_comedy')} load={() => TMDBApi.tvByGenre(35)} />
            <LoadRow title={'💥 ' + t('tv_action_adv')} load={() => TMDBApi.tvByGenre(10759)} />
            <LoadRow title={'🚀 ' + t('tv_scifi')} load={() => TMDBApi.tvByGenre(10765)} />
            <LoadRow title={'🎈 ' + t('row_anim')} load={() => TMDBApi.tvByGenre(16)} />
        </div>
    );
}
