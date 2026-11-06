import React, { useState, useEffect } from 'react';
import { getGeminiApiKey } from '../services/geminiService';

interface ApiKeyBarProps {
  onApiKeyChange?: (key: string) => void;
}

const ApiKeyBar: React.FC<ApiKeyBarProps> = ({ onApiKeyChange }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [inputVal, setInputVal] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const current = getGeminiApiKey();
    setApiKey(current);
    setInputVal(current);
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = () => {
    const cleanKey = inputVal.trim();
    if (!cleanKey) {
      alert("សូមបញ្ចូល API Key ត្រឹមត្រូវ!");
      return;
    }
    localStorage.setItem('GOOGLE_AI_STUDIO_API_KEY', cleanKey);
    localStorage.setItem('GEMINI_API_KEY', cleanKey);
    setApiKey(cleanKey);
    setIsEditing(false);
    showToast("✓ បានរក្សាទុក API Key ក្នុង Browser រួចរាល់!");
    if (onApiKeyChange) onApiKeyChange(cleanKey);
  };

  const handleClear = () => {
    if (window.confirm("តើអ្នកពិតជាចង់លុប Google AI Studio API Key ចេញពី Browser នេះមែនទេ?")) {
      localStorage.removeItem('GOOGLE_AI_STUDIO_API_KEY');
      localStorage.removeItem('GEMINI_API_KEY');
      setApiKey('');
      setInputVal('');
      setIsEditing(true);
      showToast("បានលុប API Key រួចរាល់!");
      if (onApiKeyChange) onApiKeyChange('');
    }
  };

  const maskedKey = apiKey ? `${apiKey.substring(0, 6)}••••••••${apiKey.substring(apiKey.length - 4)}` : '';

  return (
    <div className="w-full bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900 border-b border-indigo-100 dark:border-slate-800 py-2.5 px-4 sm:px-6 transition-all">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        
        {/* Left Section: Label & Link */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
            </svg>
            Google AI Studio API Free:
          </span>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] underline text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium"
            title="ចុចដើម្បីទៅយក API Key Free ពី Google AI Studio"
          >
            (យក Free Key នៅទីនេះ ↗)
          </a>
        </div>

        {/* Middle/Right Section: Input / Display */}
        <div className="flex items-center gap-2 flex-grow sm:flex-grow-0 justify-end flex-wrap">
          {(!apiKey || isEditing) ? (
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <div className="relative flex-grow sm:w-72">
                <input
                  type={showKey ? "text" : "password"}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="បិទភ្ជាប់ API Key (AIzaSy...)"
                  className="w-full px-3 py-1.5 pr-8 text-xs rounded-xl border border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  title={showKey ? "លាក់" : "បង្ហាញ"}
                >
                  {showKey ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSave}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-sm active:scale-95"
              >
                រក្សាទុក
              </button>
              {apiKey && (
                <button
                  type="button"
                  onClick={() => {
                    setInputVal(apiKey);
                    setIsEditing(false);
                  }}
                  className="bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 px-2.5 py-1.5 rounded-xl text-xs"
                >
                  បោះបង់
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-indigo-100 dark:border-slate-700 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-mono text-xs text-gray-600 dark:text-gray-300">
                  {showKey ? apiKey : maskedKey}
                </span>
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  title={showKey ? "លាក់" : "បង្ហាញ"}
                >
                  {showKey ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setInputVal(apiKey);
                  setIsEditing(true);
                }}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 bg-indigo-100/60 dark:bg-indigo-900/40 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-all"
                title="ផ្លាស់ប្ដូរ API Key"
              >
                ផ្លាស់ប្ដូរ
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] font-bold text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-all"
                title="លុប API Key ចេញពី Browser"
              >
                លុបចេញ
              </button>
            </div>
          )}
        </div>
      </div>

      {notification && (
        <div className="text-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 animate-in fade-in duration-200">
          {notification}
        </div>
      )}
    </div>
  );
};

export default ApiKeyBar;
