
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t py-20 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" loading="lazy" className="w-12 h-12" />
            <div>
              <div className="text-xl font-black tracking-tight text-gray-900">Bhartiya Rishtey</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trusted Matrimony</div>
            </div>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed font-medium">Verified matrimonial excellence, serving Indian families with trust and heritage for nearly a decade.</p>
          
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Browse profiles on the go using the app.</p>
            {/* App download links temporarily disabled until apps are launched */}
            {/* 
            <div className="flex flex-wrap gap-3"> ... </div>
            */}
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="font-bold text-xs uppercase tracking-widest text-gray-900">Our Offices</h4>
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1">1. Raipur (Registration Office)</p>
              <p className="text-xs text-gray-500 leading-relaxed">Near Spark, Behind Airtel Office, Ward No. 19, Raipur, Chhattisgarh – 490042</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1">2. Bhilai (Sales Team)</p>
              <p className="text-xs text-gray-500 leading-relaxed">Bharat Infotech, Front of Ghadi Chowk, Supela, Bhilai, District Durg, Chhattisgarh – 490023</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1">3. Pune (Tech Team)</p>
              <p className="text-xs text-gray-500 leading-relaxed">2nd Floor, Office No. 213, Mainland Hub, Kesnand Rd, Wagholi, Pune, Maharashtra – 412207</p>
            </div>
          </div>
        </div>

        <div id="contact" className="space-y-6">
          <h4 className="font-bold text-xs uppercase tracking-widest text-gray-900">Support & Connect</h4>
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 leading-relaxed font-bold">Email Support:</p>
              <p className="text-xs text-gray-500">helpbhartiyarishtey09@gmail.com</p>
              <p className="text-xs text-gray-500">bhartiyarishte03@gmail.com</p>
            </div>
            <div className="pt-2 border-t border-gray-100 mt-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contact Us</p>
              <p className="text-xs text-gray-500">📞 9109330332</p>
              <p className="text-xs text-gray-500">📞 7898680332</p>
            </div>
            <div className="space-y-4 pt-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Connect with us</p>
              <div className="flex flex-wrap gap-3">
                <a href="https://www.instagram.com/bhartiya_rishtey" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center text-white hover:scale-110 transition shadow-md">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                {/* X and LinkedIn href removed for now as they are unset */}
                <a href="https://www.facebook.com/share/1Aoakao3P7/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:scale-110 transition shadow-md">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                </a>
                <a href="https://t.me/+ccvYJYxatiY1NWJl" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#0088cc] flex items-center justify-center text-white hover:scale-110 transition shadow-md">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm4.462 8.876c-.181 1.905-1.073 7.136-1.527 9.565-.192 1.028-.571 1.371-.937 1.405-.796.075-1.401-.525-2.172-1.031-1.206-.79-1.888-1.282-3.057-2.053-1.351-.89-.475-1.379.294-2.179.201-.209 3.697-3.389 3.768-3.691.009-.037.017-.174-.065-.247-.082-.073-.203-.048-.291-.028-.125.028-2.112 1.341-5.957 3.938-.564.388-1.074.577-1.531.566-.503-.01-1.47-.283-2.189-.516-.881-.286-1.581-.438-1.521-.924.031-.253.38-.511 1.047-.773 4.104-1.788 6.841-2.968 8.211-3.54 3.912-1.632 4.725-1.916 5.256-1.925.117-.002.379.027.549.165.144.117.183.275.193.387.01.112.022.355.011.533z"/></svg>
                </a>
            </div>
          </div>
        </div>
      </div>

        <div className="space-y-6">
          <h4 className="font-bold text-xs uppercase tracking-widest text-gray-900">Quick Links</h4>
          <div className="grid grid-cols-1 gap-3">
            <Link to="/success-stories" className="text-xs text-gray-500 hover:text-brand font-bold uppercase tracking-widest">Success Stories</Link>
            <Link to="/pricing" className="text-xs text-gray-500 hover:text-brand font-bold uppercase tracking-widest">Plans</Link>
            <Link to="/my-profile" className="text-xs text-gray-500 hover:text-brand font-bold uppercase tracking-widest">My Profile</Link>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-20 pt-10 border-t flex flex-col md:flex-row justify-between items-center gap-6">
         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">&copy; 2016 Bhartiya Rishtey. All Rights Reserved.</p>
         <div className="text-center md:text-right">
            <p className="text-xs text-gray-500 font-medium">Developed by Anush Tiwari</p>
            <p className="text-[10px] text-gray-400">📞 8120476475</p>
            <p className="text-[10px] text-gray-400">📧 tiwarianush07@gmail.com</p>
         </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);
