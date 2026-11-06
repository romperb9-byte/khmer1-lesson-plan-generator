
import React, { useState } from 'react';
import { Activity } from '../types';

interface ActivityItemProps {
  activity: Activity;
  index: number;
  onChange: (id: string, field: keyof Omit<Activity, 'id'>, text: string) => void;
  onRemove: (id: string) => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, index, onChange, onRemove }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyStep = () => {
    let content = `[ជំហានទី ${index + 1}]\n`;
    if (activity.teacherActivity) content += `• សកម្មភាពគ្រូ:\n${activity.teacherActivity}\n`;
    if (activity.lessonContent) content += `• ខ្លឹមសារមេរៀន:\n${activity.lessonContent}\n`;
    if (activity.studentActivity) content += `• សកម្មភាពសិស្ស:\n${activity.studentActivity}\n`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => fallbackCopy(content));
    } else {
      fallbackCopy(content);
    }
  };

  const fallbackCopy = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
    document.body.removeChild(textarea);
  };

  return (
    <div className="mb-6 p-4 border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800/50 shadow">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-md font-semibold text-purple-600 dark:text-purple-400">ជំហានទី {index + 1}</h4>
        <button
          type="button"
          onClick={handleCopyStep}
          className="flex items-center gap-1.5 text-xs bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-semibold px-2.5 py-1 rounded-md border border-purple-200 dark:border-purple-800 transition-all shadow-sm active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {copied ? 'បានចម្លង!' : 'ចម្លងជំហាននេះ'}
        </button>
      </div>
      
      <div className="mb-3">
        <label htmlFor={`teacherActivity-${activity.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          សកម្មភាពគ្រូ:
        </label>
        <textarea
          id={`teacherActivity-${activity.id}`}
          value={activity.teacherActivity}
          onChange={(e) => onChange(activity.id, 'teacherActivity', e.target.value)}
          placeholder="រៀបរាប់សកម្មភាពរបស់គ្រូ..."
          rows={3}
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm"
        />
      </div>

      <div className="mb-3">
        <label htmlFor={`lessonContent-${activity.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          ខ្លឹមសារមេរៀន:
        </label>
        <textarea
          id={`lessonContent-${activity.id}`}
          value={activity.lessonContent}
          onChange={(e) => onChange(activity.id, 'lessonContent', e.target.value)}
          placeholder="រៀបរាប់ខ្លឹមសារមេរៀនសម្រាប់ជំហាននេះ..."
          rows={4}
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm"
        />
      </div>

      <div className="mb-3">
        <label htmlFor={`studentActivity-${activity.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          សកម្មភាពសិស្ស:
        </label>
        <textarea
          id={`studentActivity-${activity.id}`}
          value={activity.studentActivity}
          onChange={(e) => onChange(activity.id, 'studentActivity', e.target.value)}
          placeholder="រៀបរាប់សកម្មភាពរបស់សិស្ស..."
          rows={3}
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm"
        />
      </div>
      
      <button
        type="button"
        onClick={() => onRemove(activity.id)}
        className="mt-2 text-sm text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 transition-colors font-medium"
      >
        លុបជំហាននេះចោល
      </button>
    </div>
  );
};

export default ActivityItem;
