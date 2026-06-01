import React, { useState } from 'react';
import { useProfiles } from '../../hooks/useProfiles';
import { Link } from 'react-router-dom';

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
    const [filters, setFilters] = useState({
        minAge: 21,
        maxAge: 35,
        religion: '',
        city: '',
        minIncome: 0,
    });

    const { profiles, loading, error, hasMore, loadMore } = useProfiles(filters);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Find Your Match</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Filters Panel */}
                <aside className="lg:w-80 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
                        <h3 className="font-bold text-lg">Filters</h3>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Age Range</label>
                            <div className="flex items-center gap-2">
                                <input type="number" name="minAge" value={filters.minAge} onChange={handleFilterChange} className="w-full p-2 border rounded" placeholder="Min" />
                                <span>-</span>
                                <input type="number" name="maxAge" value={filters.maxAge} onChange={handleFilterChange} className="w-full p-2 border rounded" placeholder="Max" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Religion</label>
                            <input type="text" name="religion" value={filters.religion} onChange={handleFilterChange} className="w-full p-2 border rounded" placeholder="e.g., Hindu" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                            <input type="text" name="city" value={filters.city} onChange={handleFilterChange} className="w-full p-2 border rounded" placeholder="e.g., Mumbai" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Income (Annual)</label>
                            <input type="number" name="minIncome" value={filters.minIncome} onChange={handleFilterChange} className="w-full p-2 border rounded" placeholder="e.g., 500000" />
                        </div>
                    </div>
                </aside>

                {/* Results Grid */}
                <div className="flex-grow">
                    {error && <div className="text-red-500 bg-red-50 p-4 rounded-lg">{error}</div>}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {profiles.map(profile => (
                            <div key={profile.id} className="bg-white rounded-xl overflow-hidden shadow-sm border hover:shadow-lg transition">
                                <Link to={`/profile/${profile.id}`}>
                                    <img 
                                      src={`https://i.pravatar.cc/400?u=${profile.id}`} 
                                      alt={`${profile.full_name}`}
                                      className="w-full h-72 object-cover"
                                    />
                                </Link>
                                <div className="p-4">
                                    <h3 className="text-lg font-bold truncate">{profile.full_name}, {calculateAge(profile.date_of_birth)}</h3>
                                    <p className="text-sm text-gray-600 truncate">{profile.profession}</p>
                                    <p className="text-sm text-gray-500 truncate">{profile.city}, {profile.state}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {loading && <p className="text-center py-8">Loading...</p>}
                    
                    {!loading && profiles.length === 0 && !error && (
                        <p className="text-center py-12 text-gray-500">No profiles match your criteria.</p>
                    )}

                    {hasMore && !loading && (
                        <div className="text-center mt-8">
                            <button onClick={loadMore} className="bg-brand text-white px-6 py-2 rounded-lg font-semibold hover:bg-rose-700 transition">
                                Load More
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchPage;