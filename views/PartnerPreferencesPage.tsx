import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getPartnerPreferences, savePartnerPreferences, PartnerPreferences } from '../services/profileService';

// Helper components
const FormField = ({ label, children }: { label: string; children?: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
    {children}
  </div>
);

const MultiCheckboxField = ({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (val: string) => void;
}) => (
  <FormField label={label}>
    <div className="space-y-2 pt-2">
      {options.map((option) => (
        <label key={option} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 accent-brand"
            checked={selected.includes(option)}
            onChange={() => onChange(option)}
          />
          {option}
        </label>
      ))}
    </div>
  </FormField>
);

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-brand outline-none transition font-medium text-gray-700';

const PartnerPreferencesPage: React.FC = () => {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<PartnerPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // --- BUG FIX: Was using hardcoded 'current_user' string instead of real user ID ---
  useEffect(() => {
    const loadPrefs = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate('/login');
          return;
        }

        setUserId(user.id);
        const data = await getPartnerPreferences(user.id);
        setPrefs(data);
      } catch (err) {
        console.error('[PartnerPreferences] Load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPrefs();
  }, [navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefs || !userId) return;
    setSaving(true);
    setSaveError('');
    try {
      const result = await savePartnerPreferences(userId, prefs);
      if (!result.success) {
        setSaveError(result.error || 'Failed to save preferences.');
        return;
      }
      navigate('/my-profile');
    } catch (err: any) {
      setSaveError(err.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleMultiSelectChange = (field: keyof PartnerPreferences, value: string) => {
    setPrefs((prev) => {
      if (!prev) return null;
      const currentValues = (prev[field] as string[]) || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];
      return { ...prev, [field]: newValues };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-10 w-10 border-4 border-brand border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!prefs) {
    return (
      <div className="text-center p-12 text-rose-500 font-bold">
        Could not load preferences. Please try refreshing.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Partner Preferences</h1>
      <p className="text-gray-500 mb-8">
        Tell us what you're looking for. This helps our AI find the best matches for you.
      </p>

      <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl border shadow-sm space-y-10">
        <section>
          <h3 className="text-lg font-bold text-brand mb-4">Basic Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Age Range">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={18}
                  max={80}
                  value={prefs.min_age}
                  onChange={(e) => setPrefs({ ...prefs, min_age: +e.target.value })}
                  className={inputClass}
                />
                <span className="text-gray-400 font-bold">to</span>
                <input
                  type="number"
                  min={18}
                  max={80}
                  value={prefs.max_age}
                  onChange={(e) => setPrefs({ ...prefs, max_age: +e.target.value })}
                  className={inputClass}
                />
              </div>
            </FormField>
            <MultiCheckboxField
              label="Marital Status"
              options={['Never Married', 'Divorced', 'Widowed']}
              selected={prefs.marital_statuses}
              onChange={(val) => handleMultiSelectChange('marital_statuses', val)}
            />
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold text-brand mb-4">Religion &amp; Community</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MultiCheckboxField
              label="Religion"
              options={['Hindu', 'Muslim', 'Sikh', 'Christian', "Doesn't Matter"]}
              selected={prefs.religions}
              onChange={(val) => handleMultiSelectChange('religions', val)}
            />
            <FormField label="Caste / Community (Optional)">
              <input
                type="text"
                placeholder="e.g., Brahmin, Jat, Rajput"
                value={prefs.castes[0] || ''}
                onChange={(e) => setPrefs({ ...prefs, castes: e.target.value ? [e.target.value] : [] })}
                className={inputClass}
              />
            </FormField>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold text-brand mb-4">Education</h3>
          <MultiCheckboxField
            label="Preferred Education"
            options={['10th / SSC', '12th / HSC', 'Graduate', 'Post Graduate', 'Doctorate', "Doesn't Matter"]}
            selected={prefs.educations}
            onChange={(val) => handleMultiSelectChange('educations', val)}
          />
        </section>

        {saveError && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-sm font-bold">
            {saveError}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-10 py-3.5 bg-brand text-white rounded-xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-700 transition disabled:opacity-50 uppercase tracking-widest text-sm"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PartnerPreferencesPage;