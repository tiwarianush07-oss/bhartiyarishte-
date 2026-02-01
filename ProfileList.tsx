import React, { useEffect, useState } from 'react';
import { supabase } from '../services/api';
import { Profile } from '../types';
import { useAuth } from '../context/AuthContext';
import { Lock, MapPin, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProfileList: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    // Fetch profiles directly from Supabase database
    const fetchProfiles = async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) {
        console.error('Error fetching profiles:', error);
      } else if (data) {
        setProfiles(data);
      }
    };
    fetchProfiles();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Latest Profiles</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map(profile => (
          <div key={profile.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="h-48 bg-gray-200 relative">
               {profile.photo_url ? (
                   <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                   <div className="flex items-center justify-center h-full text-gray-400">No Photo</div>
               )}
               <div className="absolute top-2 right-2 bg-saffron-600 text-white text-xs px-2 py-1 rounded">
                   {profile.sub_caste}
               </div>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900">
                 {profile.age} Yrs, {profile.gender}
              </h3>
              <div className="mt-2 text-sm text-gray-500 space-y-1">
                 <div className="flex items-center"><Briefcase size={14} className="mr-2" /> {profile.profession}</div>
                 <div className="flex items-center"><MapPin size={14} className="mr-2" /> {profile.location}</div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                 <h4 className="text-sm font-semibold text-gray-700 mb-2">Contact Details</h4>
                 {profile.is_contact_masked ? (
                    <div className="bg-gray-50 p-3 rounded text-center">
                        <Lock className="mx-auto text-gray-400 mb-1" size={20} />
                        <p className="text-xs text-gray-500">Upgrade to VIP to view Phone/Email</p>
                        <Link to="/dashboard" className="text-xs text-saffron-600 font-semibold hover:underline">View Plans</Link>
                    </div>
                 ) : (
                    <div className="space-y-1 text-sm bg-green-50 p-2 rounded border border-green-100">
                        <p><span className="font-medium">Phone:</span> {profile.contact_phone}</p>
                        <p><span className="font-medium">Email:</span> {profile.contact_email}</p>
                    </div>
                 )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};