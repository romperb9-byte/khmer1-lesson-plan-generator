import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppUser, LessonPlanFormState } from '../types';

// Retrieve Supabase config from Vite environment variables or localStorage
const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(key) || '';
  }
  return '';
};

const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY');

export let supabase: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('http'));
};

if (isSupabaseConfigured()) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.error('Supabase initialization failed:', err);
  }
}

export interface SavedLessonPlanRecord {
  id: string;
  title: string;
  subject: string;
  lesson_no: string;
  lesson_title: string;
  teacher_name: string;
  class_in_charge: string;
  date: string;
  duration_detail: string;
  source_book: string;
  objectives: string;
  materials: string;
  attachment_text: string;
  activities: any;
  attachment_images: any;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

// ----------------- USER MANAGEMENT -----------------

export const subscribeToUsers = (
  callback: (users: AppUser[]) => void,
  onError?: (error: any) => void
) => {
  if (!supabase) {
    if (onError) onError(new Error("Supabase is not configured"));
    return () => {};
  }

  // Initial fetch
  supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true })
    .then(({ data, error }) => {
      if (error) {
        console.error('Error fetching users from Supabase:', error);
        if (onError) onError(error);
      } else if (data) {
        callback(mapUsersFromDb(data));
      }
    });

  // Realtime subscription
  const channel = supabase
    .channel('public:users')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'users' },
      async () => {
        const { data, error } = await supabase!
          .from('users')
          .select('*')
          .order('created_at', { ascending: true });
        if (!error && data) {
          callback(mapUsersFromDb(data));
        }
      }
    )
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
};

const mapUsersFromDb = (rows: any[]): AppUser[] => {
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    gender: row.gender,
    role: row.role,
    phone: row.phone,
    username: row.username,
    password: row.password,
    wordCount: row.word_count || 0,
    pptCount: row.ppt_count || 0,
    dailyAiGenCount: row.daily_ai_gen_count || 0,
    lastAiGenDate: row.last_ai_gen_date || '',
  }));
};

export const addUserToDb = async (userData: Omit<AppUser, 'id' | 'wordCount' | 'pptCount'>) => {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        name: userData.name,
        gender: userData.gender,
        role: userData.role,
        phone: userData.phone,
        username: userData.username,
        password: userData.password,
        word_count: 0,
        ppt_count: 0,
        daily_ai_gen_count: 0,
        last_ai_gen_date: '',
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateUserInDb = async (user: AppUser) => {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase
    .from('users')
    .update({
      name: user.name,
      gender: user.gender,
      role: user.role,
      phone: user.phone,
      username: user.username,
      password: user.password,
      word_count: user.wordCount,
      ppt_count: user.pptCount,
      daily_ai_gen_count: user.dailyAiGenCount || 0,
      last_ai_gen_date: user.lastAiGenDate || '',
    })
    .eq('id', user.id);

  if (error) throw error;
};

export const deleteUserFromDb = async (id: string | number) => {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
};

export const incrementGenerationCount = async (username: string, type: 'word' | 'ppt') => {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data: user, error: fetchErr } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (fetchErr || !user) return;

  const field = type === 'word' ? 'word_count' : 'ppt_count';
  const newCount = (user[field] || 0) + 1;

  await supabase
    .from('users')
    .update({ [field]: newCount })
    .eq('username', username);
};

export const incrementDailyAiGenCount = async (username: string) => {
  if (!supabase) throw new Error("Supabase is not configured");
  const today = new Date().toISOString().split('T')[0];
  const { data: user, error: fetchErr } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (fetchErr || !user) return;

  let newCount = 1;
  if (user.last_ai_gen_date === today) {
    newCount = (user.daily_ai_gen_count || 0) + 1;
  }

  await supabase
    .from('users')
    .update({
      daily_ai_gen_count: newCount,
      last_ai_gen_date: today
    })
    .eq('username', username);
};

export const seedInitialUsers = async (initialUsers: AppUser[]) => {
  if (!supabase) return;
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.warn("Could not check users in Supabase:", error.message);
      return;
    }

    if (count === 0) {
      const rows = initialUsers.map(u => ({
        name: u.name,
        gender: u.gender,
        role: u.role,
        phone: u.phone,
        username: u.username,
        password: u.password,
        word_count: u.wordCount || 0,
        ppt_count: u.pptCount || 0,
        daily_ai_gen_count: 0,
        last_ai_gen_date: '',
      }));
      await supabase.from('users').insert(rows);
      console.log("Seeded initial users into Supabase.");
    }
  } catch (e: any) {
    console.warn("Seeding initial users into Supabase failed:", e.message);
  }
};

// ----------------- LESSON PLANS STORAGE -----------------

export const saveLessonPlanToDb = async (formData: LessonPlanFormState, username?: string) => {
  if (!supabase) throw new Error("Supabase is not configured");
  
  const payload = {
    title: formData.lessonTitle || 'កិច្ចតែងការបង្រៀន',
    subject: formData.subject,
    lesson_no: formData.lessonNo,
    lesson_title: formData.lessonTitle,
    teacher_name: formData.teacherName,
    class_in_charge: formData.classInCharge,
    date: formData.date,
    duration_detail: formData.durationDetail,
    source_book: formData.sourceBook,
    objectives: formData.objectives,
    materials: formData.materials,
    attachment_text: formData.attachmentText,
    activities: formData.activities,
    attachment_images: formData.attachmentImages || [],
    created_by: username || 'anonymous',
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('lesson_plans')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getLessonPlansFromDb = async (username?: string): Promise<SavedLessonPlanRecord[]> => {
  if (!supabase) return [];
  let query = supabase
    .from('lesson_plans')
    .select('*')
    .order('created_at', { ascending: false });

  if (username && username !== 'admin') {
    query = query.eq('created_by', username);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching lesson plans from Supabase:", error);
    return [];
  }
  return data || [];
};

export const deleteLessonPlanFromDb = async (id: string) => {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from('lesson_plans').delete().eq('id', id);
  if (error) throw error;
};
