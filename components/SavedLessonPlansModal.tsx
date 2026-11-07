import React, { useEffect, useState } from 'react';
import { SavedLessonPlanRecord, getLessonPlansFromDb, deleteLessonPlanFromDb } from '../services/supabaseService';
import { LessonPlanFormState } from '../types';

interface SavedLessonPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPlan: (plan: LessonPlanFormState) => void;
  currentUser: string | null;
}

const SavedLessonPlansModal: React.FC<SavedLessonPlansModalProps> = ({
  isOpen,
  onClose,
  onLoadPlan,
  currentUser
}) => {
  const [plans, setPlans] = useState<SavedLessonPlanRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const data = await getLessonPlansFromDb(currentUser || undefined);
      setPlans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`តើអ្នកប្រាកដជាចង់លុប "${title}" មែនទេ?`)) {
      try {
        await deleteLessonPlanFromDb(id);
        setPlans(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        alert("បរាជ័យក្នុងការលុប៖ " + (err as any).message);
      }
    }
  };

  const handleSelect = (record: SavedLessonPlanRecord) => {
    const formData: LessonPlanFormState = {
      date: record.date || new Date().toISOString().split('T')[0],
      subject: record.subject || '',
      lessonNo: record.lesson_no || '',
      lessonTitle: record.lesson_title || record.title || '',
      lessonSubtitle: record.lesson_subtitle || '',
      teacherName: record.teacher_name || '',
      classInCharge: record.class_in_charge || '',
      durationDetail: record.duration_detail || '',
      sourceBook: record.source_book || '',
      objectives: record.objectives || '',
      materials: record.materials || '',
      attachmentText: record.attachment_text || '',
      activities: Array.isArray(record.activities) ? record.activities : [],
      attachmentImages: Array.isArray(record.attachment_images) ? record.attachment_images : [],
    };
    onLoadPlan(formData);
    onClose();
  };

  const filtered = plans.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      (p.title && p.title.toLowerCase().includes(term)) ||
      (p.subject && p.subject.toLowerCase().includes(term)) ||
      (p.teacher_name && p.teacher_name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-indigo-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">កិច្ចតែងការដែលបានរក្សាទុក (Supabase)</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">ទិន្នន័យដែលបានរក្សាទុកក្នុង Cloud Database</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white dark:bg-slate-800 rounded-full text-gray-400 hover:text-red-500 transition-colors shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex gap-3 items-center">
          <input
            type="text"
            placeholder="ស្វែងរកតាមចំណងជើង ឬមុខវិជ្ជា..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={loadPlans}
            className="px-4 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 text-sm font-medium flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            ផ្ទុកឡើងវិញ
          </button>
        </div>

        {/* List of plans */}
        <div className="p-6 overflow-y-auto flex-grow space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">កំពុងផ្ទុកទិន្នន័យ...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg font-medium">មិនទាន់មានកិច្ចតែងការដែលបានរក្សាទុកទេ</p>
              <p className="text-sm mt-1">ចុចប៊ូតុង "រក្សាទុកក្នុង Supabase" នៅពេលអ្នកបង្កើតកិច្ចតែងការរួចរាល់។</p>
            </div>
          ) : (
            filtered.map((plan) => (
              <div
                key={plan.id}
                className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-4 hover:shadow-md transition-all"
              >
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold px-2.5 py-0.5 rounded-full">
                      {plan.subject || 'មិនបញ្ជាក់មុខវិជ្ជា'}
                    </span>
                    {plan.lesson_no && (
                      <span className="text-xs text-gray-500 font-medium">មេរៀនទី {plan.lesson_no}</span>
                    )}
                    <span className="text-xs text-gray-400">| កាលបរិច្ឆេទ: {plan.date || '---'}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">
                    {plan.title || plan.lesson_title || 'គ្មានចំណងជើង'}
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex gap-3">
                    <span>គ្រូបង្រៀន: {plan.teacher_name || '---'}</span>
                    <span>ថ្នាក់: {plan.class_in_charge || '---'}</span>
                    <span>ដោយ: {plan.created_by || 'anonymous'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelect(plan)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    បើកមើល / កែសម្រួល
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id, plan.title)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    title="លុប"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-sm"
          >
            បិទ
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavedLessonPlansModal;
