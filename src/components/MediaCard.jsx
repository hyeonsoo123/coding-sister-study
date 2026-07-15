// ============================================================
//  영화/TV 겸용 포스터 카드 (링크 = 상세 페이지, 우상단 하트로 찜 토글)
//  item: TMDB movie/tv 객체. media_type이 없으면 title 유무로 추정.
// ============================================================
import { Link } from 'react-router-dom';
import { img, rating, year } from '../lib/format';
import { hasFavorite, toggleFavorite } from '../lib/favorites';
import { useFadeIn, useFavorites } from '../hooks';
import { useToast } from './ToastProvider';
import { t } from '../lib/i18n';

export default function MediaCard({ item }) {
    useFavorites(); // 찜 상태 구독 — 다른 화면에서 토글해도 하트가 갱신됨
    const toast = useToast();
    const onImgLoad = useFadeIn();

    const type =
        item.media_type === 'tv' || item.media_type === 'movie'
            ? item.media_type
            : item.title
            ? 'movie'
            : 'tv';
    const title = item.title || item.name || '';
    const date = item.release_date || item.first_air_date || '';
    const to = type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`;
    const faved = hasFavorite(item.id, type);

    const onToggle = (e) => {
        e.preventDefault(); // 카드 링크 이동 막고 찜만 토글
        e.stopPropagation();
        const added = toggleFavorite(
            {
                id: item.id,
                media_type: type,
                title,
                poster_path: item.poster_path,
                vote_average: item.vote_average,
                release_date: date,
            },
            type
        );
        toast(added ? t('toast_added') : t('toast_removed'));
    };

    return (
        <Link
            to={to}
            className="movie-card group relative block shrink-0 rounded-lg overflow-hidden shadow-md bg-gray-200"
        >
            <div className="relative aspect-[2/3] overflow-hidden">
                <img
                    src={img(item.poster_path)}
                    alt={title}
                    loading="lazy"
                    onLoad={onImgLoad}
                    onError={onImgLoad}
                    className="fade-img card-img w-full h-full object-cover"
                />
                {type === 'tv' && <span className="type-badge">TV</span>}
                <button type="button" className="fav-btn" aria-label="favorite" onClick={onToggle}>
                    {faved ? '❤️' : '🤍'}
                </button>
                <div className="card-overlay">
                    <p className="card-title">{title}</p>
                    <p className="card-sub">
                        ⭐ {rating(item.vote_average)} · {year(date)}
                    </p>
                </div>
            </div>
        </Link>
    );
}
