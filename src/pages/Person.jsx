// ============================================================
//  /person/:id — 인물(배우/감독) 프로필 + 약력 + 필모그래피
// ============================================================
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import MediaCard from '../components/MediaCard';
import { useAsync, useBodyTheme, useDocumentTitle } from '../hooks';
import { t } from '../lib/i18n';
import { TMDBApi } from '../lib/tmdb';
import { profileImg } from '../lib/format';

// TMDB 주요 활동 분야 → i18n 키
const DEPT_KEY = {
    Acting: 'dept_acting',
    Directing: 'dept_directing',
    Writing: 'dept_writing',
    Production: 'dept_production',
    Sound: 'dept_sound',
    Camera: 'dept_camera',
};

function ageText(birthday, deathday) {
    if (!birthday) return '';
    if (deathday) return `${birthday} ~ ${deathday}`;
    return birthday;
}

// 출연작 정리(영화+TV 통합): 포스터 있는 것만, 중복 제거, 최신순
function filmography(person) {
    const seen = new Set();
    const dateOf = (m) => m.release_date || m.first_air_date || '';
    return (person.combined_credits?.cast || [])
        .filter((m) => {
            const key = `${m.media_type}:${m.id}`;
            return m.poster_path && !seen.has(key) && seen.add(key);
        })
        .sort((a, b) => dateOf(b).localeCompare(dateOf(a)));
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

// 400자가 넘으면 접고 더보기 버튼을 붙인다
function Bio({ bio }) {
    const [expanded, setExpanded] = useState(false);
    const long = bio.length > 400;

    return (
        <div className="mt-4">
            <p
                className={`text-gray-700 text-sm leading-relaxed whitespace-pre-line ${
                    long && !expanded ? 'clamped-6' : ''
                }`}
            >
                {bio}
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

export default function Person() {
    const { id } = useParams();
    const valid = /^\d+$/.test(id || '');

    useBodyTheme('cinema');

    const {
        data: person,
        loading,
        error,
    } = useAsync(() => (valid ? TMDBApi.person(id) : Promise.resolve(null)), [id, valid]);

    useDocumentTitle(person ? `${person.name} · Coding Sister` : '인물 · Coding Sister 영화');

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
    if (error || !person) {
        return (
            <Shell>
                <ErrorView message={`${t('err_load_person')} (${error?.message})`} />
            </Shell>
        );
    }

    const dept = DEPT_KEY[person.known_for_department]
        ? t(DEPT_KEY[person.known_for_department])
        : person.known_for_department || '';
    const films = filmography(person);
    const bio = (person.biography || '').trim();

    return (
        <Shell>
            <div className="flex flex-col sm:flex-row gap-6 mb-8">
                <img
                    src={profileImg(person.profile_path, 'w342')}
                    alt={person.name}
                    className="w-40 sm:w-56 rounded-xl shadow-lg shrink-0 mx-auto sm:mx-0"
                />
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl sm:text-4xl font-bold text-gray-900">{person.name}</h2>
                    {dept && <p className="text-indigo-600 font-semibold mt-1">{dept}</p>}
                    <div className="flex flex-wrap gap-3 mt-4 text-sm text-gray-600">
                        {person.birthday && (
                            <span className="px-3 py-1 bg-gray-100 rounded-full">
                                🎂 {ageText(person.birthday, person.deathday)}
                            </span>
                        )}
                        {person.place_of_birth && (
                            <span className="px-3 py-1 bg-gray-100 rounded-full">📍 {person.place_of_birth}</span>
                        )}
                        <span className="px-3 py-1 bg-gray-100 rounded-full">
                            🎬 {t('p_films', { n: films.length })}
                        </span>
                    </div>
                    {bio ? <Bio bio={bio} /> : <p className="mt-4 text-gray-400 text-sm">{t('p_no_bio')}</p>}
                </div>
            </div>

            {films.length ? (
                <section className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-3">🎞 {t('p_filmo')}</h3>
                    {/* movie-grid: 카드 고정폭을 풀어 그리드 칸을 꽉 채우게 한다 */}
                    <div className="movie-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {films.map((m) => (
                            <MediaCard key={`${m.media_type}-${m.id}`} item={m} />
                        ))}
                    </div>
                </section>
            ) : (
                <p className="text-gray-400 text-center py-10">{t('p_no_films')}</p>
            )}
        </Shell>
    );
}
