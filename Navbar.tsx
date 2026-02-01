import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogOut, Shield } from 'lucide-react';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to scroll to section if on home, or navigate home then scroll
  const scrollToSection = (id: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  const navLinkClass = "text-slate-600 hover:text-saffron-600 font-medium cursor-pointer";

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3">
              <img src="https://iili.io/fQUNGf9.md.jpg" alt="Bhartiya Brahmin Rishtey Logo" className="h-12 w-12 rounded-full object-cover border border-saffron-100" />
              <span className="text-xl md:text-2xl font-serif font-bold text-slate-900">Bhartiya Brahmin Rishtey</span>
            </Link>
          </div>
          
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link to="/" className={navLinkClass}>Home</Link>
            <button onClick={() => scrollToSection('plans')} className={navLinkClass}>Membership Plans</button>
            <button onClick={() => scrollToSection('benefits')} className={navLinkClass}>Benefits</button>
            <button onClick={() => scrollToSection('community')} className={navLinkClass}>Community</button>
            
            {!user ? (
              <div className="flex items-center space-x-4 ml-4">
                <Link to="/login" className="text-slate-900 font-medium hover:text-saffron-600">Login</Link>
                <Link to="/help" className="text-slate-900 font-medium hover:text-saffron-600">Help</Link>
                <Link to="/register" className="px-6 py-2.5 text-sm font-bold text-white bg-pink-600 rounded-md hover:bg-pink-700 transition-colors shadow-lg shadow-pink-600/20">Register Free</Link>
              </div>
            ) : (
              <div className="flex items-center space-x-6 ml-4">
                 <Link to="/dashboard" className="text-slate-900 font-medium hover:text-saffron-600">Dashboard</Link>
                 <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                    <span className="text-sm text-slate-700 font-medium flex items-center gap-1">
                      {user.role === UserRole.VIP && <Shield size={14} className="text-yellow-500 fill-yellow-500" />}
                      {user.name.split(' ')[0]}
                    </span>
                 </div>
                <button onClick={logout} className="text-slate-500 hover:text-red-600" title="Logout">
                  <LogOut size={20} />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-500 hover:text-saffron-600 p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 absolute w-full shadow-lg">
          <div className="px-4 pt-2 pb-6 space-y-2">
             <Link to="/" className="block py-2 text-base font-medium text-slate-700 hover:text-saffron-600" onClick={() => setIsOpen(false)}>Home</Link>
             <button onClick={() => scrollToSection('plans')} className="block w-full text-left py-2 text-base font-medium text-slate-700 hover:text-saffron-600">Membership Plans</button>
             <button onClick={() => scrollToSection('benefits')} className="block w-full text-left py-2 text-base font-medium text-slate-700 hover:text-saffron-600">Benefits</button>
             <button onClick={() => scrollToSection('community')} className="block w-full text-left py-2 text-base font-medium text-slate-700 hover:text-saffron-600">Community</button>
             
             {!user ? (
               <div className="pt-4 flex flex-col space-y-3">
                  <Link to="/login" className="block text-center py-2 text-base font-medium text-slate-700 border border-slate-300 rounded-md" onClick={() => setIsOpen(false)}>Login</Link>
                  <Link to="/register" className="block text-center py-2 text-base font-bold text-white bg-pink-600 rounded-md" onClick={() => setIsOpen(false)}>Register Free</Link>
               </div>
             ) : (
               <div className="pt-4 border-t border-slate-100 mt-2">
                 <Link to="/dashboard" className="block py-2 text-base font-medium text-slate-700" onClick={() => setIsOpen(false)}>Dashboard</Link>
                 <button onClick={() => { logout(); setIsOpen(false); }} className="block w-full text-left py-2 text-base font-medium text-red-600">Logout</button>
               </div>
             )}
          </div>
        </div>
      )}
    </nav>
  );
};