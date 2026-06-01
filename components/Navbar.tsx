
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface NavbarProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isAuthenticated, isAdmin, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isHomePage = location.pathname === '/';
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
     const checkNotifications = async () => {
        if (!user) return;
        const { count, error } = await supabase
           .from('notifications')
           .select('*', { count: 'exact', head: true })
           .eq('user_id', user.id)
           .eq('is_read', false);
        
        if (!error && count !== null) {
           setUnreadCount(count);
        }
     };

     if (isAuthenticated) {
        checkNotifications();
        
        // Listen dynamically for new insertions
        const channel = supabase.channel('notify-channel')
           .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id}` }, () => {
              setUnreadCount(c => c + 1);
           })
           .subscribe();
           
        return () => { supabase.removeChannel(channel); };
     }
  }, [user, isAuthenticated]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    if (isHomePage) {
      window.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (isHomePage) {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isHomePage]);
  
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navClass = isHomePage && !isScrolled && !isMenuOpen
    ? 'bg-transparent text-white'
    : 'bg-white text-gray-900 shadow-sm';

  const handleLogoutClick = React.useCallback(() => {
    onLogout();
    navigate('/');
  }, [onLogout, navigate]);

  const MobileNavLinks = React.useCallback(() => (
    <div className="flex flex-col space-y-6 px-6 pt-8 pb-12 bg-white">
      {isAuthenticated ? (
        <>
          <Link to="/dashboard" className="font-bold text-lg uppercase tracking-widest text-gray-900">My Matches</Link>
          <Link to="/search" className="font-bold text-lg uppercase tracking-widest text-gray-900">Search</Link>
          <Link to="/interests" className="font-bold text-lg uppercase tracking-widest text-gray-900">Interests</Link>
          <Link to="/chat" className="font-bold text-lg uppercase tracking-widest text-gray-900">Messages</Link>
          <Link to="/my-profile" className="font-bold text-lg uppercase tracking-widest text-brand">My Profile</Link>
          {isAdmin && (
            <Link to="/admin" className="font-bold text-lg uppercase tracking-widest text-rose-600">Moderator Panel</Link>
          )}
          <button 
            onClick={handleLogoutClick}
            className="text-left font-bold text-lg uppercase tracking-widest text-gray-400"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login" className="font-bold text-lg uppercase tracking-widest text-gray-900">Login / Register</Link>
          <Link to="#" className="font-bold text-lg uppercase tracking-widest text-gray-900">About Us</Link>
          <Link to="/success-stories" className="font-bold text-lg uppercase tracking-widest text-gray-900">Success Stories</Link>
          <button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="font-bold text-lg uppercase tracking-widest text-gray-900 text-left">Contact Us</button>
        </>
      )}
    </div>
  ), [isAuthenticated, isAdmin, handleLogoutClick]);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 sm:gap-3">
                <img src="/logo.png" alt="Bhartiya Rishtey Logo" width="48" height="48" className="h-12 w-12" />
                <div>
                  <div className="font-black text-lg sm:text-xl tracking-tighter uppercase leading-none">Bhartiya Rishtey</div>
                  <div className={`text-[9px] font-bold tracking-[0.2em] uppercase mt-1 ${isHomePage && !isScrolled ? 'text-gray-300' : 'text-gray-400'}`}>Trusted Since 2016</div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="font-bold text-[11px] uppercase tracking-widest hover:text-brand transition-colors">My Matches</Link>
                  <Link to="/search" className="font-bold text-[11px] uppercase tracking-widest hover:text-brand transition-colors">Search</Link>
                  <Link to="/chat" className="font-bold text-[11px] uppercase tracking-widest hover:text-brand transition-colors">Messages</Link>
                  
                  {/* Notification Center Trigger */}
                  <button className="relative text-gray-500 hover:text-brand transition-colors" title="Notifications">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {unreadCount > 0 && (
                       <span className="absolute -top-1 -right-1 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-brand text-[8px] text-white font-black items-center justify-center border-2 border-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                       </span>
                    )}
                  </button>

                  {isAdmin && (
                    <Link to="/admin" className="text-brand font-bold text-[11px] uppercase tracking-widest bg-rose-50 px-4 py-2 rounded-lg border border-rose-100">Panel</Link>
                  )}
                  <Link to="/my-profile" className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-xl hover:bg-black transition text-white">
                    <div className="w-6 h-6 rounded-lg bg-brand flex items-center justify-center font-black text-[10px]">
                        {user?.profile?.full_name?.[0] || 'U'}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Profile</span>
                  </Link>
                  <button
                    onClick={handleLogoutClick}
                    className="font-bold text-[11px] uppercase tracking-widest text-gray-400 hover:text-brand transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-8">
                  <Link to="/login" className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${isHomePage && !isScrolled ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Login / Register</Link>
                  <Link to="#" className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${isHomePage && !isScrolled ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>About Us</Link>
                  <Link to="/success-stories" className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${isHomePage && !isScrolled ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Success Stories</Link>
                  <button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${isHomePage && !isScrolled ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Contact Us</button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button aria-label="Toggle Menu" onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-gray-100 transition active:scale-95">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {isMenuOpen && (
          <div className="md:hidden border-t">
            <MobileNavLinks />
          </div>
        )}
      </nav>
      <div className="h-20" />
    </>
  );
};

export default React.memo(Navbar);
