
export interface Activity {
  id: string;
  teacherActivity: string;
  lessonContent: string;
  studentActivity: string;
}

export interface AppUser {
  id: string | number;
  name: string;
  gender: 'ប្រុស' | 'ស្រី';
  role: string;
  phone: string;
  username: string;
  password: string;
  wordCount: number;
  pptCount: number;
  dailyAiGenCount?: number; // Added for daily limit tracking
  lastAiGenDate?: string;    // Added for daily limit tracking (YYYY-MM-DD)
}

export interface LessonPlanFormState {
  date: string;
  subject: string;
  lessonNo: string;
  lessonTitle: string;
  teacherName: string;
  classInCharge: string;
  durationDetail: string; 
  sourceBook: string;
  objectives: string;
  materials: string;
  attachmentImages: { id: string; data: string; mimeType: string; }[];
  activities: Activity[];
  attachmentText: string;
}

export enum FormFieldType {
  TEXT = "text",
  DATE = "date",
  NUMBER = "number",
  TEXTAREA = "textarea"
}

export interface MultipleChoiceExercise {
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface FillInTheBlankExercise {
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  answer: string;
}

export interface MatchingExercisePair {
  prompt: string;
  answer: string;
}

export interface MatchingExercise {
  difficulty: 'easy' | 'medium' | 'hard';
  instruction: string;
  pairs: MatchingExercisePair[];
}

export interface GeneratedExercises {
  multipleChoice: MultipleChoiceExercise[];
  fillInTheBlank: FillInTheBlankExercise[];
  matching: MatchingExercise[];
}
