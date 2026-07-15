// ============================================================
//  라우팅 + 전역 프로바이더
//  구 URL(*.html)은 새 경로로 리다이렉트해 기존 링크·북마크를 살린다
// ============================================================
import { Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { ToastProvider } from './components/ToastProvider';
import { TrailerProvider } from './components/TrailerProvider';
import BackToTop from './components/BackToTop';

import Home from './pages/Home';
import MovieDetail from './pages/MovieDetail';
import TvDetail from './pages/TvDetail';
import Person from './pages/Person';
import OrderComplete from './pages/OrderComplete';
import MyPage from './pages/MyPage';
import TodoPage from './pages/TodoPage';
import About from './pages/About';
import AdminLogin from './pages/admin/AdminLogin';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import NotFound from './pages/NotFound';

// 라우트 이동 시 스크롤 맨 위로
function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => window.scrollTo(0, 0), [pathname]);
    return null;
}

// 구 링크 호환: /movie-detail.html?id=123 → /movie/123
function LegacyDetailRedirect({ base }) {
    const [params] = useSearchParams();
    const id = params.get('id');
    return <Navigate to={id ? `${base}/${id}` : '/'} replace />;
}

export default function App() {
    return (
        <ToastProvider>
            <TrailerProvider>
                <ScrollToTop />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/movie/:id" element={<MovieDetail />} />
                    <Route path="/tv/:id" element={<TvDetail />} />
                    <Route path="/person/:id" element={<Person />} />
                    <Route path="/order-complete/:orderId" element={<OrderComplete />} />
                    <Route path="/my-page" element={<MyPage />} />
                    <Route path="/todo" element={<TodoPage />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/products" element={<AdminProducts />} />
                    <Route path="/admin/orders" element={<AdminOrders />} />

                    {/* ---- 구 .html URL 호환 ---- */}
                    <Route path="/index.html" element={<Navigate to="/" replace />} />
                    <Route path="/movie-detail.html" element={<LegacyDetailRedirect base="/movie" />} />
                    <Route path="/tv-detail.html" element={<LegacyDetailRedirect base="/tv" />} />
                    <Route path="/person.html" element={<LegacyDetailRedirect base="/person" />} />
                    <Route path="/my-page.html" element={<Navigate to="/my-page" replace />} />
                    <Route path="/todo.html" element={<Navigate to="/todo" replace />} />
                    <Route path="/about.html" element={<Navigate to="/about" replace />} />
                    <Route path="/admin-login.html" element={<Navigate to="/admin/login" replace />} />
                    <Route path="/admin-products.html" element={<Navigate to="/admin/products" replace />} />
                    <Route path="/admin-orders.html" element={<Navigate to="/admin/orders" replace />} />

                    <Route path="*" element={<NotFound />} />
                </Routes>
                <BackToTop />
            </TrailerProvider>
        </ToastProvider>
    );
}
