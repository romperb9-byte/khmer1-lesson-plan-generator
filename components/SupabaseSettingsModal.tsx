import React, { useState } from 'react';
import { isSupabaseConfigured } from '../services/supabaseService';

interface SupabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const SupabaseSettingsModal: React.FC<SupabaseSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const currentUrl = localStorage.getItem('VITE_SUPABASE_URL') || (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const currentKey = localStorage.getItem('VITE_SUPABASE_ANON_KEY') || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const [url, setUrl] = useState(currentUrl);
  const [key, setKey] = useState(currentKey);
  const [copied, setCopied] = useState(false);
  const isConnected = isSupabaseConfigured();

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('VITE_SUPABASE_URL', url.trim());
    localStorage.setItem('VITE_SUPABASE_ANON_KEY', key.trim());
    alert("បានរក្សាទុកព័ត៌មាន Supabase រួចរាល់! កម្មវិធីនឹងចាប់ផ្ដើមឡើងវិញដើម្បីអនុវត្ត។");
    onSaved();
    window.location.reload();
  };

  const handleClear = () => {
    localStorage.removeItem('VITE_SUPABASE_URL');
    localStorage.removeItem('VITE_SUPABASE_ANON_KEY');
    setUrl('');
    setKey('');
    alert("បានសម្អាតទិន្នន័យកំណត់រួចរាល់!");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-emerald-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">កំណត់ Supabase Database</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ស្ថានភាព៖ {isConnected ? (
                  <span className="text-emerald-600 font-bold">● បានភ្ជាប់ជោគជ័យ</span>
                ) : (
                  <span className="text-amber-500 font-bold">● មិនទាន់ភ្ជាប់ (ប្រើ Offline)</span>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white dark:bg-slate-800 rounded-full text-gray-400 hover:text-red-500 transition-colors shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300">
            💡 <strong>ការណែនាំ៖</strong> បង្កើត Project លើ <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline font-bold">supabase.com</a> រួចចម្លង <strong>Project URL</strong> និង <strong>anon public API key</strong> មកដាក់ទីនេះ។ អ្នកក៏អាចរៀបចំ Table ដោយយក SQL ពីឯកសារ <code>supabase_schema.sql</code> ទៅ Run ក្នុង Supabase SQL Editor។
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              SUPABASE PROJECT URL (VITE_SUPABASE_URL)
            </label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              SUPABASE ANON PUBLIC KEY (VITE_SUPABASE_ANON_KEY)
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
          >
            សម្អាតទិន្នន័យ
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-sm"
            >
              បោះបង់
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md"
            >
              រក្សាទុក & ភ្ជាប់
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseSettingsModal;
