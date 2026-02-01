import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-4">
               <img src="https://iili.io/fQUNGf9.md.jpg" alt="Logo" className="h-10 w-10 rounded-full object-cover mr-3 border border-slate-700" />
               <span className="text-xl font-serif font-bold text-white">Bhartiya Brahmin<br/>Rishtey</span>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              India's most trusted Brahmin matrimonial platform helping families find their perfect life partner.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="bg-slate-800 p-2 rounded-full hover:bg-saffron-600 transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="bg-slate-800 p-2 rounded-full hover:bg-saffron-600 transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="bg-slate-800 p-2 rounded-full hover:bg-saffron-600 transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="bg-slate-800 p-2 rounded-full hover:bg-saffron-600 transition-colors">
                <Linkedin size={18} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="hover:text-saffron-500">About Us</Link></li>
              <li><Link to="/careers" className="hover:text-saffron-500">Careers</Link></li>
              <li><Link to="/contact" className="hover:text-saffron-500">Contact</Link></li>
              <li><Link to="/blog" className="hover:text-saffron-500">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Support</h3>
            <ul className="space-y-3">
              <li><Link to="/faqs" className="hover:text-saffron-500">FAQs</Link></li>
              <li><Link to="/help" className="hover:text-saffron-500">Help Center</Link></li>
              <li><Link to="/safety" className="hover:text-saffron-500">Safety Tips</Link></li>
              <li><Link to="/report" className="hover:text-saffron-500">Report Issue</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><Link to="/terms" className="hover:text-saffron-500">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-saffron-500">Privacy Policy</Link></li>
              <li><Link to="/cookie" className="hover:text-saffron-500">Cookie Policy</Link></li>
              <li><Link to="/refund" className="hover:text-saffron-500">Refund Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-slate-500">
            &copy; 2024 Bhartiya Brahmin Rishtey. All rights reserved.
          </p>
          <div className="flex items-center text-sm text-slate-500 mt-4 md:mt-0">
            <span>Made with</span>
            <Heart size={14} className="text-rose-500 mx-1 fill-current" />
            <span>in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};