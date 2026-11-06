
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { LessonPlanFormState, Activity, FormFieldType, AppUser } from './types';
import FormField from './components/FormField';
import TextAreaField from './components/TextAreaField';
import ActivityItem from './components/ActivityItem';
import { generateLessonPlanContentWithGemini } from './services/geminiService';
import { generateLessonPlanDocx, saveDocumentToFile } from './services/documentService';
import { generateSlides, prepareSlideContent, createPptxPresentation, SlideContent } from './services/slideService';
import { generateLessonPlanPdf } from './services/pdfService';
import ThemeToggle from './components/ThemeToggle';
import Login from './components/Login';
import AdminTable from './components/AdminTable';
import * as firebaseService from './services/firebaseService';
import * as supabaseService from './services/supabaseService';
import SavedLessonPlansModal from './components/SavedLessonPlansModal';
import SupabaseSettingsModal from './components/SupabaseSettingsModal';

const initialUsers: AppUser[] = [
  { id: 1, name: 'អ្នកគ្រប់គ្រង (Admin)', gender: 'ប្រុស', role: 'នាយក', phone: '092920920', username: 'admin', password: 'password', wordCount: 15, pptCount: 8, dailyAiGenCount: 0, lastAiGenDate: "" },
  { id: 2, name: 'គ្រូបង្រៀន ទី១', gender: 'ស្រី', role: 'គ្រូបង្រៀន', phone: '012112233', username: 'teacher1', password: 'password', wordCount: 2, pptCount: 0, dailyAiGenCount: 0, lastAiGenDate: "" },
  { id: 3, name: 'គ្រូបង្រៀន ទី២', gender: 'ស្រី', role: 'គ្រូបង្រៀន', phone: '097555666', username: 'teacher2', password: 'password', wordCount: 0, pptCount: 1, dailyAiGenCount: 0, lastAiGenDate: "" },
];

const initialFormData: LessonPlanFormState = {
  date: new Date().toISOString().split('T')[0], 
  subject: '',
  lessonNo: '',
  lessonTitle: '',
  teacherName: '',
  classInCharge: '',
  durationDetail: '', 
  sourceBook: '',
  objectives: '',
  materials: '',
  attachmentImages: [],
  activities: [],
  attachmentText: '',
};

const GENERATION_LIMIT = 100;
const AUTO_LOGOUT_TIME = 5 * 60 * 1000; // 5 minutes

type TabType = 'lessonPlan';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => localStorage.getItem('isLoggedIn') === 'true');
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem('currentUser'));
  const [activeTab, setActiveTab] = useState<TabType>('lessonPlan');
  
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [firebaseActive, setFirebaseActive] = useState<boolean>(false);
  const [supabaseActive, setSupabaseActive] = useState<boolean>(supabaseService.isSupabaseConfigured());
  const [showSavedPlansModal, setShowSavedPlansModal] = useState<boolean>(false);
  const [showSupabaseSettingsModal, setShowSupabaseSettingsModal] = useState<boolean>(false);
  const [isSavingToSupabase, setIsSavingToSupabase] = useState<boolean>(false);
  const [saveSuccessAlert, setSaveSuccessAlert] = useState<boolean>(false);
  
  const [formData, setFormData] = useState<LessonPlanFormState>(initialFormData);
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [isDownloadingDoc, setIsDownloadingDoc] = useState<boolean>(false);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState<boolean>(false);
  const [isDownloadingSlides, setIsDownloadingSlides] = useState<boolean>(false);
  const [slideProgressText, setSlideProgressText] = useState<string>('');
  const [slideProgressPercent, setSlideProgressPercent] = useState<number>(0);
  const [copiedAllSlides, setCopiedAllSlides] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [showFaqModal, setShowFaqModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [slideError, setSlideError] = useState<string | null>(null); 
  const [copied5Steps, setCopied5Steps] = useState<boolean>(false);
  const [aiSuccessAlert, setAiSuccessAlert] = useState<boolean>(false);
  
  const [previewSlides, setPreviewSlides] = useState<SlideContent[] | null>(null);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number>(0);
  const [showSlidePreview, setShowSlidePreview] = useState<boolean>(false);

  const activeSlide = previewSlides ? previewSlides[selectedSlideIndex] : null;

  const logoutTimerRef = useRef<any>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
  }, []);

  const resetLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (isLoggedIn) {
      logoutTimerRef.current = setTimeout(() => {
        handleLogout();
        alert("គណនីរបស់អ្នកត្រូវបានចាកចេញដោយស្វ័យប្រវត្តិ ដោយសារគ្មានសកម្មភាពក្នុងរយៈពេលយូរ។");
      }, AUTO_LOGOUT_TIME);
    }
  }, [isLoggedIn, handleLogout]);

  useEffect(() => {
    if (isLoggedIn) {
      window.addEventListener('mousemove', resetLogoutTimer);
      window.addEventListener('keypress', resetLogoutTimer);
      window.addEventListener('mousedown', resetLogoutTimer);
      window.addEventListener('touchstart', resetLogoutTimer);
      window.addEventListener('scroll', resetLogoutTimer);
      
      resetLogoutTimer();
    }

    return () => {
      window.removeEventListener('mousemove', resetLogoutTimer);
      window.removeEventListener('keypress', resetLogoutTimer);
      window.removeEventListener('mousedown', resetLogoutTimer);
      window.removeEventListener('touchstart', resetLogoutTimer);
      window.removeEventListener('scroll', resetLogoutTimer);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, [isLoggedIn, resetLogoutTimer]);

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    if (supabaseService.isSupabaseConfigured()) {
      supabaseService.seedInitialUsers(initialUsers);
      unsubscribe = supabaseService.subscribeToUsers(
        (fetchedUsers) => {
          if (fetchedUsers && fetchedUsers.length > 0) {
            setUsers(fetchedUsers);
            setSupabaseActive(true);
          }
        },
        (error) => {
          console.warn("Supabase subscription error, trying fallback to Firebase:", error);
          setSupabaseActive(false);
          initFirebase();
        }
      );
    } else {
      initFirebase();
    }

    function initFirebase() {
      firebaseService.seedInitialUsers(initialUsers);
      unsubscribe = firebaseService.subscribeToUsers(
        (fetchedUsers) => {
          if (fetchedUsers && fetchedUsers.length > 0) {
            setUsers(fetchedUsers);
            setFirebaseActive(true);
          }
        },
        (error) => {
          setFirebaseActive(false);
          if (error.code === 'permission-denied') {
            console.warn("Firestore permission denied. App is using local offline data.");
          }
        }
      );
    }

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const currentAppUser = useMemo(() => users.find(u => u.username === currentUser), [users, currentUser]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleLogin = (user: string, pass: string): boolean => {
    const foundUser = users.find(u => u.username === user && u.password === pass);
    if (foundUser) {
      setIsLoggedIn(true);
      setCurrentUser(user);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', user);
      return true;
    }
    return false;
  };

  const incrementCount = async (type: 'word' | 'ppt') => {
    if (!currentUser) return;
    try {
      if (supabaseActive) {
        await supabaseService.incrementGenerationCount(currentUser, type);
      } else {
        await firebaseService.incrementGenerationCount(currentUser, type);
      }
    } catch (e) {
      setUsers(prev => prev.map(u => {
        if (u.username === currentUser) {
          return {
            ...u,
            wordCount: type === 'word' ? u.wordCount + 1 : u.wordCount,
            pptCount: type === 'ppt' ? u.pptCount + 1 : u.pptCount,
          };
        }
        return u;
      }));
    }
  };

  const handleAddUser = async (userData: Omit<AppUser, 'id' | 'wordCount' | 'pptCount'>) => {
    try {
      if (supabaseActive) {
        await supabaseService.addUserToDb(userData);
      } else {
        await firebaseService.addUserToDb(userData);
      }
    } catch (e) {
      const newUser: AppUser = { ...userData, id: `local-${Date.now()}`, wordCount: 0, pptCount: 0, dailyAiGenCount: 0, lastAiGenDate: "" };
      setUsers(prev => [...prev, newUser]);
    }
  };

  const handleUpdateUser = async (updatedUser: AppUser) => {
    try {
      if (supabaseActive) {
        await supabaseService.updateUserInDb(updatedUser);
      } else {
        await firebaseService.updateUserInDb(updatedUser);
      }
    } catch (e) {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    }
  };

  const handleDeleteUser = async (id: string | number) => {
    try {
      if (supabaseActive) {
        await supabaseService.deleteUserFromDb(id);
      } else {
        await firebaseService.deleteUserFromDb(id);
      }
    } catch (e) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const handleSaveToSupabase = async () => {
    if (!supabaseService.isSupabaseConfigured()) {
      setShowSupabaseSettingsModal(true);
      return;
    }
    if (!formData.lessonTitle && !formData.subject) {
      alert("សូមបំពេញចំណងជើងមេរៀន ឬ មុខវិជ្ជា មុនពេលរក្សាទុក!");
      return;
    }
    setIsSavingToSupabase(true);
    try {
      await supabaseService.saveLessonPlanToDb(formData, currentUser || 'anonymous');
      setSaveSuccessAlert(true);
      setTimeout(() => setSaveSuccessAlert(false), 3000);
    } catch (err: any) {
      alert("បរាជ័យក្នុងការរក្សាទុកទៅកាន់ Supabase៖ " + (err?.message || err));
    } finally {
      setIsSavingToSupabase(false);
    }
  };

  const handleLoadPlan = (loadedPlan: LessonPlanFormState) => {
    setFormData(loadedPlan);
  };

  const handleShowAdmin = () => {
    if (currentUser === 'admin') {
      setShowAdminModal(true);
    } else {
      alert("ទាល់តែគណនី admin ទើបអាចចូលមើលបាន!");
    }
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
        const filePromises = Array.from(files).map((file: File) => {
            return new Promise<{ id: string; data: string; mimeType: string; } | null>((resolve, reject) => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (loadEvent) => {
                        const result = loadEvent.target?.result;
                        if (typeof result === 'string') {
                            resolve({ id: `${file.name}-${Date.now()}`, data: result, mimeType: file.type });
                        } else {
                            reject(new Error("Failed to read file"));
                        }
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                } else {
                    resolve(null); 
                }
            });
        });
        Promise.all(filePromises).then(newImages => {
            setFormData(prev => ({
                ...prev,
                attachmentImages: [...prev.attachmentImages, ...newImages.filter((img): img is { id: string; data: string; mimeType: string; } => img !== null)]
            }));
        });
    }
    e.target.value = '';
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (loadEvent) => {
            const result = loadEvent.target?.result;
            if (typeof result === 'string') {
              setFormData(prev => ({
                ...prev,
                attachmentImages: [
                  ...prev.attachmentImages,
                  { id: `pasted-${Date.now()}-${i}`, data: result, mimeType: file.type }
                ]
              }));
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }, []);

  const handleRemoveImage = useCallback((id: string) => {
    setFormData(prev => ({ ...prev, attachmentImages: prev.attachmentImages.filter(image => image.id !== id) }));
  }, []);

  const handleAddActivity = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      activities: [...prev.activities, { id: Date.now().toString(), teacherActivity: '', lessonContent: '', studentActivity: '' }],
    }));
  }, []);

  const handleActivityChange = useCallback((id: string, field: keyof Omit<Activity, 'id'>, text: string) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.map(act => act.id === id ? { ...act, [field]: text } : act),
    }));
  }, []);

  const handleRemoveActivity = useCallback((id: string) => {
    setFormData(prev => ({ ...prev, activities: prev.activities.filter(act => act.id !== id) }));
  }, []);

  const handleCopy5Steps = useCallback(() => {
    if (!formData.activities || formData.activities.length === 0) {
      alert("មិនទាន់មានខ្លឹមសារជំហានបង្រៀននៅឡើយទេ។");
      return;
    }

    let textToCopy = `III. ដំណើរការបង្រៀន និងរៀន\n`;
    if (formData.subject || formData.lessonTitle) {
      textToCopy = `មុខវិជ្ជា: ${formData.subject || ''}\nចំណងជើងមេរៀន: ${formData.lessonTitle || ''}\n` + textToCopy;
    }

    formData.activities.forEach((act, idx) => {
      textToCopy += `\n----------------------------\n`;
      textToCopy += `[ជំហានទី ${idx + 1}]\n`;
      if (act.teacherActivity) textToCopy += `• សកម្មភាពគ្រូ:\n${act.teacherActivity}\n`;
      if (act.lessonContent) textToCopy += `• ខ្លឹមសារមេរៀន:\n${act.lessonContent}\n`;
      if (act.studentActivity) textToCopy += `• សកម្មភាពសិស្ស:\n${act.studentActivity}\n`;
    });

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied5Steps(true);
        setTimeout(() => setCopied5Steps(false), 3000);
      }).catch(() => fallbackCopy5Steps(textToCopy));
    } else {
      fallbackCopy5Steps(textToCopy);
    }
  }, [formData]);

  const fallbackCopy5Steps = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopied5Steps(true);
      setTimeout(() => setCopied5Steps(false), 3000);
    } catch (e) {
      console.error('Fallback copy failed', e);
    }
    document.body.removeChild(textarea);
  };

  const handleGenerateWithAI = async () => {
    if (!currentUser) return;
    
    setIsLoadingAI(true);
    setError(null);
    setAiSuccessAlert(false);
    try {
      const relevantData = { 
        subject: formData.subject, 
        lessonTitle: formData.lessonTitle, 
        classInCharge: formData.classInCharge, 
        durationDetail: formData.durationDetail,
        attachmentText: formData.attachmentText,
        attachmentImages: formData.attachmentImages
      };
      
      if (!relevantData.subject || !relevantData.lessonTitle || !relevantData.classInCharge) {
        setError("សូមបំពេញ មុខវិជ្ជា, ចំណងជើងមេរៀន, និង ថ្នាក់ទទួលបន្ទុក ដើម្បីបង្កើតមាតិកាដោយ AI។");
        setIsLoadingAI(false);
        return;
      }
      const aiContent = await generateLessonPlanContentWithGemini(relevantData);
      setFormData(prev => ({
        ...prev,
        objectives: aiContent.objectives,
        materials: aiContent.materials,
        activities: aiContent.activities?.map((activityData, index) => ({ 
              id: prev.activities[index]?.id || Date.now().toString() + index,
              teacherActivity: activityData.teacherActivity,
              lessonContent: activityData.lessonContent,
              studentActivity: activityData.studentActivity,
            })) || prev.activities,
      }));
      
      setAiSuccessAlert(true);

      // Track AI generation for analytics if needed
      if (currentUser !== 'admin') {
        await firebaseService.incrementDailyAiGenCount(currentUser);
      }
      
    } catch (e: any) {
      const errorMsg = String(e.message || e.details || "").toLowerCase();
      if (errorMsg.includes('503') || errorMsg.includes('overloaded') || errorMsg.includes('unavailable')) {
        setError("ប្រព័ន្ធ AI កំពុងមមាញឹកខ្លាំង (Overloaded)។ សូមរង់ចាំប្រហែល ១-២នាទី រួចចុចបង្កើតម្ដងទៀត។");
      } else {
        setError(e.message || 'មានបញ្ហាក្នុងការបង្កើតមាតិកាដោយ AI។ សូមព្យាយាមម្តងទៀត។');
      }
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleGenerateSlides = async () => {
    if (currentUser !== 'admin' && currentAppUser && currentAppUser.pptCount >= GENERATION_LIMIT) {
      setSlideError(`អ្នកបានប្រើប្រាស់អស់ចំនួនកំណត់ហើយ (${GENERATION_LIMIT}ដង)។ សូមទាក់ទង Admin ដើម្បីបន្តប្រើប្រាស់។`);
      return;
    }

    setIsGeneratingSlides(true);
    setSlideError(null);
    setSlideProgressText('កំពុងចាប់ផ្តើមរៀបចំស្លាយ...');
    setSlideProgressPercent(10);

    if (!formData.lessonTitle || formData.activities.length === 0 || formData.activities.every(act => !act.lessonContent.trim())) {
      setSlideError("សូមបំពេញចំណងជើងមេរៀន និងបន្ថែមខ្លឹមសារមេរៀនយ៉ាងហោចណាស់មួយជំហាន ដើម្បីបង្កើតស្លាយ។");
      setIsGeneratingSlides(false);
      return;
    }
    try {
      const slides = await prepareSlideContent(formData, undefined, (status, percent) => {
        setSlideProgressText(status);
        setSlideProgressPercent(percent);
      });
      setPreviewSlides(slides);
      setSelectedSlideIndex(0);
      setShowSlidePreview(true);
    } catch (e: any) {
      const errorMsg = String(e.message || e.details || "").toLowerCase();
      if (errorMsg.includes('503') || errorMsg.includes('overloaded') || errorMsg.includes('unavailable')) {
        setSlideError("ប្រព័ន្ធ AI កំពុងមមាញឹកខ្លាំង (Overloaded)។ សូមរង់ចាំបន្តិច រួចព្យាយាមចុចបង្កើតម្តងទៀត។");
      } else {
        setSlideError(e.message || 'មានបញ្ហាក្នុងការបង្កើតស្លាយ។ សូមព្យាយាមម្តងទៀត ឬពិនិត្យ API Key។');
      }
    } finally {
      setIsGeneratingSlides(false);
      setSlideProgressText('');
      setSlideProgressPercent(0);
    }
  };

  const handleCopyAllSlides = () => {
    if (!previewSlides || previewSlides.length === 0) return;
    let fullText = `=== ${formData.lessonTitle || 'បទបង្ហាញមេរៀន'} ===\n`;
    if (formData.subject) fullText += `មុខវិជ្ជា: ${formData.subject}\n`;
    if (formData.classInCharge) fullText += `ថ្នាក់: ${formData.classInCharge}\n\n`;

    previewSlides.forEach((s, idx) => {
      fullText += `--- [ស្លាយទី ${idx + 1}: ${s.slideTitle}] ---\n`;
      fullText += `${s.slideContent}\n\n`;
    });

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullText).then(() => {
        setCopiedAllSlides(true);
        setTimeout(() => setCopiedAllSlides(false), 2500);
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = fullText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedAllSlides(true);
      setTimeout(() => setCopiedAllSlides(false), 2500);
    }
  };

  const handleDownloadPptx = async () => {
    if (!previewSlides) return;
    setIsDownloadingSlides(true);
    try {
      const presentationTitle = formData.lessonTitle || "បទបង្ហាញមេរៀន";
      const blob = await createPptxPresentation(presentationTitle, previewSlides, formData);
      saveDocumentToFile(blob, `បទបង្ហាញ_${presentationTitle}.pptx`);
      await incrementCount('ppt');
      setShowSlidePreview(false);
    } catch (e) {
      alert("មានបញ្ហាក្នុងការទាញយកឯកសារ PPTX។");
    } finally {
      setIsDownloadingSlides(false);
    }
  };

  const handleCreateWordDoc = async () => {
    if (currentUser !== 'admin' && currentAppUser && currentAppUser.wordCount >= GENERATION_LIMIT) {
      setError(`អ្នកបានប្រើប្រាស់អស់ចំនួនកំណត់ហើយ (${GENERATION_LIMIT}ដង)។ សូមទាក់ទង Admin ដើម្បីបន្តប្រើប្រាស់។`);
      return;
    }

    setIsDownloadingDoc(true);
    setError(null);
    try {
      const docBlob = await generateLessonPlanDocx(formData);
      saveDocumentToFile(docBlob, `កិច្ចតែងការបង្រៀន_${formData.lessonTitle || 'មិនមានចំណងជើង'}.docx`);
      await incrementCount('word');
    } catch (e) {
      setError('មានបញ្ហាក្នុងការបង្កើតឯកសារ Word។ សូមព្យាយាមម្តងទៀត។');
    } finally {
      setIsDownloadingDoc(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (currentUser !== 'admin' && currentAppUser && currentAppUser.wordCount >= GENERATION_LIMIT) {
      setError(`អ្នកបានប្រើប្រាស់អស់ចំនួនកំណត់ហើយ (${GENERATION_LIMIT}ដង)។ សូមទាក់ទង Admin ដើម្បីបន្តប្រើប្រាស់។`);
      return;
    }

    setIsGeneratingPdf(true);
    setError(null);
    try {
      const pdfBlob = await generateLessonPlanPdf(formData);
      saveDocumentToFile(pdfBlob, `កិច្ចតែងការបង្រៀន_${formData.lessonTitle || 'មិនមានចំណងជើង'}.pdf`);
      await incrementCount('word'); 
    } catch (e) {
      setError('មានបញ្ហាក្នុងការបង្កើត PDF។ សូមព្យាយាមម្តងទៀត។');
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  const anyActionInProgress = isLoadingAI || isDownloadingDoc || isGeneratingSlides || isGeneratingPdf || isDownloadingSlides;

  const faqs = [
    {
      q: "របៀបប្រើ AI បង្កើតកិច្ចតែងការ?",
      a: "លោកគ្រូអ្នកគ្រូគ្រាន់តែបំពេញ 'មុខវិជ្ជា', 'ចំណងជើងមេរៀន' និង 'ថ្នាក់ទទួលបន្ទុក' រួចចុចប៊ូតុងពណ៌ខៀវ 'បង្កើតកិច្ចតែងការដោយ GOOGLE AI'។ ប្រព័ន្ធនឹងរៀបចំមាតិកាឱ្យដោយស្វ័យប្រវត្តិ។"
    },
    {
      q: "តើមានកំណត់ចំនួនប្រើប្រាស់ AI ទេ?",
      a: "មិនមានកំណត់ទេ! លោកគ្រូអ្នកគ្រូអាចប្រើ AI បង្កើតកិច្ចតែងការបានតាមតម្រូវការបច្ចុប្បន្ន។"
    },
    {
      q: "របៀបបង្កើតស្លាយ (PPTX)?",
      a: "បន្ទាប់ពីមានខ្លឹមសារមេរៀនក្នុងជំហាននីមួយៗហើយ សូមចុចប៊ូតុងពណ៌លឿង 'បង្កើតស្លាយ (PPTX)'។ លោកគ្រូអ្នកគ្រូអាចមើលស្លាយសាកល្បង រួចចុចទាញយកបាន។"
    },
    {
      q: "តើខ្ញុំអាចកែសម្រួលមាតិកាបានទេ?",
      a: "បាន! លោកគ្រូអ្នកគ្រូអាចចុចលើប្រអប់អត្ថបទណាមួយ ដើម្បីកែសម្រួល ឬលុបចេញតាមតម្រូវការជាក់ស្ដែង មុននឹងទាញយកជាឯកសារ។"
    }
  ];

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // Show "Meeting Assistant" button only for Admin, Director, or Secretary
  const showMeetingAssistant = currentUser === 'admin' || (currentAppUser && (currentAppUser.role === 'នាយក' || currentAppUser.role === 'លេខា'));

  const renderLessonPlanContent = () => (
    <form onSubmit={(e) => e.preventDefault()} className="animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
        <FormField id="date" label="កាលបរិច្ឆេទ" type={FormFieldType.DATE} value={formData.date} onChange={handleChange} />
        <FormField id="subject" label="មុខវិជ្ជា" value={formData.subject} onChange={handleChange} placeholder="ឧទាហរណ៍៖ គណិតវិទ្យា" required />
        <FormField id="lessonNo" label="មេរៀនទី" value={formData.lessonNo} onChange={handleChange} placeholder="ឧទាហរណ៍៖ ១" />
        <FormField id="lessonTitle" label="ចំណងជើងមេរៀន" value={formData.lessonTitle} onChange={handleChange} placeholder="ឧទាហរណ៍៖ សមីការដឺក្រេទីមួយ" required />
        <FormField id="teacherName" label="បង្រៀនដោយ (ឈ្មោះគ្រូ)" value={formData.teacherName} onChange={handleChange} placeholder="ឈ្មោះគ្រូបង្រៀន" />
        <FormField 
          id="classInCharge" 
          label="ថ្នាក់ទទួលបន្ទុក" 
          value={formData.classInCharge} 
          onChange={handleChange} 
          placeholder="ឧទាហរណ៍៖ ទី១២A" 
          required 
          helperText="AI នឹងរៀបចំខ្លឹមសារតាមអាយុ (ថ្នាក់ទី១-៣, ៤-៦, ៧-១២)"
        />
        <FormField id="durationDetail" label="រយៈពេល" value={formData.durationDetail} onChange={handleChange} placeholder="ឧទាហរណ៍៖ ៩០ នាទី" />
        <FormField id="sourceBook" label="យកពីសៀវភៅ/ឯកសារយោង" value={formData.sourceBook} onChange={handleChange} placeholder="ឧទាហរណ៍៖ សៀវភៅគោល ទំព័រ..." />
      </div>

      <hr className="my-8 border-gray-300 dark:border-gray-600" />

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-3 border-b dark:border-gray-700 pb-2">I. វត្ថុបំណង</h2>
        <div className="p-4 bg-gray-50 dark:bg-slate-900/40 rounded-lg border border-gray-200 dark:border-slate-700">
           <TextAreaField id="objectives" label="" value={formData.objectives} onChange={handleChange} rows={5} />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-3 border-b dark:border-gray-700 pb-2">II. សម្ភារឧបទេស</h2>
        <div className="p-4 bg-gray-50 dark:bg-slate-900/40 rounded-lg border border-gray-200 dark:border-slate-700">
          <TextAreaField id="materials" label="សម្ភារៈ (រៀបរាប់):" value={formData.materials} onChange={handleChange} rows={4} />
          
          <div className="mt-6 border-t dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">ឯកសារភ្ជាប់</h3>
            <TextAreaField 
              id="attachmentText" 
              label="អត្ថបទយោង (អាច Paste រូបភាពបាន):" 
              value={formData.attachmentText} 
              onChange={handleChange} 
              onPaste={handlePaste}
              rows={6} 
              placeholder="លោកគ្រូអ្នកគ្រូអាចសរសេរអត្ថបទ ឬ Paste (Ctrl+V) រូបភាពមេរៀននៅទីនេះ..."
            />
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">រូបភាពយោង ({formData.attachmentImages.length}):</label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {formData.attachmentImages.map(img => (
                  <div key={img.id} className="relative group animate-in zoom-in duration-200">
                    <img src={img.data} alt="ឯកសារភ្ជាប់" className="w-full h-32 object-cover rounded-md border border-gray-300 dark:border-gray-600" />
                    <button type="button" onClick={() => handleRemoveImage(img.id)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 opacity-0 group-hover:opacity-100 shadow-lg">&times;</button>
                  </div>
                ))}
              </div>
              <input type="file" accept="image/*" onChange={handleImageChange} multiple className="mt-2 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
            </div>
          </div>
        </div>
      </section>
      
      <section className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b dark:border-gray-700 pb-2">
          <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-400">III. ដំណើរការបង្រៀន និងរៀន</h2>
          {formData.activities.length > 0 && (
            <button
              type="button"
              onClick={handleCopy5Steps}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl shadow transition-all active:scale-95 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied5Steps ? 'បានចម្លងខ្លឹមសារជំហានទាំង៥!' : 'ចម្លងខ្លឹមសារជំហានទាំង៥'}
            </button>
          )}
        </div>
        {formData.activities.map((activity, index) => (
          <ActivityItem key={activity.id} activity={activity} index={index} onChange={handleActivityChange} onRemove={handleRemoveActivity} />
        ))}
        <button type="button" onClick={handleAddActivity} className="mt-2 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          បន្ថែមសកម្មភាព/ជំហាន
        </button>
      </section>

      {aiSuccessAlert && (
        <div className="my-4 p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500 text-white rounded-full shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">AI បង្កើតកិច្ចតែងការរួចរាល់ហើយ!</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">លោកគ្រូអ្នកគ្រូអាចពិនិត្យ និងចុចចម្លងខ្លឹមសារជំហានទាំង៥ខាងក្រោមបាន។</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopy5Steps}
            className="w-full sm:w-auto shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl shadow transition-all flex items-center justify-center gap-2 text-xs"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copied5Steps ? 'បានចម្លងរួចរាល់!' : 'ចម្លងខ្លឹមសារជំហានទាំង៥'}
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-sm my-4 p-4 bg-red-100 dark:bg-red-900/40 border-l-4 border-red-500 rounded-md font-bold">{error}</p>}
      {slideError && <p className="text-red-500 text-sm my-4 p-4 bg-red-100 dark:bg-red-900/40 border-l-4 border-red-500 rounded-md font-bold">{slideError}</p>}

      <div className="mt-10 space-y-4">
        <div className="relative">
          <button type="button" onClick={handleGenerateWithAI} disabled={anyActionInProgress} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-3">
            {isLoadingAI && <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
            បង្កើតកិច្ចតែងការដោយ GOOGLE AI
          </button>
        </div>
        {saveSuccessAlert && (
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-400 text-emerald-800 dark:text-emerald-200 rounded-xl text-center text-sm font-bold animate-in fade-in">
            ✓ បានរក្សាទុកកិច្ចតែងការទៅកាន់ Supabase ដោយជោគជ័យ!
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            type="button" 
            onClick={handleSaveToSupabase} 
            disabled={anyActionInProgress || isSavingToSupabase} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isSavingToSupabase ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            )}
            រក្សាទុកក្នុង SUPABASE
          </button>
          <button 
            type="button" 
            onClick={() => setShowSavedPlansModal(true)} 
            disabled={anyActionInProgress} 
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
            បញ្ជីកិច្ចតែងការចាស់ៗ
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button type="button" onClick={handleCreateWordDoc} disabled={anyActionInProgress} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md disabled:opacity-50 transition-all">បង្កើតឯកសារ WORD</button>
          <button type="button" onClick={handleDownloadPdf} disabled={anyActionInProgress} className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-md disabled:opacity-50 transition-all">បង្កើតជា PDF</button>
        </div>
        <button type="button" onClick={handleGenerateSlides} disabled={anyActionInProgress} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-3">
          {isGeneratingSlides && <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
          បង្កើតស្លាយបង្រៀន (Google Slides / PPTX)
        </button>

        {isGeneratingSlides && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl animate-in fade-in duration-300 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-amber-800 dark:text-amber-300">
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5 text-amber-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {slideProgressText || 'កំពុងបង្កើតស្លាយ...'}
              </span>
              <span>{slideProgressPercent}%</span>
            </div>
            <div className="w-full bg-amber-200 dark:bg-amber-900/50 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-amber-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${slideProgressPercent}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 font-['Kantumruy_Pro']">
      {showAdminModal && (
        <AdminTable 
          users={users} 
          onClose={() => setShowAdminModal(false)}
          onAddUser={handleAddUser}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
        />
      )}

      {showSavedPlansModal && (
        <SavedLessonPlansModal
          isOpen={showSavedPlansModal}
          onClose={() => setShowSavedPlansModal(false)}
          onLoadPlan={handleLoadPlan}
          currentUser={currentUser}
        />
      )}

      {showSupabaseSettingsModal && (
        <SupabaseSettingsModal
          isOpen={showSupabaseSettingsModal}
          onClose={() => setShowSupabaseSettingsModal(false)}
          onSaved={() => {
            setSupabaseActive(supabaseService.isSupabaseConfigured());
          }}
        />
      )}

      {/* FAQ Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-purple-50 dark:bg-slate-900">
              <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-400">សំណួរ និង ចម្លើយ (FAQ)</h2>
              <button onClick={() => setShowFaqModal(false)} className="p-2 bg-white dark:bg-slate-800 rounded-full text-gray-400 hover:text-red-500 transition-colors shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              {faqs.map((faq, idx) => (
                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all hover:shadow-md">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">Q</span>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 leading-tight pt-1">{faq.q}</h3>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">A</span>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed pt-1">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-900 text-center border-t border-gray-100 dark:border-slate-800">
              <button onClick={() => setShowFaqModal(false)} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-2xl shadow-lg transition-all">យល់ព្រម</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced Slide Preview Modal */}
      {showSlidePreview && previewSlides && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl overflow-hidden animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-7xl h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex flex-wrap gap-4 justify-between items-center bg-white dark:bg-slate-900 z-10 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400">ពិនិត្យមើលស្លាយ</h2>
                  <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                    Google Slides & PPTX
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">ស្លាយទី {selectedSlideIndex + 1} នៃ {previewSlides.length} (អាចបើកក្នុង Google Drive / Slides បានយ៉ាងរលូន)</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  type="button"
                  onClick={handleCopyAllSlides}
                  className="bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold py-3 px-5 rounded-2xl flex items-center gap-2 border border-purple-200 dark:border-purple-800 transition-all active:scale-95 text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {copiedAllSlides ? 'បានចម្លងស្លាយទាំងអស់!' : 'ចម្លងស្លាយទាំងអស់'}
                </button>
                <button 
                  onClick={handleDownloadPptx}
                  disabled={isDownloadingSlides}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2.5 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 active:scale-95 text-sm"
                >
                  {isDownloadingSlides ? (
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  )}
                  ទាញយកឯកសារស្លាយ (.PPTX)
                </button>
                <button 
                  onClick={() => setShowSlidePreview(false)}
                  className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold py-3 px-5 rounded-2xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all text-sm"
                >
                  បិទ
                </button>
              </div>
            </div>
            
            <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
              {/* Main Content Area: Large Slide View */}
              <div className="flex-grow bg-slate-100 dark:bg-slate-950 p-6 lg:p-12 overflow-y-auto flex items-center justify-center">
                <div className="w-full max-w-5xl aspect-video bg-white dark:bg-slate-800 shadow-2xl rounded-sm border border-gray-200 dark:border-slate-700 flex flex-col p-[4%] relative overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-right-4">
                  {activeSlide && (
                    <>
                      <div className="mb-[2%]">
                        <h3 className="text-[2.8vw] lg:text-4xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
                          {activeSlide.slideTitle}
                        </h3>
                        <div className="h-1 w-[15%] bg-amber-500 mt-2"></div>
                      </div>
                      <div className="flex-grow flex gap-[4%] mt-[2%] overflow-hidden">
                        <div className="w-1/2 flex items-center justify-center">
                          {activeSlide.imageData ? (
                            <div className="w-full h-full rounded-xl overflow-hidden shadow-inner border border-slate-100 dark:border-slate-700">
                              <img src={activeSlide.imageData} alt="Slide visualization" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-full h-full bg-slate-50 dark:bg-slate-900 rounded-xl flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200">
                              <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <p className="text-sm">មិនទាន់មានរូបភាព</p>
                            </div>
                          )}
                        </div>
                        <div className="w-1/2 flex flex-col justify-start">
                          <div className="text-[1.8vw] lg:text-2xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                            {activeSlide.slideContent.split('\n').map((line, idx) => (
                              <div key={idx} className="flex gap-3 mb-[3%]">
                                <span className="text-amber-500 flex-shrink-0 mt-1">•</span>
                                <span>{line}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full h-[3%] bg-slate-800 dark:bg-black"></div>
                      <div className="absolute bottom-[3%] left-0 w-full h-[0.5%] bg-amber-500"></div>
                      <div className="absolute bottom-[0.8%] left-[2%] text-[0.8vw] text-white opacity-60">{formData.lessonTitle}</div>
                      <div className="absolute bottom-[0.8%] right-[2%] text-[0.8vw] text-white opacity-80 font-bold">{selectedSlideIndex + 1}</div>
                    </>
                  )}
                </div>
              </div>
              <div className="lg:w-80 bg-white dark:bg-slate-900 border-l border-gray-100 dark:border-slate-800 flex flex-col">
                <div className="p-4 border-b border-gray-50 dark:border-slate-800 font-bold text-gray-500 uppercase text-xs tracking-widest">បញ្ជីស្លាយ ({previewSlides.length})</div>
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                  {previewSlides.map((slide, idx) => (
                    <button key={idx} onClick={() => setSelectedSlideIndex(idx)} className={`w-full text-left rounded-xl overflow-hidden border-2 transition-all group ${selectedSlideIndex === idx ? 'border-purple-500 ring-4 ring-purple-500/10' : 'border-slate-100 dark:border-slate-800 hover:border-purple-300'}`}>
                      <div className="aspect-video bg-slate-100 dark:bg-slate-950 relative">
                        {slide.imageData ? (<img src={slide.imageData} alt="" className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-slate-300"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>)}
                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold ${selectedSlideIndex === idx ? 'bg-purple-600 text-white' : 'bg-white/80 text-gray-600'}`}>{idx + 1}</div>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900"><p className={`text-xs font-bold line-clamp-1 ${selectedSlideIndex === idx ? 'text-purple-600' : 'text-gray-700 dark:text-gray-300'}`}>{slide.slideTitle}</p></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto bg-white dark:bg-slate-800 shadow-2xl rounded-3xl overflow-hidden relative border border-gray-100 dark:border-slate-700">
        <div className="absolute top-8 right-8 flex items-center gap-3 z-10">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          <button onClick={handleLogout} className="p-2.5 rounded-full text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all shadow-sm active:scale-90" title="ចាកចេញ"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
        </div>

        <div className="p-6 sm:p-10">
          <header className="mb-10 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-700 to-indigo-600 dark:from-purple-400 dark:to-indigo-300 bg-clip-text text-transparent mb-2">កម្មវិធីជំនួយគ្រូបង្រៀន</h1>
            <div className="flex flex-col items-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowSupabaseSettingsModal(true)}
                className={`text-[12px] px-3.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-2 transition-all border shadow-sm ${
                  supabaseActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-600 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 hover:bg-amber-100'
                }`}
                title="ចុចដើម្បីកំណត់ និងពិនិត្យការភ្ជាប់ Supabase"
              >
                <span className={`w-2 h-2 rounded-full ${supabaseActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                {supabaseActive ? 'Supabase Database: បានភ្ជាប់' : 'Supabase Database: មិនទាន់ភ្ជាប់ (ចុចកំណត់)'}
              </button>
              {currentAppUser && (<div className="flex justify-center gap-6 text-[13px] font-bold text-gray-500 dark:text-gray-400 bg-slate-50 dark:bg-slate-900/50 px-6 py-2 rounded-2xl border border-gray-100 dark:border-slate-800"><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${currentAppUser.wordCount >= GENERATION_LIMIT && currentUser !== 'admin' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div><span className={currentAppUser.wordCount >= GENERATION_LIMIT && currentUser !== 'admin' ? 'text-red-500' : ''}>Word/PDF: {currentAppUser.wordCount}/{currentUser === 'admin' ? '∞' : GENERATION_LIMIT}</span></div><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${currentAppUser.pptCount >= GENERATION_LIMIT && currentUser !== 'admin' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div><span className={currentAppUser.pptCount >= GENERATION_LIMIT && currentUser !== 'admin' ? 'text-red-500' : ''}>PPT: {currentAppUser.pptCount}/{currentUser === 'admin' ? '∞' : GENERATION_LIMIT}</span></div></div>)}
            </div>
          </header>

          {/* TAB BAR */}
          <div className="flex justify-center mb-10">
            <div className="flex flex-wrap justify-center p-1.5 bg-slate-50 dark:bg-slate-950/50 rounded-[22px] border border-gray-100 dark:border-slate-800 shadow-inner">
              <button
                onClick={() => setActiveTab('lessonPlan')}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[14px] font-bold transition-all duration-300 ${activeTab === 'lessonPlan' ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/20 scale-105' : 'text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                កិច្ចតែងការ
              </button>
              <button
                onClick={() => window.open('https://fliphtml5.com/bookcase/essub', '_blank')}
                className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[14px] font-bold transition-all duration-300 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white dark:hover:bg-slate-900"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.246 18.477 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                សៀវភៅ
              </button>
              <button
                onClick={() => window.open('https://saladigital.org/kh/library', '_blank')}
                className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[14px] font-bold transition-all duration-300 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white dark:hover:bg-slate-900"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.246 18.477 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                បណ្ណាល័យ
              </button>
              <button
                onClick={() => window.open('https://khmer-student-worksheet-app-1080276313561.us-west1.run.app', '_blank')}
                className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[14px] font-bold transition-all duration-300 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white dark:hover:bg-slate-900"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                តេស្ដដើមឆ្នាំ
              </button>
              <button
                onClick={() => window.open('https://plp.moeys.gov.kh/index.php', '_blank')}
                className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[14px] font-bold transition-all duration-300 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white dark:hover:bg-slate-900"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9h18" /></svg>
                PLP
              </button>
              <button
                onClick={() => window.open('https://gemini.google.com/app?hl=en', '_blank')}
                className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[14px] font-bold transition-all duration-300 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white dark:hover:bg-slate-900"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                បង្កើតរូបភាព
              </button>
              <button
                onClick={() => setShowFaqModal(true)}
                className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[14px] font-bold transition-all duration-300 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white dark:hover:bg-slate-900"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                សំណួរ/ចម្លើយ
              </button>
              <button
                onClick={() => window.open('https://ai.studio/apps/49288707-0eec-4adf-85b5-82621117ca17?fullscreenApplet=true', '_blank')}
                className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[14px] font-bold transition-all duration-300 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white dark:hover:bg-slate-900"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                បង្កើតតេស្ដ
              </button>
              <button
                onClick={() => window.open('https://ai.studio/apps/f182a726-feba-40da-8880-732e47178420?fullscreenApplet=true', '_blank')}
                className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[14px] font-bold transition-all duration-300 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white dark:hover:bg-slate-900"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                អត្ថបទ/សម្លេង
              </button>
              <button
                onClick={() => window.open('https://ai.studio/apps/a1fc35f0-96d1-4d25-a628-8528976417f5?fullscreenApplet=true', '_blank')}
                className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[14px] font-bold transition-all duration-300 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white dark:hover:bg-slate-900"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                រូបថតID4x6
              </button>
              <button
                onClick={() => {
                  const link = window.location.href;
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(link);
                  }
                  alert("បានចម្លងតំណភ្ជាប់ចែករំលែកកម្មវិធីរួចរាល់!\n\n" + link);
                }}
                className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[14px] font-bold transition-all duration-300 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                ចែករំលែក
              </button>
              {showMeetingAssistant && (
                <button
                  onClick={() => window.open('https://khmer-meeting-assistant-974359880002.us-west1.run.app', '_blank')}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[14px] font-bold transition-all duration-300 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white dark:hover:bg-slate-900"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  កំណត់ហេតុ
                </button>
              )}
            </div>
          </div>

          <main>
            {activeTab === 'lessonPlan' && renderLessonPlanContent()}
          </main>

          <footer className="mt-16 pt-10 border-t border-gray-100 dark:border-slate-800 text-center">
             {currentUser === 'admin' && (
               <button onClick={handleShowAdmin} className="group inline-flex items-center gap-3 text-purple-600 dark:text-purple-400 font-bold hover:text-purple-800 transition-all px-8 py-3 bg-purple-50 dark:bg-purple-900/10 rounded-2xl">
                <svg className="w-6 h-6 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                គ្រប់គ្រងបញ្ជីគណនី
              </button>
             )}
             <p className="mt-6 text-xs text-gray-400 dark:text-gray-500 font-medium">© {new Date().getFullYear()} កម្មវិធីជំនួយគ្រូបង្រៀន - បង្កើតឡើងដើម្បីសម្រួលការងារលោកគ្រូអ្នកគ្រូ</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default App;
