
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import PptxGenJS from 'pptxgenjs';
import { LessonPlanFormState } from "../types";

export const getGeminiApiKey = (): string => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem('GOOGLE_AI_STUDIO_API_KEY') || window.localStorage.getItem('GEMINI_API_KEY');
    if (stored && stored.trim()) return stored.trim();
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) {
    return (import.meta as any).env.VITE_GEMINI_API_KEY;
  }
  if (typeof process !== 'undefined' && (process.env as any)?.GEMINI_API_KEY) {
    return (process.env as any).GEMINI_API_KEY;
  }
  return "";
};

export interface SlideStructure {
  slideTitle: string;
  slideContent: string;
  imagePrompt: string;
}

export interface SlideContent {
  slideTitle: string;
  slideContent: string;
  imageData?: string;
}

async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1500): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = String(error?.message || error?.details || "").toLowerCase();
    const status = error?.status || (error?.error && error?.error?.code);

    const isRetryable = 
      status === 429 || status === 500 || status === 503 ||
      errorStr.includes('429') || errorStr.includes('500') || errorStr.includes('503') ||
      errorStr.includes('overloaded') || errorStr.includes('unavailable') || errorStr.includes('quota');

    if (retries > 0 && isRetryable) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

export function sanitizeAiJson(jsonStr: string): string {
  let cleaned = jsonStr.trim();
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = cleaned.match(fenceRegex);
  if (match && match[1]) cleaned = match[1].trim();
  return cleaned.replace(/"((?:[^"\\]|\\.)*)"/g, (match, p1) => {
    return `"${p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')}"`;
  });
}

export function cleanText(text: any): string {
  if (!text) return "";
  let cleaned = String(text).replace(/<br\s*\/?>/gi, '\n')
                            .replace(/<li>/gi, '\n• ')
                            .replace(/<\/?[^>]+(>|$)/g, "")
                            .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&")
                            .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
                            .replace(/&quot;/gi, "\"").replace(/&#39;/gi, "'");
  return cleaned.split('\n').map(line => line.trim()).filter(Boolean).join('\n').trim();
}

export const generateSlideStructures = async (
  lessonContent: string,
  lessonTitle: string,
  subject: string,
  grade: string,
  customApiKey?: string
): Promise<SlideStructure[]> => {
    // Determine age group based on grade input
    let ageGroup = "General";
    let ageRange = "";
    let isLowerGrade = false;
    let isMiddleGrade = false;
    let isUpperGrade = false;

    if (/1|2|3|១|២|៣/.test(grade) && !/10|11|12|១០|១១|១២/.test(grade)) {
      ageGroup = "កុមារតូច (ថ្នាក់ទី១-៣)";
      ageRange = "៦-៨ ឆ្នាំ";
      isLowerGrade = true;
    } else if (/4|5|6|៤|៥|៦/.test(grade)) {
      ageGroup = "កុមារមធ្យម (ថ្នាក់ទី៤-៦)";
      ageRange = "៩-១២ ឆ្នាំ";
      isMiddleGrade = true;
    } else if (/7|8|9|10|11|12|៧|៨|៩|១០|១១|១២/.test(grade)) {
      ageGroup = "យុវជន (ថ្នាក់ទី៧-១២)";
      ageRange = "១៣-១៨ ឆ្នាំ";
      isUpperGrade = true;
    }

    let specificInstruction = "";
    if (isLowerGrade) {
      specificInstruction = `
- slideTitle: ខ្លី ពីរោះ ងាយយល់សម្រាប់កុមារតូច (ឧទាហរណ៍៖ "តោះរៀនស្គាល់..." ឬ "ចំណុចសំខាន់")
- slideContent: ២-៣ ចំណុចខ្លីៗ ប្រើពាក្យសាមញ្ញបំផុត ងាយស្រួលអានលើស្លាយ
- imagePrompt: ពិពណ៌នារូបភាពជាភាសាអង់គ្លេសច្បាស់លាស់ (ឧ៖ "Cute colorful 3D educational illustration of [topic], Pixar animation style, vibrant, bright clean background, friendly for children")
      `;
    } else if (isMiddleGrade) {
      specificInstruction = `
- slideTitle: ច្បាស់លាស់ ទាក់ទាញ និងចំប្រធានបទ
- slideContent: ៣-៤ ចំណុចសំខាន់ៗ ងាយស្រួលបង្រៀន និងយល់
- imagePrompt: ពិពណ៌នារូបភាពជាភាសាអង់គ្លេស (ឧ៖ "Clear educational diagram and illustration of [topic], vector flat art, vibrant and informative, white background")
      `;
    } else {
      specificInstruction = `
- slideTitle: ផ្លូវការ ច្បាស់លាស់ និងស្របតាមកម្រិតវិទ្យាល័យ
- slideContent: ៣-៤ ចំណុចគន្លឹះ សង្ខេបខ្លឹមសារស្នូល និងរូបមន្ត/និយមន័យ
- imagePrompt: ពិពណ៌នារូបភាពជាភាសាអង់គ្លេស (ឧ៖ "Professional infographic illustration of [topic], clean modern presentation visual, high contrast, minimalist educational style")
      `;
    }

    const prompt = `
អ្នកគឺជាអ្នកជំនាញបង្កើតបទបង្ហាញបង្រៀន (Presentation / Google Slides Specialist) សម្រាប់គ្រូបង្រៀនកម្ពុជា។
ចូរបង្កើតស្លាយមេរៀនគុណភាពខ្ពស់ ងាយស្រួលបង្រៀន និងបង្ហាញសិស្ស ស្របតាមកម្រិតសិស្ស ${ageRange} (${ageGroup})។

ពត៌មានមេរៀន៖
- មុខវិជ្ជា៖ ${subject || "ទូទៅ"}
- មេរៀន៖ ${lessonTitle || "មេរៀន"}
- ថ្នាក់៖ ${grade || "ទូទៅ"}
- ខ្លឹមសារមេរៀន៖ ${lessonContent}

**តម្រូវការបង្កើតស្លាយ (៦ ទៅ ៨ ស្លាយសំខាន់ៗ)៖**
១. ស្លាយទី១: សេចក្តីផ្តើម និងចំណងជើងមេរៀន
២. ស្លាយទី២: វត្ថុបំណងមេរៀន (ចំណេះដឹង បំណិន ឥរិយាបថ)
៣. ស្លាយទី៣ ដល់ ៥/៦: ខ្លឹមសារស្នូល និងការពន្យល់លម្អិតជាចំណុចៗ
៤. ស្លាយចុងក្រោយ: សង្ខេបមេរៀន និងសំណួរ/លំហាត់អនុវត្ត

លក្ខណៈស្លាយនីមួយៗ៖
${specificInstruction}

ផ្ដល់លទ្ធផលត្រឹមតែជា JSON Array នៃ Object ដែលមាន keys: "slideTitle", "slideContent", "imagePrompt"។
`;
    
    const ai = new GoogleGenAI({ apiKey: customApiKey || getGeminiApiKey() });
    const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          temperature: 0.3
        }
    }));
    
    return JSON.parse(sanitizeAiJson(response.text));
}

export const generateImageForSlide = async (prompt: string, grade: string, customApiKey?: string): Promise<string> => {
    if (!prompt) return ""; 
    try {
        const isLowerGrade = /1|2|3|១|២|៣/.test(grade) && !/10|11|12|១០|១១|១២/.test(grade);
        const isMiddleGrade = /4|5|6|៤|៥|៦/.test(grade);

        let style = "clean educational vector illustration, vibrant flat colors, white background, modern slide presentation asset";
        if (isLowerGrade) {
            style = "cute 3D cartoon style, Pixar-like, friendly characters, bright joyful colors, isolated on white background, educational children illustration";
        } else if (isMiddleGrade) {
            style = "bright educational illustration, clean clear vector infographic, friendly and professional, clean background";
        } else {
            style = "clean modern educational infographic visual, professional minimalist diagram, high clarity, clean white background";
        }
        
        const ai = new GoogleGenAI({ apiKey: customApiKey || getGeminiApiKey() });
        const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: { parts: [{ text: `${prompt}, ${style}` }] },
            config: { imageConfig: { aspectRatio: "16:9" } },
        }), 2, 1000);

        const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        return part ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : "";
    } catch (err) {
        console.warn("Image generation fallback:", err);
        return ""; 
    }
}

export const createPptxPresentation = async (
  presentationTitle: string, 
  slides: SlideContent[], 
  formData: LessonPlanFormState
): Promise<Blob> => {
    const pptx = new PptxGenJS();
    // Standard Google Slides / PowerPoint 16:9 layout
    pptx.layout = 'LAYOUT_16x9'; 
    pptx.author = formData.teacherName || "គ្រូបង្រៀន";
    pptx.company = (formData as any).schoolName || "សាលារៀន";
    pptx.subject = formData.subject || "កិច្ចតែងការបង្រៀន";
    pptx.title = presentationTitle;

    const KHMER_FONT = "Khmer OS Siemreap";
    const COLOR_PRIMARY = "1E3A8A"; // Deep navy blue
    const COLOR_ACCENT = "0D9488";  // Teal accent
    const COLOR_TEXT = "1F2937";    // Dark slate text
    const COLOR_MUTED = "4B5563";   // Muted gray
    
    const grade = formData.classInCharge || "";
    const isLowerGrade = /1|2|3|១|២|៣/.test(grade) && !/10|11|12|១០|១១|១២/.test(grade);
    const isMiddleGrade = /4|5|6|៤|៥|៦/.test(grade);

    let titleBgColor = 'EEF2FF'; // Soft indigo
    let bannerColor = '3B82F6';
    if (isLowerGrade) {
        titleBgColor = 'FEF3C7'; // Warm amber/yellow
        bannerColor = 'F59E0B';
    } else if (isMiddleGrade) {
        titleBgColor = 'ECFDF5'; // Fresh emerald
        bannerColor = '10B981';
    }

    // 1. Define Slide Master with clean footer & standard 16:9 guides
    pptx.defineSlideMaster({
        title: "LESSON_MASTER",
        background: { color: "FFFFFF" },
        objects: [
            // Top subtle branding line
            { rect: { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: bannerColor } } },
            // Bottom footer line & metadata
            { rect: { x: 0, y: 7.1, w: '100%', h: 0.4, fill: { color: 'F8FAFC' } } },
            { 
              text: { 
                text: `${formData.subject ? formData.subject + ' • ' : ''}${formData.lessonTitle || 'មេរៀន'}${formData.classInCharge ? ' (' + formData.classInCharge + ')' : ''}`, 
                options: { x: 0.5, y: 7.12, w: 8.5, h: 0.35, fontFace: KHMER_FONT, fontSize: 10, color: COLOR_MUTED } 
              } 
            },
            { 
              text: { 
                text: "Google Slides & PowerPoint Ready", 
                options: { x: 9.5, y: 7.12, w: 3.3, h: 0.35, align: 'right', fontFace: 'Arial', fontSize: 9, color: "94A3B8" } 
              } 
            }
        ],
    });

    // 2. Cover / Title Slide
    const titleSlide = pptx.addSlide();
    // Background card
    titleSlide.addShape(pptx.ShapeType.roundRect, { 
      x: 0.6, y: 0.6, w: 12.13, h: 6.3, 
      fill: { color: titleBgColor }, 
      line: { color: bannerColor, width: 2 } 
    });

    // Subject & Grade Badge
    const badgeText = `${formData.subject || 'មុខវិជ្ជា'} ${formData.classInCharge ? '• ' + formData.classInCharge : ''}`;
    titleSlide.addText(badgeText, {
        x: 1.0, y: 1.3, w: 11.33, align: 'center',
        fontFace: KHMER_FONT, fontSize: 18, bold: true, color: bannerColor
    });

    // Main Lesson Title
    titleSlide.addText(presentationTitle, {
        x: 1.0, y: 2.2, w: 11.33, h: 2.0,
        align: 'center', fontFace: KHMER_FONT, fontSize: 36, bold: true, color: COLOR_PRIMARY,
        valign: 'middle'
    });

    // Teacher & School details
    const teacherInfo = [
      formData.teacherName ? `គ្រូបង្រៀន៖ ${formData.teacherName}` : '',
      (formData as any).schoolName ? `សាលារៀន៖ ${(formData as any).schoolName}` : '',
      formData.date ? `កាលបរិច្ឆេទ៖ ${formData.date}` : ''
    ].filter(Boolean).join('  |  ');

    if (teacherInfo) {
      titleSlide.addText(teacherInfo, {
          x: 1.0, y: 4.8, w: 11.33, align: 'center',
          fontFace: KHMER_FONT, fontSize: 14, color: COLOR_MUTED
      });
    }

    // 3. Content Slides
    slides.forEach((s, idx) => {
        const slide = pptx.addSlide({ masterName: "LESSON_MASTER" });
        
        // Slide Number Pill
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.6, y: 0.35, w: 1.1, h: 0.45,
          fill: { color: bannerColor },
          rectRadius: 0.1
        });
        slide.addText(`ស្លាយ ${idx + 1}`, {
          x: 0.6, y: 0.35, w: 1.1, h: 0.45,
          align: 'center', valign: 'middle',
          fontFace: KHMER_FONT, fontSize: 11, bold: true, color: "FFFFFF"
        });

        // Slide Title
        slide.addText(s.slideTitle, { 
            x: 1.9, y: 0.3, w: 10.8, h: 0.65, 
            fontFace: KHMER_FONT, fontSize: 24, bold: true, color: COLOR_PRIMARY,
            valign: 'middle'
        });

        // Split content into clean bullets
        const contentLines = s.slideContent.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => line.replace(/^[•\-\*\d\.\)]\s*/, ''));

        if (s.imageData) {
            // Layout with Image (50% Image Left, 50% Text Right)
            slide.addImage({ 
                data: s.imageData, 
                x: 0.6, y: 1.2, w: 5.6, h: 5.5, 
                sizing: { type: 'contain', w: 5.6, h: 5.5 } 
            });
            
            // Text Card
            slide.addShape(pptx.ShapeType.roundRect, {
              x: 6.5, y: 1.2, w: 6.2, h: 5.5,
              fill: { color: "F8FAFC" },
              line: { color: "E2E8F0", width: 1 },
              rectRadius: 0.15
            });

            slide.addText(
                contentLines.map(line => ({ 
                  text: line, 
                  options: { bullet: true, color: COLOR_TEXT, margin: [0, 0, 8, 0] } 
                })), 
                {
                    x: 6.8, y: 1.4, w: 5.6, h: 5.0, 
                    fontFace: KHMER_FONT, fontSize: 18,
                    valign: 'top', lineSpacing: 28
                }
            );
        } else {
            // Layout without Image: Wide spacious content cards
            slide.addShape(pptx.ShapeType.roundRect, {
              x: 0.8, y: 1.2, w: 11.7, h: 5.5,
              fill: { color: "F8FAFC" },
              line: { color: "E2E8F0", width: 1 },
              rectRadius: 0.15
            });

            slide.addText(
                contentLines.map(line => ({ 
                  text: line, 
                  options: { bullet: true, color: COLOR_TEXT, margin: [0, 0, 12, 0] } 
                })), 
                { 
                    x: 1.3, y: 1.6, w: 10.7, h: 4.8, 
                    fontFace: KHMER_FONT, fontSize: 22,
                    valign: 'top', lineSpacing: 34
                }
            );
        }
    });

    return pptx.write({ outputType: 'blob' }) as Promise<Blob>; 
};

// Parallel batch image generator with concurrency control for ultra-fast generation
async function mapConcurrent<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      try {
        results[idx] = await fn(items[idx], idx);
      } catch (err) {
        console.error(`Error in concurrent task ${idx}:`, err);
      }
    }
  });

  await Promise.all(workers);
  return results;
}

export const prepareSlideContent = async (
  formData: LessonPlanFormState, 
  customApiKey?: string,
  onProgress?: (msg: string, percent: number) => void
): Promise<SlideContent[]> => {
    onProgress?.("កំពុងរៀបចំរចនាសម្ព័ន្ធស្លាយ...", 15);
    
    const lessonContent = formData.activities.map(act => act.lessonContent).filter(Boolean).join('\n\n');
    const structures = await generateSlideStructures(
      lessonContent, 
      formData.lessonTitle, 
      formData.subject, 
      formData.classInCharge, 
      customApiKey
    );

    onProgress?.(`បានបង្កើតរចនាសម្ព័ន្ធ ${structures.length} ស្លាយ។ កំពុងបង្កើតរូបភាពល្បឿនលឿន...`, 40);

    // Generate images concurrently (3 at a time) for speed
    let completedImages = 0;
    const slidesWithImages = await mapConcurrent(structures, 3, async (struct, index) => {
      let img = "";
      if (struct.imagePrompt) {
        img = await generateImageForSlide(struct.imagePrompt, formData.classInCharge, customApiKey);
      }
      completedImages++;
      const currentPercent = Math.min(95, 40 + Math.round((completedImages / structures.length) * 55));
      onProgress?.(`កំពុងបង្កើតរូបភាពស្លាយ (${completedImages}/${structures.length})...`, currentPercent);
      
      return {
        slideTitle: cleanText(struct.slideTitle),
        slideContent: cleanText(struct.slideContent),
        imageData: img || undefined
      };
    });

    onProgress?.("បង្កើតស្លាយរួចរាល់!", 100);
    return slidesWithImages;
};

export const generateSlides = async (
  formData: LessonPlanFormState, 
  customApiKey?: string,
  onProgress?: (msg: string, percent: number) => void
): Promise<Blob> => {
    const contents = await prepareSlideContent(formData, customApiKey, onProgress);
    return createPptxPresentation(formData.lessonTitle, contents, formData);
};

