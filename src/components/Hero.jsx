// ============================================================
//  히어로 빌보드 (트렌딩 5개, 수동 넘김 + 스와이프)
//  - 검색창 + 피처드 작품 정보 + 예고편/상세/찜
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { TMDBApi } from '../lib/tmdb';
import { img, pickYouTubeKey, rating, year } from '../lib/format';
import { hasFavorite, toggleFavorite } from '../lib/favorites';
import { t } from '../lib/i18n';
import { useAsync, useFavorites } from '../hooks';
import { useToast } from './ToastProvider';
import { useTrailer } from './TrailerProvider';

const RESIST = 0.4; // 드래그 저항 — 배경이 손을 살짝만 따라오게

export default function Hero({ query, onQueryChange, onSearch }) {
    const { data } = useAsync(() => TMDBApi.trending(), []);
    const [idx, setIdx] = useState(0);
    const [imgSrc, setImgSrc] = useState('');
    const [imgVisible, setImgVisible] = useState(false);

    useFavorites(); // 하트 상태 구독
    const toast = useToast();
    const playTrailer = useTrailer();

    const slideRef = useRef(null);
    const infoRef = useRef(null);

    const items = (data?.results || []).filter((m) => m.backdrop_path && m.overview).slice(0, 5);
    const movie = items[idx];

    const move = (next) => items.length && setIdx((next + items.length) % items.length);

    // 백드롭 교체 시 미리 로드해두고 페이드 (깜빡임 방지)
    useEffect(() => {
        if (!movie) return undefined;
        let alive = true;
        setImgVisible(false);
        const pre = new Image();
        pre.onload = () => {
            if (!alive) return;
            setImgSrc(pre.src);
            setImgVisible(true);
        };
        pre.src = img(movie.backdrop_path, 'w1280');
        return () => {
            alive = false;
        };
    }, [movie]);

    // 스와이프/드래그 — 손 따라 실시간으로 밀리고, 놓으면 복귀 또는 넘김
    useEffect(() => {
        const hero = slideRef.current?.parentElement;
        if (!hero || !items.length) return undefined;

        let startX = null;
        let dx = 0;
        const shift = (px) => {
            if (slideRef.current) slideRef.current.style.transform = `translateX(${px}px)`;
            if (infoRef.current) infoRef.current.style.transform = `translateX(${px}px)`;
        };
        const setTransition = (v) => {
            if (slideRef.current) slideRef.current.style.transition = v;
            if (infoRef.current) infoRef.current.style.transition = v;
        };

        const onDown = (e) => {
            // 검색·버튼·점 위에서 시작한 드래그는 무시
            if (e.target.closest('input, button, a, [data-hero-dots]')) return;
            startX = e.clientX;
            dx = 0;
            setTransition('none');
        };
        const onMove = (e) => {
            if (startX === null) return;
            dx = e.clientX - startX;
            shift(dx * RESIST);
        };
        const onUp = () => {
            if (startX === null) return;
            const moved = dx;
            startX = null;
            setTransition('transform 0.3s ease');
            shift(0);
            if (Math.abs(moved) > 60) move(idx + (moved < 0 ? 1 : -1));
        };

        hero.addEventListener('pointerdown', onDown);
        hero.addEventListener('pointermove', onMove);
        hero.addEventListener('pointerup', onUp);
        hero.addEventListener('pointercancel', onUp);
        return () => {
            hero.removeEventListener('pointerdown', onDown);
            hero.removeEventListener('pointermove', onMove);
            hero.removeEventListener('pointerup', onUp);
            hero.removeEventListener('pointercancel', onUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items.length, idx]);

    const onTrailer = async () => {
        if (!movie) return;
        try {
            let key = pickYouTubeKey(await TMDBApi.movieVideos(movie.id));
            // ko-KR에 예고편이 없는 경우가 많아 en-US로 한 번 더 시도
            if (!key) key = pickYouTubeKey(await TMDBApi.get(`/movie/${movie.id}/videos`, { language: 'en-US' }));
            if (key) playTrailer(key);
            else toast(t('no_trailer'));
        } catch {
            toast(t('no_trailer'));
        }
    };

    const onFav = () => {
        const added = toggleFavorite(movie, 'movie');
        toast(added ? t('toast_added') : t('toast_removed'));
    };

    // 검색창은 히어로가 비어도 항상 보여야 하므로 배너만 조건부 렌더
    return (
        <section className="hero-slide relative w-full overflow-hidden bg-gray-900">
            <div ref={slideRef} className="absolute inset-0">
                <img
                    src={imgSrc}
                    alt=""
                    className={`hero-img w-full h-full object-cover object-top transition-opacity duration-500 ${
                        imgVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />

            <div className="relative max-w-7xl mx-auto min-h-[360px] sm:min-h-[460px] px-4 sm:px-6 lg:px-8 flex flex-col justify-between gap-6 py-6 sm:py-7">
                {/* 검색 (히어로 상단, 가운데) */}
                <form
                    className="w-full sm:max-w-2xl mx-auto"
                    onSubmit={(e) => {
                        e.preventDefault();
                        onSearch();
                    }}
                >
                    <div className="relative">
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => onQueryChange(e.target.value)}
                            placeholder={t('search_ph')}
                            className="hero-search w-full pl-5 pr-14 py-3 rounded-full bg-white/95 shadow-lg focus:ring-2 focus:ring-indigo-300 outline-none min-h-[48px]"
                        />
                        <button
                            type="submit"
                            aria-label="search"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition"
                        >
                            🔍
                        </button>
                    </div>
                </form>

                {/* 피처드 정보 (히어로 하단) */}
                <div ref={infoRef} className="max-w-2xl text-white">
                    {movie && (
                        <>
                            <Link to={`/movie/${movie.id}`} className="inline-block">
                                <h2 className="text-2xl sm:text-5xl font-extrabold drop-shadow-lg leading-tight transition-opacity hover:opacity-80">
                                    {movie.title || movie.name}
                                </h2>
                            </Link>
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                                <span className="font-bold text-yellow-400">⭐ {rating(movie.vote_average)}</span>
                                <span className="text-gray-300">·</span>
                                <span className="text-gray-200">{year(movie.release_date)}</span>
                            </div>
                            <p className="clamped-2 mt-2 text-sm sm:text-base text-gray-200 drop-shadow max-w-xl">
                                {movie.overview || ''}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={onTrailer}
                                    className="px-5 py-2.5 bg-indigo-500 text-white rounded-lg font-bold hover:bg-indigo-400 transition min-h-[44px] inline-flex items-center gap-1"
                                >
                                    ▶ <span>{t('sec_trailer')}</span>
                                </button>
                                <Link
                                    to={`/movie/${movie.id}`}
                                    className="px-5 py-2.5 bg-white/25 text-white rounded-lg font-bold backdrop-blur hover:bg-white/35 transition min-h-[44px] inline-flex items-center gap-1"
                                >
                                    ℹ <span>{t('hero_detail')}</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={onFav}
                                    aria-label="favorite"
                                    className="px-4 py-2.5 bg-white/25 text-white rounded-lg font-bold backdrop-blur hover:bg-white/35 transition min-h-[44px]"
                                >
                                    {hasFavorite(movie.id, 'movie') ? '❤️' : '🤍'}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* 좌우 이동 + 점 */}
                {items.length > 1 && (
                    <>
                        <button
                            type="button"
                            aria-label="prev"
                            onClick={() => move(idx - 1)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white text-2xl hidden sm:flex items-center justify-center"
                        >
                            ‹
                        </button>
                        <button
                            type="button"
                            aria-label="next"
                            onClick={() => move(idx + 1)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white text-2xl hidden sm:flex items-center justify-center"
                        >
                            ›
                        </button>
                        <div data-hero-dots className="absolute bottom-3 right-4 flex gap-1.5">
                            {items.map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    aria-label={String(i + 1)}
                                    onClick={() => move(i)}
                                    className={`w-2.5 h-2.5 rounded-full transition ${
                                        i === idx ? 'bg-white' : 'bg-white/50'
                                    }`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
