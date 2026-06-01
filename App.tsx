import { FC, lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';

// Lazy-load non-critical components to keep initial bundle small
const Footer = lazy(() => import('./components/Footer'));
const AIChatBot = lazy(() => import('./components/AIChatBot'));

const LandingPage = lazy(() => import('./views/LandingPage'));
const LoginPage = lazy(() => import('./views/LoginPage'));
const Dashboard = lazy(() => import('./views/Dashboard'));
const SearchPage = lazy(() => import('./views/SearchPage'));
const ProfileDetail = lazy(() => import('./views/ProfileDetail'));
const MyProfile = lazy(() => import('./views/MyProfile'));
const ChatPage = lazy(() => import('./views/ChatPage'));
const AdminDashboard = lazy(() => import('./views/AdminDashboard'));
const AdminSetup = lazy(() => import('./views/AdminSetup'));
const CheckoutPage = lazy(() => import('./views/CheckoutPage'));
const SuccessStoriesPage = lazy(() => import('./views/SuccessStoriesPage'));
const InterestsPage = lazy(() => import('./views/InterestsPage'));
const PartnerPreferencesPage = lazy(() => import('./views/PartnerPreferencesPage'));
const AIStudio = lazy(() => import('./views/AIStudio'));
const VIPConcierge = lazy(() => import('./views/VIPConcierge'));
const PricingPage = lazy(() => import('./views/PricingPage'));
const AboutPage = lazy(() => import('./views/AboutPage'));
const ContactPage = lazy(() => import('./views/ContactPage'));
const MatchesPage = lazy(() => import('./views/MatchesPage'));
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import ProtectedRoute from './components/guards/ProtectedRoute';
import AdminRoute from './components/guards/AdminRoute';

// Loading timeout to prevent infinite loading if auth hangs
const AUTH_LOADING_TIMEOUT_MS = 25000; // Increased to 25s for reliability

const AppContent: FC = () => {
  const { user, loading, error: authError, refreshProfile } = useAuth();
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  // Safety net: if auth loading takes > 10s, force-stop loading
  useEffect(() => {
    if (!loading) {
      setLoadingTimedOut(false);
      return;
    }
    const timer = setTimeout(() => {
      setLoadingTimedOut(true);
    }, AUTH_LOADING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // Show error UI if auth timed out or auth returned an error
  if (loadingTimedOut || (!loading && authError)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-4xl">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900">Connection Problem</h2>
          <p className="text-gray-500 leading-relaxed">
            {authError || 'The server is taking too long to respond. This may be due to a network issue or server maintenance.'}
          </p>
          <button
            onClick={handleRetry}
            className="px-8 py-3 bg-brand text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-rose-700 transition shadow-lg"
          >
            Retry Connection
          </button>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">If this persists, contact support</p>
        </div>
      </div>
    );
  }
  
  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand"></div>
                <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Finding your matches...</p>
            </div>
          </div>
      );
  }

  const isAuthenticated = !!user;
  const isAdminEmail = user?.email === 'bhartiyarishte03@gmail.com';
  const isAdmin = user?.is_admin || isAdminEmail || false;
  const isPremium = user?.profile?.plan_type === 'premium';

  const getRedirectPath = () => {
    if (isAdminEmail || isAdmin) return "/admin";
    if (user && !user.profile?.profile_completed) return "/my-profile";
    const params = new URLSearchParams(window.location.search);
    return params.get('redirect') || "/dashboard";
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar 
          isAuthenticated={isAuthenticated} 
          isAdmin={isAdmin} 
          onLogout={handleLogout} 
        />
        <main className="flex-grow">
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
               <div className="flex flex-col items-center gap-6">
                 <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-brand"></div>
                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Loading...</p>
               </div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<LandingPage isAuthenticated={isAuthenticated} />} />
              <Route path="/success-stories" element={<SuccessStoriesPage />} />
              <Route 
                path="/login" 
                element={isAuthenticated ? <Navigate to={getRedirectPath()} /> : <LoginPage />} 
              />
              <Route 
                path="/signup" 
                element={isAuthenticated ? <Navigate to={getRedirectPath()} /> : <LoginPage />} 
              />
              <Route 
                path="/auth" 
                element={isAuthenticated ? <Navigate to={getRedirectPath()} /> : <LoginPage />} 
              />
              
              {/* Protected B2C Routes */}
              <Route 
                path="/dashboard" 
                element={isAuthenticated ? <Dashboard isPremium={isPremium} /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/search" 
                element={isAuthenticated ? <SearchPage /> : <Navigate to="/login?redirect=/search" />} 
              />
              <Route 
                path="/matches" 
                element={isAuthenticated ? <MatchesPage /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/pricing" 
                element={<PricingPage onPaymentSuccess={refreshProfile} />} 
              />
              <Route 
                path="/profile/:id" 
                element={<ProfileDetail />} 
              />
              <Route 
                path="/my-profile" 
                element={isAuthenticated ? <MyProfile /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/settings" 
                element={isAuthenticated ? <MyProfile /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/ai-studio" 
                element={isAuthenticated ? <AIStudio /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/concierge" 
                element={isAuthenticated ? <VIPConcierge /> : <Navigate to="/login" />} 
              />
               <Route 
                path="/partner-preferences" 
                element={isAuthenticated ? <PartnerPreferencesPage /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/interests" 
                element={isAuthenticated ? <InterestsPage /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/chat" 
                element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" />} 
              />
               <Route 
                path="/checkout" 
                element={isAuthenticated ? <CheckoutPage onPaymentSuccess={refreshProfile} /> : <Navigate to="/login" />} 
              />
              
              {/* STRICTLY ADMIN ROUTES ONLY */}
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/admin/setup" 
                element={
                  <AdminRoute>
                    <AdminSetup />
                  </AdminRoute>
                } 
              />

              {/* Public Info Pages */}
              <Route path="/about-us" element={<AboutPage />} />
              <Route path="/contact-us" element={<ContactPage />} />

              {/* Catch-all deadend routing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        
        {/* Lazy-loaded non-critical components */}
        <Suspense fallback={null}>
          <AIChatBot />
        </Suspense>

        <Suspense fallback={<div className="bg-white border-t py-20 px-4 min-h-[200px]"></div>}>
          <Footer />
        </Suspense>
      </div>
    </Router>
  );
};

import ErrorBoundary from './components/ErrorBoundary';

const App: FC = () => (
  <ErrorBoundary>
    <AuthProvider>
        <AppContent />
    </AuthProvider>
  </ErrorBoundary>
);

export default App;
