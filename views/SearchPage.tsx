import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfiles } from '../hooks/useProfiles';
import { normalizeUserIdSearch } from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import { ProfileCardSkeleton } from '../components/ProfileCardSkeleton';

const calculateAge = (date_of_birth: string): number => {
    if (!date_of_birth) return 0;
    const birthDate = new Date(date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const SearchPage: React.FC = () => {
  const { user } = useAuth();
  const isPremium = user?.profile?.plan_type === 'premium';

  const [filters, setFilters] = useState({
    minAge: 21,
    maxAge: 45,
    religion: '',
    city: '',
    minIncome: 0,
  });
  const [userIdSearch, setUserIdSearch] = useState('');
  // Mobile bottom-sheet toggle
  const [showFilters, setShowFilters] = useState(false);

  const { profiles, loading, error, hasMore, loadMore } = useProfiles({ ...filters, userIdSearch: userIdSearch.trim() ? normalizeUserIdSearch(userIdSearch) : '' });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ 
      ...prev, 
      [name]: name === 'minAge' || name === 'maxAge' || name === 'minIncome' ? parseInt(value) || 0 : value 
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Advanced Match Search</h1>

      {/* User ID Quick Search */}
      <div className="mb-8 bg-white p-6 rounded-3xl border shadow-sm">
        <h3 className="font-bold text-sm uppercase tracking-widest text-gray-400 mb-4">🔍 Quick Search by User ID</h3>
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-4 flex items-center text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input
            type="text"
            placeholder="Enter User ID or Number (e.g., 1, 25, BR0001)"
            value={userIdSearch}
            onChange={(e) => setUserIdSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
          />
          {userIdSearch.trim() && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {/^\d+$/.test(userIdSearch.trim()) && (
                <span className="text-[10px] font-bold text-brand bg-rose-50 px-2 py-0.5 rounded-full">
                  Searching: {normalizeUserIdSearch(userIdSearch)}
                </span>
              )}
              <button 
                onClick={() => setUserIdSearch('')}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
              >✕</button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Trigger (mobile) */}
        <div className="lg:hidden fixed bottom-6 right-4 z-40">
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2 bg-brand text-white px-5 py-3.5 rounded-2xl shadow-xl shadow-rose-300 font-black text-[11px] uppercase tracking-widest hover:bg-rose-700 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            Filters
            {Object.values(filters).some(v => v !== '' && v !== 21 && v !== 45 && v !== 0) && (
              <span className="w-2 h-2 bg-white rounded-full"></span>
            )}
          </button>
        </div>

        {/* Mobile Bottom Sheet Backdrop */}
        {showFilters && (
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowFilters(false)}
          />
        )}

        {/* Filters Panel — sidebar on desktop, bottom sheet on mobile */}
        <aside className={`
          lg:w-80 lg:static lg:block space-y-6
          fixed inset-x-0 bottom-0 z-[60] transition-transform duration-500 ease-out
          lg:transform-none
          ${showFilters ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
        `}>
          {/* Mobile drag handle */}
          <div className="lg:hidden flex justify-center pt-3 pb-1 bg-white rounded-t-3xl">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
          </div>

          <div className="bg-white p-6 rounded-3xl lg:rounded-3xl border shadow-sm space-y-6 max-h-[85vh] lg:max-h-none overflow-y-auto">
            <h3 className="font-bold text-lg flex items-center gap-2 text-brand">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              Filter Search
            </h3>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Age Range ({filters.minAge} - {filters.maxAge})</label>
              <div className="flex items-center gap-2">
                 <input 
                    type="number" 
                    name="minAge"
                    value={filters.minAge}
                    onChange={handleFilterChange}
                    className="w-full p-2 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-brand outline-none" 
                  />
                  <span>-</span>
                  <input 
                    type="number" 
                    name="maxAge"
                    value={filters.maxAge}
                    onChange={handleFilterChange}
                    className="w-full p-2 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-brand outline-none" 
                  />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Religion</label>
              <select 
                name="religion"
                className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-brand outline-none"
                value={filters.religion}
                onChange={handleFilterChange}
              >
                <option value="">Any Religion</option>
                <option value="Hindu">Hindu</option>
                <option value="Muslim">Muslim</option>
                <option value="Sikh">Sikh</option>
                <option value="Christian">Christian</option>
                <option value="Jain">Jain</option>
              </select>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <input 
                  type="text" 
                  name="city"
                  placeholder="e.g. Mumbai"
                  value={filters.city}
                  onChange={handleFilterChange}
                  className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-brand outline-none" 
                />
            </div>

            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between">
                 Min Income (Annual)
                 {!isPremium && <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1"><span className="text-xs">🔒</span> Elite</span>}
              </label>
              <input 
                type="number" 
                name="minIncome"
                value={filters.minIncome}
                onChange={handleFilterChange}
                disabled={!isPremium}
                className={`w-full p-3 border rounded-xl outline-none transition-all ${!isPremium ? 'bg-gray-100/50 cursor-not-allowed border-gray-100 text-transparent select-none' : 'bg-gray-50 focus:ring-2 focus:ring-brand'}`} 
              />
              {!isPremium && (
                 <Link to="/pricing" className="absolute inset-x-0 bottom-0 top-7 flex items-center justify-center p-3 rounded-xl hover:bg-gray-100/50 transition truncate text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer">
                    Click to unlock advanced filters
                 </Link>
              )}
              </div>
            </div>

            {/* Apply / close button for mobile */}
            <div className="lg:hidden pt-2 pb-4 px-6 bg-white border-t">
              <button
                onClick={() => setShowFilters(false)}
                className="w-full py-4 bg-brand text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 transition"
              >
                Apply Filters
              </button>
            </div>
          </aside>

        {/* Results Grid */}
        <div className="flex-grow">
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-500 font-medium">
              {loading ? 'Searching...' : `${profiles.length} Matches Found`}
            </p>
          </div>

          {error && <div className="mb-8 p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-24 lg:pb-0">
            {loading ? (
              <ProfileCardSkeleton count={6} />
            ) : profiles.map(profile => {
              const age = calculateAge(profile.date_of_birth);
              const details = [
                age ? `${age} Years` : null,
                profile.height || null,
                profile.religion || null,
                profile.city || null,
                profile.caste || null,
                profile.education || null,
                profile.income_rs ? `Rs. ${profile.income_rs}` : null,
                profile.profession || null,
              ].filter(Boolean).join(' | ');

              return (
                <Link
                  key={profile.id}
                  to={isPremium ? `/profile/${profile.id}` : `/pricing`}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border hover:shadow-xl transition-all group block"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                    <img
                      src={profile.avatar_url || `https://i.pravatar.cc/400?u=${profile.id}`}
                      alt={profile.full_name}
                      loading="lazy"
                      width="400"
                      height="533"
                      style={{ filter: !isPremium ? 'blur(12px)' : 'none' }}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://i.pravatar.cc/400?u=fallback'; }}
                    />
                    
                    {!isPremium && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-20">
                           <div className="text-center px-4">
                              <div className="w-10 h-10 rounded-full bg-brand mx-auto text-white flex items-center justify-center mb-3 shadow-[0_4px_15px_rgba(244,63,94,0.5)]">🔒</div>
                              <span className="text-xs font-black uppercase tracking-widest text-white bg-black/80 px-4 py-2 rounded-xl border border-white/20">Upgrade Elite</span>
                           </div>
                        </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-bold text-gray-900 truncate mb-1 flex items-center gap-1">
                      {profile.user_display_id || profile.full_name}
                      {profile.verification_status === 'verified' && (
                         <span className="text-blue-500" title="Verified Member">
                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                         </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {details}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {!loading && profiles.length === 0 && !error && (
            <div className="text-center py-24 bg-white rounded-[2rem] border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full mx-auto flex items-center justify-center text-2xl mb-4 shadow-inner">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Profiles Found</h3>
                <p className="text-gray-500 font-medium max-w-md mx-auto">There are no matches currently reflecting this exact criteria combo. Consider reverting your filters to view more profiles!</p>
                <p className="text-brand font-bold text-xs uppercase tracking-widest mt-6">New verified profiles coming soon</p>
            </div>
          )}

          {hasMore && !loading && (
            <div className="mt-12 text-center">
                <button 
                  onClick={loadMore}
                  className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition shadow-lg"
                >
                  Load More Profiles
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;

