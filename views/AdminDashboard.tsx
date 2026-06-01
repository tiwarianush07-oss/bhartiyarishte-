import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Profile } from '../types';
import { supabase } from '../lib/supabase';
import {
  getUsers,
  softDeleteUser,
  restoreUser,
  hardDeleteUser,
  fullDeleteUser,
  updateUserRole,
  createAdminProfile,
  updateProfile,
  deleteStorageFile,
  getPhotosForUser,
  addPhotoForUser,
  deletePhotoForUser,
  updateProfilePhotoUrl,
  normalizeUserIdSearch,
  approveProfile,
  rejectProfile
} from '../services/adminService';
import * as XLSX from 'xlsx';
import { OCRProcessor } from '../components/admin/OCRProcessor';
import { SmartPhotoCropper } from '../components/admin/SmartPhotoCropper';
import { FormBuilder } from '../components/admin/FormBuilder';
import { MagicUploader } from '../components/MagicUploader';
import { SuperUploader } from '../components/admin/SuperUploader';
import { uploadImage } from '../services/uploadService';

// -- Icons (Material Style) --
const Icons = {
  Menu: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  Search: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Close: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Users: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  AddPerson: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
  Settings: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  ArrowBack: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Upload: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  Magic: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
};

const AdminDashboard: React.FC = () => {
  const { user, loading } = useAuth();
  
  // -- Navigation State --
  const [activeTab, setActiveTab] = useState<'users' | 'add' | 'magic' | 'settings'>('users');
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // -- Data State --
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Refetch data globally
  const refreshUsers = async () => {
    setUsersLoading(true);
    const data = await getUsers();
    setUsers(data);
    setUsersLoading(false);
  };

  useEffect(() => { refreshUsers(); }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div></div>;

  // STRICT SECURITY CHECK
  const isSuperAdminEmail = user?.email === 'bhartiyarishte03@gmail.com';
  const isAdminRole = user?.is_admin || user?.role === 'admin';
  if (!user || (!isAdminRole && !isSuperAdminEmail)) {
    return <Navigate to="/" replace />;
  }

  // Handle Full Screen Routing logic
  if (isSearchOpen) {
    return <SearchOverlay users={users} onClose={() => setIsSearchOpen(false)} onSelectUser={(u) => { setIsSearchOpen(false); setViewingUser(u); }} />;
  }

  if (editingUser) {
    return <EditUserScreen user={editingUser} onClose={() => setEditingUser(null)} onSave={() => { setEditingUser(null); refreshUsers(); if (viewingUser) setViewingUser(null); }} />;
  }

  if (viewingUser) {
    return <UserProfileScreen u={viewingUser} onClose={() => setViewingUser(null)} onEdit={() => setEditingUser(viewingUser)} refresh={refreshUsers} />;
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-100 font-sans md:flex-row">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] md:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 bg-white w-72 shadow-2xl z-[70] transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:shadow-none md:border-r border-gray-200`}>
         <div className="h-16 border-b flex items-center px-4 justify-between">
           <h2 className="font-bold text-lg text-gray-900">Admin Portal</h2>
           <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-gray-500 rounded-full hover:bg-gray-100"><Icons.Close /></button>
         </div>
         <nav className="p-4 space-y-2">
           <SidebarItem icon={<Icons.Users/>} label="All Users" active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setSidebarOpen(false); }} />
           <SidebarItem icon={<Icons.AddPerson/>} label="Add User (Manual)" active={activeTab === 'add'} onClick={() => { setActiveTab('add'); setSidebarOpen(false); }} />
           <SidebarItem icon={<Icons.Magic/>} label="Magic Uploader" active={activeTab === 'magic'} onClick={() => { setActiveTab('magic'); setSidebarOpen(false); }} />
           <SidebarItem icon={<Icons.Settings/>} label="Settings / Tools" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }} />
         </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 overflow-hidden">
        {/* Sticky Top Bar (Material) */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100 h-16 flex items-center justify-between px-4 shrink-0 transition-all">
          <div className="flex items-center gap-3">
            <button aria-label="Toggle Menu" onClick={() => setSidebarOpen(true)} className="md:hidden p-2 w-12 h-12 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-full active:scale-95 transition-transform">
              <Icons.Menu />
            </button>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {activeTab === 'users' ? 'Users' : activeTab === 'add' ? 'Create User' : activeTab === 'magic' ? 'Magic Uploader' : 'Settings'}
            </h1>
          </div>
          {activeTab === 'users' && (
            <button key="searchbtn" onClick={() => setIsSearchOpen(true)} className="p-2 w-12 h-12 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-full active:scale-95 transition-transform bg-gray-50 shadow-[0_4px_10px_rgb(0,0,0,0.03)] border">
              <Icons.Search />
            </button>
          )}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-8 relative">
           {activeTab === 'users' && <UsersScreen users={users} loading={usersLoading} onSelectUser={setViewingUser} />}
           {activeTab === 'add' && <AddProfileForm onNavigate={() => { setActiveTab('users'); refreshUsers(); }} />}
           {activeTab === 'magic' && <div className="p-4 md:p-8 max-w-4xl mx-auto"><MagicUploader /></div>}
           {activeTab === 'settings' && <SettingsScreen users={users} refreshUsers={refreshUsers} />}
        </main>

        {/* Floating Action Button (FAB) - Visible only on users tab on mobile */}
        {activeTab === 'users' && (
          <button 
             onClick={() => setActiveTab('add')}
             className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-brand text-white rounded-[16px] shadow-[0_8px_20px_rgba(244,63,94,0.4)] flex items-center justify-center active:scale-90 transition-transform z-50 hover:bg-rose-700"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
        )}

        {/* Bottom Navigation (Material) - Mobile Only */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgb(0,0,0,0.05)] flex justify-around items-center z-50 pb-safe">
           <BottomNavItem icon={<Icons.Users />} label="Users" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
           <BottomNavItem icon={<Icons.Magic />} label="Magic" active={activeTab === 'magic'} onClick={() => setActiveTab('magic')} />
           <BottomNavItem icon={<Icons.AddPerson />} label="Add" active={activeTab === 'add'} onClick={() => setActiveTab('add')} />
           <BottomNavItem icon={<Icons.Settings />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </div>
    </div>
  );
};

// -- Reusable Nav Items --
const SidebarItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3 min-h-[48px] rounded-xl font-bold transition-all ${active ? 'bg-brand/10 text-brand' : 'text-gray-600 hover:bg-gray-100'}`}>
    {icon} <span>{label}</span>
  </button>
);

const BottomNavItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-full min-h-[48px] gap-1 transition-colors ${active ? 'text-brand' : 'text-gray-500 hover:text-gray-900'}`}>
    <div className={`transition-transform ${active ? 'scale-110' : ''}`}>{icon}</div>
    <span className="text-[10px] font-bold tracking-wide">{label}</span>
  </button>
);

// ==========================================
// SCREENS
// ==========================================

// -- 1. All Users Screen (Card View) --
const UsersScreen = ({ users, loading, onSelectUser }: { users: User[], loading: boolean, onSelectUser: (u: User) => void }) => {
  const [filter, setFilter] = useState<'all'|'active'|'pending'>('all');
  
  const filtered = useMemo(() => {
    return users.filter(u => {
      if (filter === 'active') return !u.deleted_at && u.profile?.is_approved;
      if (filter === 'pending') return !u.deleted_at && !u.profile?.is_approved;
      return true;
    });
  }, [users, filter]);

  if (loading) return (
    <div className="p-4 space-y-4">
      {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse"></div>)}
    </div>
  );

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4 pt-6">
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
        {(['all', 'active', 'pending'] as const).map(f => (
          <button 
            key={f} onClick={() => setFilter(f)}
            className={`px-5 min-h-[44px] rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-shadow shadow-sm border ${filter === f ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200'}`}
          >
            {f} ({
              f === 'all' ? users.length :
              f === 'active' ? users.filter(u => !u.deleted_at && u.profile?.is_approved).length :
              users.filter(u => !u.deleted_at && !u.profile?.is_approved).length
            })
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(u => (
          <div 
            key={u.id} 
            onClick={() => onSelectUser(u)}
            className="bg-white rounded-[16px] shadow-[0_4px_15px_rgb(0,0,0,0.03)] border border-gray-100 p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] active:bg-gray-50 transition-all min-h-[88px]"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 shrink-0 overflow-hidden relative shadow-inner">
               {u.profile?.avatar_url ? (
                  <img src={u.profile.avatar_url} alt="" className="w-full h-full object-cover" loading="lazy" />
               ) : (
                  <div className="flex items-center justify-center h-full text-xl font-black text-gray-400">{u.profile?.full_name?.[0] || 'U'}</div>
               )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-[15px] truncate">{u.profile?.full_name || 'Incomplete Profile'}</h3>
              <p className="text-xs text-brand font-black tracking-widest mt-0.5">{u.profile?.user_display_id || 'NO ID'}</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{u.email}</p>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-2">
               {u.deleted_at ? (
                 <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(243,24,59,0.5)]"></span>
               ) : u.profile?.is_approved ? (
                 <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
               ) : (
                 <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
               )}
               <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
         <div className="py-20 text-center font-bold text-gray-400">No profiles found in this category.</div>
      )}
    </div>
  );
};

// -- 2. Search Overlay (Full Screen) --
const SearchOverlay = ({ users, onClose, onSelectUser }: { users: User[], onClose: () => void, onSelectUser: (u: User) => void }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return users.filter(u => {
      if (q.startsWith('br')) {
         const normId = normalizeUserIdSearch(q);
         return normId && (u.profile?.user_display_id || '').toUpperCase().includes(normId);
      } else if (q.includes('@')) {
         return (u.email?.toLowerCase() || '').includes(q);
      } else {
         return (u.profile?.full_name?.toLowerCase() || '').includes(q) || (u.profile?.phone_number || '').includes(q);
      }
    }).slice(0, 20); // max 20 results for speed
  }, [users, query]);

  return (
    <div className="fixed inset-0 bg-gray-50 z-[100] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white shadow-md p-4 flex gap-3 items-center sticky top-0 z-10 pt-safe">
        <button onClick={onClose} className="p-2 -ml-2 text-gray-600 rounded-full hover:bg-gray-100 min-h-[48px]"><Icons.ArrowBack /></button>
        <input 
          ref={inputRef}
          type="text" 
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, ID, or email..."
          className="flex-1 bg-transparent text-lg font-medium outline-none text-gray-900 border-none px-2 min-h-[48px]"
        />
        {query && <button onClick={() => setQuery('')} className="p-2 text-gray-400"><Icons.Close/></button>}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {query && results.length === 0 && <div className="p-8 text-center text-gray-400 font-bold">No results found for "{query}"</div>}
        {results.map(u => (
          <div key={u.id} onClick={() => onSelectUser(u)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer active:scale-95 transition-transform min-h-[72px]">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0">
               {u.profile?.avatar_url ? <img src={u.profile.avatar_url} className="w-full h-full object-cover" loading="lazy"/> : <div className="h-full flex items-center justify-center font-black text-gray-400">{u.profile?.full_name?.[0] || 'U'}</div>}
            </div>
            <div className="flex-1 min-w-0">
               <h3 className="font-bold text-gray-900 truncate">{u.profile?.full_name || 'Incomplete'}</h3>
               <p className="text-xs text-brand font-black">{u.profile?.user_display_id || 'NO ID'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// -- 3. User Profile Detail (Full Screen) --
const UserProfileScreen = ({ u, onClose, onEdit, refresh }: { u: User, onClose: () => void, onEdit: () => void, refresh: () => void }) => {
   const [deleting, setDeleting] = useState(false);
   const galleryUrls: string[] = (u.profile as any)?.gallery_urls || [];

   const handleApprove = async () => { await approveProfile(u.id); refresh(); onClose(); };
   const handleReject = async () => { if(window.confirm('Reject profile?')) { await rejectProfile(u.id); refresh(); onClose(); } };
   const handleSuspend = async () => { if(window.confirm('Suspend profile?')) { await softDeleteUser(u.id); refresh(); onClose(); } };
   const handleRestore = async () => { await restoreUser(u.id); refresh(); onClose(); };

   // Double-confirm nuclear delete via Edge Function
   const handleNuclearDelete = async () => {
     if (!window.confirm(`⚠️ PERMANENTLY delete ${u.profile?.full_name || 'this user'}?\n\nThis will remove their account, all photos, and all data. This CANNOT be undone.`)) return;
     if (!window.confirm('FINAL CONFIRMATION: Type confirms this is irreversible. Proceed?')) return;
     setDeleting(true);
     const res = await fullDeleteUser(u.id);
     setDeleting(false);
     if (res.success) { refresh(); onClose(); }
     else { alert('Delete failed: ' + (res.message || 'Unknown error')); }
   };

   return (
     <div className="fixed inset-0 bg-white z-[90] flex flex-col overflow-y-auto animate-in fade-in slide-in-from-right-8 duration-300">
       <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 p-4 flex items-center justify-between border-b shadow-sm pt-safe">
         <button onClick={onClose} className="p-2 -ml-2 text-gray-600 rounded-full bg-gray-100/50 hover:bg-gray-100 active:scale-90 transition-transform"><Icons.ArrowBack /></button>
         <h2 className="font-bold text-gray-900">Profile Details</h2>
         <button onClick={onEdit} className="px-4 py-2 bg-brand/10 text-brand rounded-full text-sm font-bold active:scale-95 transition-transform">Edit</button>
       </div>
       <div className="max-w-xl mx-auto w-full p-6 pb-32">
         {/* Photo Header */}
         <div className="flex flex-col items-center mb-8">
            <div className="w-32 h-32 rounded-full border-4 border-gray-50 shadow-lg overflow-hidden mb-4 bg-gray-100">
               {u.profile?.avatar_url ? <img src={u.profile.avatar_url} className="w-full h-full object-cover"/> : <div className="h-full flex items-center justify-center font-black text-gray-400 text-4xl">{u.profile?.full_name?.[0] || 'U'}</div>}
            </div>
            <h1 className="text-2xl font-black text-gray-900 text-center">{u.profile?.full_name || 'Incomplete Profile'}</h1>
            <p className="text-sm font-mono text-brand font-bold mt-1 bg-rose-50 px-3 py-1 rounded-full">{u.profile?.user_display_id || 'NO ID'}</p>
         </div>

         {/* Gallery Preview */}
         {galleryUrls.length > 0 && (
           <div className="mb-8">
             <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 mb-3">Gallery ({galleryUrls.length}/6)</h3>
             <div className="grid grid-cols-3 gap-2">
               {galleryUrls.map((url, i) => (
                 <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 border-white shadow-sm">
                   <img src={url} alt={`Photo ${i+1}`} className="w-full h-full object-cover" loading="lazy" />
                 </div>
               ))}
             </div>
           </div>
         )}

         {/* Info Cards */}
         <div className="space-y-4">
           <InfoRow label="Email" value={u.email || '—'} />
           <InfoRow label="Phone" value={u.profile?.phone_number || '—'} isPhone={true} />
           <InfoRow label="Status" value={u.deleted_at ? 'Suspended' : (u.profile?.is_approved ? 'Approved' : 'Pending')} />
           <InfoRow label="Location" value={`${u.profile?.city || '—'}, ${u.profile?.state || '—'}`} />
           <InfoRow label="Religion / Caste" value={`${u.profile?.religion || '—'} / ${u.profile?.caste || '—'}`} />
           <InfoRow label="Gender / Age" value={`${u.profile?.gender || '—'} / ${u.profile?.date_of_birth ? new Date().getFullYear() - new Date(u.profile.date_of_birth).getFullYear() : '—'}`} />
           <InfoRow label="Education" value={u.profile?.education || '—'} />
           <InfoRow label="Profession" value={u.profile?.profession || '—'} />
         </div>

         {/* Admin Action Buttons */}
         <div className="mt-12 space-y-3">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 mb-4">Danger Zone & Actions</h3>
            {!u.deleted_at && !u.profile?.is_approved && (
               <ActionButton onClick={handleApprove} label="Approve Profile" color="bg-emerald-600 text-white shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:bg-emerald-700" />
            )}
            {!u.deleted_at && u.profile?.is_approved && (
               <ActionButton onClick={handleReject} label="Reject Profile" color="bg-amber-100 text-amber-700 hover:bg-amber-200" />
            )}
            {u.deleted_at ? (
               <ActionButton onClick={handleRestore} label="Reactivate Profile" color="bg-emerald-100 text-emerald-700 hover:bg-emerald-200" />
            ) : (
               <ActionButton onClick={handleSuspend} label="Suspend Account" color="bg-rose-100 text-rose-700 hover:bg-rose-200" />
            )}
            <div className="pt-4 mt-4 border-t border-dashed">
               <ActionButton onClick={handleNuclearDelete} label={deleting ? 'Deleting...' : '🗑️ Nuclear Delete (Permanent)'} color="bg-white border-2 border-red-500 text-red-600 hover:bg-red-50" />
            </div>
         </div>
       </div>
     </div>
   );
};

const InfoRow = ({ label, value, isPhone }: any) => (
  <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center shadow-[0_2px_8px_rgb(0,0,0,0.02)] border border-gray-100">
     <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">{label}</span>
     <div className="flex items-center gap-3">
       <span className="font-semibold text-gray-900 text-sm text-right">{value}</span>
       {isPhone && value !== '—' && (
          <a href={`https://wa.me/${value.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center p-1.5 shadow-sm active:scale-90 transition-transform">
            <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766 0 1.252.326 2.476.946 3.541l-1 3.65 3.733-.98c1.026.568 2.193.868 3.376.868 3.181 0 5.767-2.586 5.768-5.766 0-3.181-2.586-5.766-5.768-5.766zm3.326 8.362c-.183.513-.974.966-1.428 1.011-.454.045-1.023.111-3.235-.807-2.651-1.101-4.329-3.8-4.462-3.982-.133-.183-1.066-1.419-1.066-2.706 0-1.287.665-1.921.902-2.164.237-.243.512-.304.685-.304.173 0 .346.002.502.011.162.008.384-.064.597.457.217.531.745 1.821.815 1.961.07.14.116.304.025.486-.091.183-.138.293-.274.453-.136.161-.284.341-.409.486-.14.161-.29.336-.118.632.172.296.765 1.264 1.642 2.046.994.887 2.013 1.157 2.309 1.297.296.14.471.118.647-.083.176-.201.761-.887.965-1.192.204-.305.408-.254.685-.15.277.104 1.748.824 2.049.974.3.151.503.226.575.352.072.126.072.73-.111 1.243z"/></svg>
          </a>
       )}
     </div>
  </div>
);

const ActionButton = ({ label, onClick, color }: any) => (
  <button onClick={onClick} className={`w-full py-4 min-h-[48px] rounded-2xl font-bold text-sm tracking-wide ${color} active:scale-[0.98] transition-all`}>
    {label}
  </button>
);

// -- 4. Edit User Modal (Full Screen) -- with Gallery --
const EditUserScreen = ({ user, onClose, onSave }: { user: User, onClose: () => void, onSave: () => void }) => {
   const MAX_GALLERY = 6;
   const [form, setForm] = useState<any>({});
   const [saving, setSaving] = useState(false);
   const [err, setErr] = useState<string | null>(null);
   const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
   const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
   const slotRefs = useRef<(HTMLInputElement | null)[]>([]);

   useEffect(() => {
     if(user?.profile) {
       setForm({...user.profile});
       setGalleryUrls((user.profile as any)?.gallery_urls || []);
     }
   }, [user]);

   const handleSlotUpload = async (index: number, file: File) => {
     setUploadingSlot(index);
     setErr(null);
     try {
       // If replacing, delete old file from storage
       if (galleryUrls[index]) {
         await deleteStorageFile(galleryUrls[index]);
       }
       const url = await uploadImage(file, user.id, 'avatars');
       const updated = [...galleryUrls];
       if (index < updated.length) { updated[index] = url; }
       else { updated.push(url); }
       setGalleryUrls(updated);
     } catch (e: any) {
       setErr('Photo upload failed: ' + e.message);
     } finally {
       setUploadingSlot(null);
     }
   };

   const handleSlotDelete = async (index: number) => {
     if (!window.confirm('Remove this photo?')) return;
     const url = galleryUrls[index];
     if (url) await deleteStorageFile(url);
     setGalleryUrls(galleryUrls.filter((_, i) => i !== index));
   };

   const handleSave = async () => {
     setSaving(true);
     setErr(null);
     const payload = {
       ...form,
       gallery_urls: galleryUrls,
       avatar_url: galleryUrls[0] || form.avatar_url || null,
     };
     
     const cleanPayload = Object.fromEntries(
       Object.entries(payload).filter(([_, v]) => v !== "" && v !== null)
     );

     const res = await updateProfile(user.id, cleanPayload);
     setSaving(false);
     if (res.success) { onSave(); }
     else { setErr(res.message || 'Error updating profile'); }
   };

   return (
     <div className="fixed inset-0 bg-white z-[95] flex flex-col overflow-y-auto pt-safe">
       <div className="sticky top-0 bg-white/90 backdrop-blur border-b p-4 flex justify-between items-center z-10 shadow-sm">
         <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500 min-h-[48px]"><Icons.ArrowBack /></button>
         <h2 className="font-bold text-gray-900">Edit Profile</h2>
         <button onClick={handleSave} disabled={saving} className="font-black text-brand px-4 py-2 bg-rose-50 rounded-full text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
       </div>
       <div className="p-6 max-w-xl mx-auto w-full space-y-5 pb-32">
          {err && <div className="p-4 bg-rose-50 text-rose-700 font-bold text-sm rounded-xl">{err}</div>}

          {/* 6-Photo Gallery Grid */}
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Photo Gallery ({galleryUrls.length}/{MAX_GALLERY})</span>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: MAX_GALLERY }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden relative group border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-brand/50 transition-all"
                     onClick={() => !galleryUrls[i] && slotRefs.current[i]?.click()}
                     onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                     onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                     onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); }}
                     onDrop={(e) => {
                       e.preventDefault();
                       e.stopPropagation();
                       const file = e.dataTransfer.files?.[0];
                       if (file) handleSlotUpload(i, file);
                     }}>
                  {uploadingSlot === i ? (
                    <div className="animate-spin h-6 w-6 border-b-2 border-brand rounded-full"></div>
                  ) : galleryUrls[i] ? (
                    <>
                      <img src={galleryUrls[i]} alt="" className="w-full h-full object-cover" />
                      {i === 0 && <div className="absolute top-1 left-1 bg-brand text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full">Avatar</div>}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); slotRefs.current[i]?.click(); }} className="p-1.5 bg-white rounded-full shadow" title="Replace"><Icons.Upload /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleSlotDelete(i); }} className="p-1.5 bg-rose-100 rounded-full shadow" title="Delete"><Icons.Close /></button>
                      </div>
                    </>
                  ) : (
                    <span className="text-2xl text-gray-300">+</span>
                  )}
                  <input ref={(el) => { slotRefs.current[i] = el; }} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if(f) handleSlotUpload(i, f); e.target.value=''; }} />
                </div>
              ))}
            </div>
          </div>

          {/* All profile fields */}
          <MaterialInput label="Full Name" value={form.full_name || ''} onChange={(v: string) => setForm({...form, full_name: v})} />
          <MaterialInput label="Email" value={form.email || ''} onChange={(v: string) => setForm({...form, email: v})} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MaterialInput label="Phone Number" value={form.phone_number || ''} onChange={(v: string) => setForm({...form, phone_number: v})} type="tel" />
            <MaterialInput label="Date of Birth" value={form.date_of_birth || ''} onChange={(v: string) => setForm({...form, date_of_birth: v})} type="date" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MaterialInput label="City" value={form.city || ''} onChange={(v: string) => setForm({...form, city: v})} />
            <MaterialInput label="State" value={form.state || ''} onChange={(v: string) => setForm({...form, state: v})} />
          </div>
          <MaterialInput label="Address" value={form.address || form.current_address || ''} onChange={(v: string) => setForm({...form, address: v, current_address: v})} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MaterialInput label="Religion" value={form.religion || ''} onChange={(v: string) => setForm({...form, religion: v})} />
            <MaterialInput label="Mother Tongue" value={form.mother_tongue || ''} onChange={(v: string) => setForm({...form, mother_tongue: v})} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MaterialInput label="Caste" value={form.caste || ''} onChange={(v: string) => setForm({...form, caste: v})} />
            <MaterialInput label="Sub-Caste" value={form.sub_caste || ''} onChange={(v: string) => setForm({...form, sub_caste: v})} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MaterialInput label="Education" value={form.education || ''} onChange={(v: string) => setForm({...form, education: v})} />
            <MaterialInput label="Occupation/Profession" value={form.occupation || form.profession || ''} onChange={(v: string) => setForm({...form, occupation: v, profession: v})} />
          </div>
          <MaterialInput label="Height" value={form.height || ''} onChange={(v: string) => setForm({...form, height: v})} />
          <MaterialInput label="Marital Status" value={form.marital_status || ''} onChange={(v: string) => setForm({...form, marital_status: v})} />
          <MaterialInput label="Annual Income" value={form.annual_income || form.income_rs || ''} onChange={(v: string) => setForm({...form, annual_income: v, income_rs: v})} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MaterialInput label="Father's Occupation" value={form.fathers_occupation || ''} onChange={(v: string) => setForm({...form, fathers_occupation: v})} />
            <MaterialInput label="Mother's Occupation" value={form.mothers_occupation || ''} onChange={(v: string) => setForm({...form, mothers_occupation: v})} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MaterialInput label="Brothers" value={form.brothers || ''} onChange={(v: string) => setForm({...form, brothers: v})} />
            <MaterialInput label="Sisters" value={form.sisters || ''} onChange={(v: string) => setForm({...form, sisters: v})} />
          </div>
       </div>
     </div>
   );
};

// -- 5. Add Profile Form (Mobile friendly) --
const AddProfileForm = ({ onNavigate }: { onNavigate: () => void }) => {
  const [formData, setFormData] = useState<Record<string, any>>({ full_name: '', email: '', phone: '', city: '', avatar_url: '' });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{text: string, type: 'error'|'success'} | null>(null);

  const handleSubmit = async () => {
    setLoading(true); setMsg(null);
    const email = formData.email || `user_${Date.now()}@placeholder.local`;
    const tempPass = Math.random().toString(36).slice(-8) + "Az1!";

    const res = await createAdminProfile({
      email, password: tempPass, name: formData.full_name || 'Admin Created', role: 'user', photos: [formData.avatar_url], phone: formData.phone || undefined
    });

    if (!res.success) {
      setMsg({ text: res.message || 'Failed', type: 'error' });
      setLoading(false); return;
    }

    const { data: usersData } = await supabase.from('users').select('id').eq('email', email).single();
    if(usersData?.id) {
       let finalPhotoUrl = formData.avatar_url;
       if (photoFile) {
         try {
           finalPhotoUrl = await uploadImage(photoFile, usersData.id, 'avatars');
         } catch (e: any) {
           console.error("Photo upload failed:", e);
         }
       }
       const profilePayload: any = { avatar_url: finalPhotoUrl };
       const validKeys = ['city', 'state', 'date_of_birth', 'gender', 'religion', 'caste', 'sub_caste', 'education', 'profession', 'occupation', 'height', 'marital_status', 'annual_income', 'address', 'mother_tongue'];
       
       validKeys.forEach(key => {
         if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
           profilePayload[key] = formData[key];
         }
       });

       await supabase.from('profiles').update(profilePayload).eq('user_id', usersData.id);
    }
    
    setMsg({ text: `Success! Password: ${tempPass}`, type: 'success' });
    setLoading(false);
    setTimeout(() => { setFormData({ full_name: '', email: '', phone: '', city: '', avatar_url: '' }); onNavigate(); }, 2000);
  };

  const handleExtracted = (data: any) => {
     setFormData(prev => ({
        ...prev,
        ...data
     }));
     setMsg({ text: 'Fields auto-filled successfully from image!', type: 'success' });
  };

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8 space-y-6 pt-6 animate-in fade-in">
      
      {/* AI OCR Autofill Module */}
      <OCRProcessor onExtracted={handleExtracted} />
      
      {/* AI Photo Processing Module */}
      <SmartPhotoCropper onCropped={(url) => setFormData(prev => ({ ...prev, avatar_url: url }))} />

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Profile</h2>
        {msg && <div className={`p-4 rounded-xl mb-6 text-sm font-bold ${msg.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-green-50 text-green-700'}`}>{msg.text}</div>}
        
        <div className="space-y-5">
           <MaterialInput label="Full Name" value={formData.full_name} onChange={v => setFormData({...formData, full_name: v})} />
           <MaterialInput label="Email (Optional)" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
           <MaterialInput label="Phone (Optional)" type="tel" value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} />
           <MaterialInput label="City" value={formData.city} onChange={(v: string) => setFormData({...formData, city: v})} />
           <ImageUploadInput
             currentUrl={formData.avatar_url || (photoFile ? URL.createObjectURL(photoFile) : undefined)}
             onFileSelect={setPhotoFile}
           />
        </div>

        <button onClick={handleSubmit} disabled={loading} className="w-full mt-8 bg-brand text-white py-4 rounded-2xl font-bold shadow-[0_8px_20px_rgba(244,63,94,0.3)] min-h-[48px] active:scale-95 transition-all">
           {loading ? 'Creating...' : 'Create User'}
        </button>
      </div>
    </div>
  );
};

// -- 6. Settings Screen (Bulk Upload & WA Template) --
const SchemaList = () => {
  const [schemas, setSchemas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchemas = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try the RPC first (if migration 09 has been applied)
      const { data, error: rpcError } = await supabase.rpc('get_website_schemas');
      if (!rpcError && data) {
        setSchemas(data.map((item: any) => `${item.frontend_name} (${item.schema_name})`));
      } else {
        // Fallback: list known public tables by querying each one for existence
        const knownTables = [
          { name: 'profiles', label: 'User Profiles' },
          { name: 'users', label: 'User Accounts' },
          { name: 'interests', label: 'User Interests' },
          { name: 'photos', label: 'Profile Photos' },
          { name: 'chat_conversations', label: 'Chat Conversations' },
          { name: 'chat_messages', label: 'Chat Messages' },
          { name: 'chat_participants', label: 'Chat Participants' },
          { name: 'partner_preferences', label: 'Partner Preferences' },
          { name: 'shortlists', label: 'Shortlists' },
          { name: 'profile_boosts', label: 'Profile Boosts' },
          { name: 'audit_logs', label: 'Audit Logs' },
          { name: 'success_stories', label: 'Success Stories' },
        ];

        const verified: string[] = [];
        for (const t of knownTables) {
          const { error: tableErr } = await supabase.from(t.name).select('id', { count: 'exact', head: true }).limit(0);
          if (!tableErr || tableErr.code === 'PGRST116' || tableErr.code === '42501') {
            // Table exists (even if RLS blocks access, the table is found)
            verified.push(`${t.label} (${t.name})`);
          }
        }
        if (verified.length > 0) {
          setSchemas(verified);
        } else {
          setError('Could not detect database tables. RPC function may not be deployed.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemas();
  }, []);

  return (
    <div className="space-y-3">
      {loading && <div className="text-sm text-gray-500">Loading schemas...</div>}
      {error && (
        <div className="text-sm text-rose-600 font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">
          Error: {error}
        </div>
      )}
      {!loading && !error && schemas.length === 0 && (
        <div className="text-sm text-gray-400">No schemas found.</div>
      )}
      {!loading && !error && schemas.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {schemas.map((name) => (
            <div key={name} className="bg-gray-50 px-3 py-2 rounded-xl text-xs font-mono font-semibold text-gray-700 border border-gray-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
              {name}
            </div>
          ))}
        </div>
      )}
      <button 
        onClick={fetchSchemas}
        className="w-full mt-2 text-xs font-bold text-brand hover:underline text-left"
      >
        Refresh List
      </button>
    </div>
  );
};

const SettingsScreen = ({ users, refreshUsers }: { users: User[], refreshUsers: () => void }) => {
   const [waTemplate, setWaTemplate] = useState('Hi {name}, welcome to Bhartiya Rishtey. Your profile is under review.');
   const [saved, setSaved] = useState(false);
   
   useEffect(() => {
     setWaTemplate(localStorage.getItem('admin_wa_template') || 'Hi {name}, welcome to Bhartiya Rishtey. Your profile is under review.');
   }, []);

   const saveTemplate = () => { localStorage.setItem('admin_wa_template', waTemplate); setSaved(true); setTimeout(() => setSaved(false), 2000); };

   const handleExportCSV = () => {
    const csvData = users.map(u => ({ 'User ID': u.profile?.user_display_id || '', 'Name': u.profile?.full_name || '', 'Email': u.email || '', 'Status': u.deleted_at ? 'Suspended' : 'Active' }));
    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Profiles");
    XLSX.writeFile(wb, `Bhartiya_Rishtey_Backup.csv`);
   };

   return (
      <div className="max-w-xl mx-auto p-4 md:p-8 space-y-6 pt-6 animate-in fade-in">
        {/* Bulk Export Card */}
         <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Export Data</h2>
            <p className="text-sm text-gray-500 mb-6">Download a complete CSV backup of all users in the system.</p>
            <button onClick={handleExportCSV} className="w-full bg-emerald-50 text-emerald-700 py-3 rounded-xl font-bold border border-emerald-100 min-h-[48px] active:scale-95 transition-transform flex items-center justify-center gap-2">
               Download Full CSV
            </button>
         </div>

         {/* Database Schemas Card */}
         <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Database Schemas</h2>
            <p className="text-sm text-gray-500 mb-4">Safely view all active database schemas using custom RPC bridge.</p>
            <SchemaList />
         </div>

         {/* WA Template Card */}
         <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-lg font-bold text-gray-900">WhatsApp Template</h2>
               {saved && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Saved!</span>}
            </div>
            <p className="text-xs text-gray-500 mb-4">Use {"{name}"} to inject the user's name automatically.</p>
            <textarea value={waTemplate} onChange={e => setWaTemplate(e.target.value)} rows={4} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-brand text-sm resize-none"></textarea>
            <button onClick={saveTemplate} className="w-full mt-4 bg-brand/10 text-brand py-3 rounded-xl font-bold min-h-[48px] active:scale-95 transition-transform">
               Save Template
            </button>
         </div>

         {/* Form Builder Card */}
         <div className="w-full">
            <FormBuilder />
         </div>
      </div>
   );
};

// -- Reusable Large Material Input --
const MaterialInput = ({ label, type = 'text', value, onChange }: any) => (
  <div className="bg-gray-50 rounded-2xl py-2.5 px-4 border border-gray-100 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10 transition-all">
    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-transparent border-none outline-none py-1.5 text-gray-900 font-medium text-base min-h-[30px]" />
  </div>
);

// -- Reusable File Input with Preview --
const ImageUploadInput = ({ currentUrl, onFileSelect }: { currentUrl?: string, onFileSelect: (f: File | null) => void }) => {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      setPreview(URL.createObjectURL(file));
    } else {
      onFileSelect(null);
      setPreview(currentUrl || null);
    }
  };

  return (
    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center gap-4">
      <div 
        className="w-16 h-16 rounded-xl bg-gray-200 overflow-hidden shrink-0 border-2 border-white shadow-sm flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <Icons.Upload />
        )}
      </div>
      <div className="flex-1">
        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Profile Photo</span>
        <button 
          onClick={() => inputRef.current?.click()}
          className="text-sm font-bold text-brand hover:underline"
        >
          Choose File
        </button>
        <input 
          type="file" 
          accept="image/*" 
          ref={inputRef} 
          hidden 
          onChange={handleFileChange} 
        />
      </div>
    </div>
  );
};

export default AdminDashboard;

