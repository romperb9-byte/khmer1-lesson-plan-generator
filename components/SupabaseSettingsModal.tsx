import React, { useState, useEffect } from 'react';
import { isSupabaseConfigured } from '../services/supabaseService';

interface SupabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const REQUIRED_PIN = "168";

const SupabaseSettingsModal: React.FC<SupabaseSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const currentUrl = localStorage.getItem('VITE_SUPABASE_URL') || (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const currentKey = localStorage.getItem('VITE_SUPABASE_ANON_KEY') || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const [url, setUrl] = useState(currentUrl);
  const [key, setKey] = useState(currentKey);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  
  const isConnected = isSupabaseConfigured();

  // Reset lock state when modal is closed or opened
  useEffect(() => {
    if (!isOpen) {
      setIsUnlocked(false);
      setPinInput('');
      setPinError(null);
    } else {
      setUrl(localStorage.getItem('VITE_SUPABASE_URL') || (import.meta as any).env?.VITE_SUPABASE_URL || '');
      setKey(localStorage.getItem('VITE_SUPABASE_ANON_KEY') || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === REQUIRED_PIN) {
      setIsUnlocked(true);
      setPinError(null);
    } else {
      setPinError("ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ! សូមព្យាយាមម្ដងទៀត។");
    }
  };

  const handleSave = () => {
    localStorage.setItem('VITE_SUPABASE_URL', url.trim());
    localStorage.setItem('VITE_SUPABASE_ANON_KEY', key.trim());
    alert("បានរក្សាទុកព័ត៌មាន Supabase រួចរាល់! កម្មវិធីនឹងចាប់ផ្ដើមឡើងវិញដើម្បីអនុវត្ត។");
    onSaved();
    window.location.reload();
  };

  const handleClear = () => {
    if (window.confirm("តើអ្នកពិតជាចង់សម្អាតទិន្នន័យកំណត់ Supabase មែនទេ?")) {
      localStorage.removeItem('VITE_SUPABASE_URL');
      localStorage.removeItem('VITE_SUPABASE_ANON_KEY');
      setUrl('');
      setKey('');
      alert("បានសម្អាតទិន្នន័យកំណត់រួចរាល់!");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-emerald-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">កំណត់ Supabase Database</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ស្ថានភាព៖ {isConnected ? (
                  <span className="text-emerald-600 font-bold">● បានភ្ជាប់ជោគជ័យ</span>
                ) : (
                  <span className="text-amber-500 font-bold">● មិនទាន់ភ្ជាប់ (ប្រើ Offline)</span>
                )}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white dark:bg-slate-800 rounded-full text-gray-400 hover:text-red-500 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Locked View (Password Required) */}
        {!isUnlocked ? (
          <form onSubmit={handleUnlock} className="p-8 flex flex-col items-center text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">សុវត្ថិភាព៖ បញ្ចូលពាក្យសម្ងាត់</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                កន្លែងកំណត់នេះត្រូវបានការពារ។ សូមបញ្ចូលពាក្យសម្ងាត់ដើម្បីបើកកែសម្រួល។
              </p>
            </div>

            <div className="w-full max-w-xs space-y-2">
              <input
                type="password"
                autoFocus
                placeholder="បញ្ចូលពាក្យសម្ងាត់..."
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (pinError) setPinError(null);
                }}
                className="w-full px-4 py-3 text-center text-lg font-bold tracking-widest rounded-2xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
              />
              {pinError && (
                <p className="text-xs text-red-500 font-bold animate-in fade-in">{pinError}</p>
              )}
            </div>

            <div className="flex gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-2.5 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-all"
              >
                បោះបង់
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
              >
                បើកសោ
              </button>
            </div>
          </form>
        ) : (
          /* Unlocked Settings Content */
          <>
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                <span className="text-base">🔓</span>
                <div>
                  <strong>បានដោះសោជោគជ័យ៖</strong> អ្នកអាចកែប្រែ <strong>Project URL</strong> និង <strong>anon public API key</strong> របស់ Supabase នៅទីនេះ។
                </div>
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
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center">
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
              >
                សម្អាតទិន្នន័យ
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-sm"
                >
                  បិទ
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md"
                >
                  រក្សាទុក & ភ្ជាប់
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SupabaseSettingsModal;
