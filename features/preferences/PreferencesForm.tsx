
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

interface Preferences {
  user_id: string;
  min_age: number;
  max_age: number;
  min_height?: string;
  max_height?: string;
  religions?: string[];
  castes?: string[];
  educations?: string[];
  // Supabase schema has a 'professions' field
  professions?: string[];
}

const defaultPrefs: Omit<Preferences, 'user_id'> = {
  min_age: 21,
  max_age: 35,
  religions: [],
  castes: [],
  educations: [],
  professions: []
};

const PreferencesForm: React.FC = () => {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data, error } = await supabase
        .from('partner_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore 'no rows found' error
        throw error;
      }
      
      setPreferences(data || { ...defaultPrefs, user_id: user.id });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferences) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not found");

        const { error } = await supabase
            .from('partner_preferences')
            .upsert({ ...preferences, user_id: user.id }, { onConflict: 'user_id' });
        
        if (error) throw error;
        setSuccess("Preferences saved successfully!");
        setTimeout(() => setSuccess(null), 3000);

    } catch (err: any) {
        setError(err.message);
    } finally {
        setSaving(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setPreferences(prev => prev ? { ...prev, [name]: value } : null);
  }

  if (loading) return <div>Loading preferences...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!preferences) return <div>Could not load preference data.</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold">Partner Preferences</h2>
      
      <div>
          <label className="block font-medium">Age Range</label>
          <div className="flex items-center gap-4">
              <input type="number" name="min_age" value={preferences.min_age} onChange={handleInputChange} className="w-full p-2 border rounded" />
              <span>to</span>
              <input type="number" name="max_age" value={preferences.max_age} onChange={handleInputChange} className="w-full p-2 border rounded" />
          </div>
      </div>

       <div>
          <label className="block font-medium">Religion (comma-separated)</label>
          <input 
            type="text" 
            name="religions" 
            value={(preferences.religions || []).join(', ')}
            onChange={e => setPreferences(prev => prev ? {...prev, religions: e.target.value.split(',').map(s => s.trim())} : null)}
            className="w-full p-2 border rounded"
            placeholder="e.g., Hindu, Muslim"
            />
       </div>

        <div>
          <label className="block font-medium">Caste (comma-separated)</label>
          <input 
            type="text" 
            name="castes" 
            value={(preferences.castes || []).join(', ')}
            onChange={e => setPreferences(prev => prev ? {...prev, castes: e.target.value.split(',').map(s => s.trim())} : null)}
            className="w-full p-2 border rounded"
            placeholder="e.g., Brahmin, Rajput"
            />
       </div>
      
      {success && <div className="p-3 bg-green-100 text-green-700 rounded">{success}</div>}

      <button type="submit" disabled={saving} className="bg-brand text-white px-6 py-2 rounded-lg font-semibold hover:bg-rose-700 transition disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </form>
  );
};

export default PreferencesForm;
