
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface NavbarProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isAuthenticated, isAdmin, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isHomePage = location.pathname === '/';

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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navClass = isHomePage && !isScrolled && !isMenuOpen
    ? 'bg-transparent text-white'
    : 'bg-white text-gray-900 shadow-sm';

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  const MobileNavLinks = () => (
    <div className="flex flex-col space-y-4 px-4 pt-4 pb-8">
      {isAuthenticated ? (
        <>
          <Link to="/dashboard" className="font-bold text-lg uppercase tracking-widest hover:text-brand">Dashboard</Link>
          <Link to="/search" className="font-bold text-lg uppercase tracking-widest hover:text-brand">Search</Link>
          <Link to="/ai-studio" className="font-bold text-lg uppercase tracking-widest hover:text-brand">AI Studio</Link>
          <Link to="/concierge" className="font-bold text-lg uppercase tracking-widest hover:text-brand text-brand">VIP Concierge</Link>
          <Link to="/interests" className="font-bold text-lg uppercase tracking-widest hover:text-brand">Interests</Link>
          <Link to="/chat" className="font-bold text-lg uppercase tracking-widest hover:text-brand">Chat</Link>
          <Link to="/my-profile" className="font-bold text-lg uppercase tracking-widest hover:text-brand">My Profile</Link>
          {isAdmin && (
            <Link to="/admin" className="text-brand font-black text-lg uppercase tracking-widest">Admin Panel</Link>
          )}
          <button
            onClick={handleLogoutClick}
            className="text-left font-bold text-lg uppercase tracking-widest text-gray-500 hover:text-brand"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login" className="font-bold text-lg uppercase tracking-widest hover:text-brand">Login / Register</Link>
          <Link to="/about-us" className="font-bold text-lg uppercase tracking-widest hover:text-brand">About Us</Link>
          <Link to="/success-stories" className="font-bold text-lg uppercase tracking-widest hover:text-brand">Success Stories</Link>
          <Link to="/contact-us" className="font-bold text-lg uppercase tracking-widest hover:text-brand">Contact Us</Link>
          <Link to="/address" className="font-bold text-lg uppercase tracking-widest hover:text-brand">Address</Link>
        </>
      )}
    </div>
  );

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-3">
                <img src="https://image2url.com/r2/default/images/1771246528579-136852f3-79f6-4e22-8047-6346bc2bd981.png" alt="Bhartiya Rishtey Logo" className="h-12 w-12" />
                <div>
                  <div className="font-extrabold text-xl tracking-tight">Bhartiya Rishtey</div>
                  <div className={`text-[10px] font-bold tracking-[0.2em] uppercase ${isHomePage && !isScrolled ? 'text-gray-300' : 'text-gray-400'}`}>Rishtey • Since 2016</div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="font-bold text-sm uppercase tracking-widest hover:text-brand">Dashboard</Link>
                  <Link to="/search" className="font-bold text-sm uppercase tracking-widest hover:text-brand">Search</Link>
                  <Link to="/interests" className="font-bold text-sm uppercase tracking-widest hover:text-brand">Interests</Link>
                  {isAdmin && (
                    <Link to="/admin" className="text-brand font-black text-sm uppercase tracking-widest">Admin</Link>
                  )}
                  <Link to="/my-profile" className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                    <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4z" /></svg>
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-gray-900">My Profile</span>
                  </Link>
                  <button
                    onClick={handleLogoutClick}
                    className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 hover:text-brand"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-6">
                  <Link to="/login" className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${isHomePage && !isScrolled ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Login / Register</Link>
                  <Link to="/about-us" className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${isHomePage && !isScrolled ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>About Us</Link>
                  <Link to="/success-stories" className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${isHomePage && !isScrolled ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Success Stories</Link>
                  <Link to="/contact-us" className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${isHomePage && !isScrolled ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Contact Us</Link>
                  <Link to="/address" className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${isHomePage && !isScrolled ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Address</Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-lg hover:bg-gray-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {isMenuOpen && (
          <div className="md:hidden bg-white text-gray-900 shadow-lg">
            <MobileNavLinks />
          </div>
        )}
      </nav>
      {/* Spacer to prevent content from being hidden behind fixed navbar */}
      <div className="h-20" />
    </>
  );
};

export default Navbar;
