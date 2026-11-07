
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LessonPlanFormState, Activity } from "../types";

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

interface GeneratedLessonPlanStructuredContent {
  objectives: string;
  materials: string;
  activities?: Array<{
    teacherActivity: string;
    lessonContent: string;
    studentActivity: string;
  }>;
}

async function callWithRetry<T>(fn: () => Promise<T>, retries = 5, delay = 3000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = String(error.message || error.details || "").toLowerCase();
    const status = error.status || (error.error && error.error.code);
    
    // Check for rate limit (429), internal errors (500), and overloaded/unavailable (503)
    const isRetryable = 
      status === 429 || status === 500 || status === 503 ||
      errorStr.includes('429') || errorStr.includes('500') || errorStr.includes('503') ||
      errorStr.includes('resource_exhausted') || errorStr.includes('quota') || 
      errorStr.includes('overloaded') || errorStr.includes('unavailable');
    
    if (retries > 0 && isRetryable) {
      console.log(`AI busy or limited. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

function sanitizeAiJson(jsonStr: string): string {
  let cleaned = jsonStr.trim();
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = cleaned.match(fenceRegex);
  if (match && match[1]) cleaned = match[1].trim();
  return cleaned.replace(/"((?:[^"\\]|\\.)*)"/g, (match, p1) => {
    return `"${p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')}"`;
  });
}

function cleanHtmlTags(text: string | undefined | null): string {
  if (!text) return "";
  let cleaned = text.replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<li>/gi, '\n• ')
                    .replace(/<\/?[?^>]+(>|$)/g, "")
                    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&")
                    .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
                    .replace(/&quot;/gi, "\"").replace(/&#39;/gi, "'");
  return cleaned.split('\n').map(line => line.trim()).join('\n').trim();
}

export const generateLessonPlanContentWithGemini = async (
  formData: Pick<LessonPlanFormState, 'subject' | 'lessonTitle' | 'classInCharge' | 'durationDetail' | 'attachmentText' | 'attachmentImages'> & { lessonSubtitle?: string; lessonNo?: string },
  customApiKey?: string
): Promise<GeneratedLessonPlanStructuredContent> => {
  const gradeInput = formData.classInCharge || "";
  
  // Determine age group based on grade input
  let ageGroup = "General";
  let ageRange = "";
  let isLowerGrade = false;
  let isMiddleGrade = false;
  let isUpperGrade = false;

  if (/1|2|3|១|២|៣/.test(gradeInput) && !/10|11|12|១០|១១|១២/.test(gradeInput)) {
    ageGroup = "កុមារតូច (ថ្នាក់ទី១-៣)";
    ageRange = "៦-៨ ឆ្នាំ";
    isLowerGrade = true;
  } else if (/4|5|6|៤|៥|៦/.test(gradeInput)) {
    ageGroup = "កុមារមធ្យម (ថ្នាក់ទី៤-៦)";
    ageRange = "៩-១២ ឆ្នាំ";
    isMiddleGrade = true;
  } else if (/7|8|9|10|11|12|៧|៨|៩|១០|១១|១២/.test(gradeInput)) {
    ageGroup = "យុវជន (ថ្នាក់ទី៧-១២)";
    ageRange = "១៣-១៨ ឆ្នាំ";
    isUpperGrade = true;
  }

  const step1Content = "ពិនិត្យអនាម័យ វត្តមាន សណ្ដាប់ធ្នាប់ លំនឹងថ្នាក់រៀង";

  let methodologyInstruction = "";
  if (isLowerGrade) {
    methodologyInstruction = `
**វិធីសាស្ត្របង្រៀន៖ ការរៀនតាមបែបការសាកសួរ រួមជាមួយវិធីសាស្ត្រ "ខ្ញុំធ្វើ យើងធ្វើ អ្នកធ្វើ" សម្រាប់កុមារតូច (ថ្នាក់ទី១-៣) អាយុ ៦-៨ ឆ្នាំ:**
- **កម្រិតភាសា:** ប្រើពាក្យងាយៗ ខ្លីៗ ងាយយល់ និងមានរូបភាពរស់រវើកក្នុងចិត្ត។ កុំប្រើភាសាអង់គ្លេស។
- **ជំហានទី១ (ការគ្រប់គ្រងថ្នាក់):** ខ្លឹមសារគឺ "${step1Content}"។
- **ជំហានទី២ (ការរំញោចការចង់ដឹង):** គ្រូដាក់ចេញនូវសំណួរគន្លឹះ ឬបង្ហាញវត្ថុពិត/រូបភាព ដើម្បីឱ្យសិស្សងឿងឆ្ងល់ និងចង់ដឹង។
- **ជំហានទី៣ (ការរុករក និងការបង្ហាញមេរៀនថ្មី):** 
    * ក្នុងជំហាននេះ ត្រូវសរសេរខ្លឹមសារ និងសកម្មភាពតាមលំដាប់លំដោយ៖
        1. **ខ្ញុំធ្វើ:** គ្រូជាអ្នកបង្ហាញ និងពន្យល់ (ការបង្ហាញ)។
        2. **យើងធ្វើ:** គ្រូ និងសិស្សធ្វើសកម្មភាពជាមួយគ្នា (ការអនុវត្តរួមគ្នា)។
        3. **អ្នកធ្វើ:** សិស្សធ្វើដោយខ្លួនឯង (ការអនុវត្តបុគ្គល)។
    * ខ្លឹមសារមេរៀន (Lesson Content) ក្នុងជំហាននេះ ត្រូវតែសរសេរឱ្យបាន **វែង លម្អិត និងស៊ីជម្រៅបំផុត**។
    * សកម្មភាពគ្រូ និងសកម្មភាពសិស្ស ក៏ត្រូវតែសរសេរឱ្យបានលម្អិតខ្លាំងបំផុតក្នុងជំហាននេះ។
    * ត្រូវបែងចែកជាផ្នែកៗដូចជា៖ ការស្ស្គាល់សូរ, ការសម្គាល់តួអក្សរ, ការអានព្យាង្គ/ពាក្យ, និងការសរសេរ។
- **ជំហានទី៤ (ការពង្រីកចំណេះដឹង):** សិស្សអនុវត្តលំហាត់ច្នៃប្រឌិត ឬល្បែងសិក្សាដើម្បីពង្រឹងអ្វីដែលបានរកឃើញ។
- **ជំហានទី៥ (ការវាយតម្លៃ និងកិច្ចការផ្ទះ):** ពិនិត្យមើលលទ្ធផលរៀនសូត្រ និងផ្ដល់បណ្ដាំផ្ញើ។
    `;
  } else if (isMiddleGrade) {
    methodologyInstruction = `
**វិធីសាស្ត្របង្រៀន៖ សម្រាប់កុមារមធ្យម (ថ្នាក់ទី៤-៦) អាយុ ៩-១២ ឆ្នាំ:**
- **កម្រិតភាសា:** ប្រើភាសាសាមញ្ញ មិនប្រើភាសាអង់គ្លេស។ ផ្ដោតលើការយល់ដឹងពីហេតុ និងផល។
- **ជំហានទី១ (ការគ្រប់គ្រងថ្នាក់):** ខ្លឹមសារគឺ "${step1Content}"។
- **ជំហានទី២ (រំលឹកមេរៀនចាស់):** សួរសំណួររំលឹកមេរៀនមុន និងភ្ជាប់ទៅមេរៀនថ្មី។
- **ជំហានទី៣ (ការបង្រៀនមេរៀនថ្មី):** ពន្យល់ខ្លឹមសារឱ្យបានលម្អិត ប្រើឧទាហរណ៍ក្នុងជីវភាពរស់នៅប្រចាំថ្ងៃ។ ត្រូវសរសេរខ្លឹមសារមេរៀន សកម្មភាពគ្រូ និងសកម្មភាពសិស្សឱ្យបានច្រើន និងលម្អិតបំផុត។
- **ជំហានទី៤ (ការអនុវត្ត):** ឱ្យសិស្សធ្វើលំហាត់ជាបុគ្គល ឬជាក្រុមតូចៗ។
- **ជំហានទី៥ (ការសង្ខេប និងកិច្ចការផ្ទះ):** សង្ខេបចំណុចសំខាន់ៗ និងដាក់កិច្ចការផ្ទះ។
    `;
  } else if (isUpperGrade) {
    methodologyInstruction = `
**វិធីសាស្ត្របង្រៀន៖ សម្រាប់យុវជន (ថ្នាក់ទី៧-១២) អាយុ ១៣-១៨ ឆ្នាំ:**
- **កម្រិតភាសា:** ប្រើភាសាផ្លូវការ បច្ចេកទេស និងស៊ីជម្រៅ។ មិនប្រើភាសាអង់គ្លេសក្នុងការពន្យល់។ ផ្ដោតលើការវិភាគ ការរិះគន់ និងការអនុវត្តជាក់ស្ដែង។
- **ការសរសេររូបមន្ត (Math/Science):** ចំពោះមុខវិជ្ជា គណិតវិទ្យា រូបវិទ្យា និងគីមីវិទ្យា ត្រូវសរសេររូបមន្តឱ្យបានច្បាស់លាស់បំផុត។ 
    * ប្រើនិមិត្តសញ្ញា ^ សម្រាប់ស្វ័យគុណ (ឧទាហរណ៍៖ x^2 វានឹងបង្ហាញជា x²) និង _ សម្រាប់សន្ទស្សន៍ (ឧទាហរណ៍៖ H_2O វានឹងបង្ហាញជា H₂O)។
    * ប្រើប្រភាគ (ឧទាហរណ៍៖ (a+b)/c) ប្រើឫស (ឧទាហរណ៍៖ √x)។
    * សម្រាប់ការទាញយកជា Word ត្រូវសរសេររូបមន្តឱ្យមានលក្ខណៈស្តង់ដារដែលមនុស្សងាយស្រួលមើល និងយល់។
- **ជំហានទី១ (ការគ្រប់គ្រងថ្នាក់):** ខ្លឹមសារគឺ "${step1Content}"។
- **ជំហានទី២ (ការនាំចូលមេរៀន):** ភ្ជាប់មេរៀនទៅនឹងបញ្ហាសង្គម ឬវិទ្យាសាស្ត្រជាក់ស្ដែង។
- **ជំហានទី៣ (ការបង្ហាញខ្លឹមសារ):** បង្រៀនតាមបែបបទបង្ហាញ និងការពិភាក្សា। ខ្លឹមសារត្រូវមានភាពស៊ីជម្រៅ។ ត្រូវសរសេរខ្លឹមសារមេរៀន សកម្មភាពគ្រូ និងសកម្មភាពសិស្សឱ្យបានច្រើន និងលម្អិតបំផុត។
- **ជំហានទី៤ (ការអនុវត្ត និងការវិភាគ):** ឱ្យសិស្សវិភាគករណីសិក្សា ឬធ្វើពិសោធន៍/លំហាត់កម្រិតខ្ពស់។
- **ជំហានទី៥ (ការវាយតម្លៃ):** វាយតម្លៃតាមរយៈការពិភាក្សា ឬការធ្វើតេស្តខ្លីៗ។
    `;
  } else {
    methodologyInstruction = `ប្រើប្រាស់ទម្រង់ ៥ ជំហានស្ដង់ដារសម្រាប់សិស្សទូទៅ កុំប្រើភាសាអង់គ្លេស និងផ្ដោតខ្លាំងលើជំហានទី៣។`;
  }

  const promptText = `
អ្នកគឺជាអ្នកជំនាញជាន់ខ្ពស់ផ្នែកគរុកោសល្យ និងការរៀបចំកិច្ចតែងការបង្រៀននៅកម្ពុជា។ 
ចូរបង្កើតមាតិកាដែលមាន **ខ្លឹមសារវែង និងលម្អិតបំផុត (Extremely Detailed and Long Content)** សម្រាប់សិស្សក្នុងក្រុមអាយុ ${ageRange} (${ageGroup})។

ព័ត៌មានមូលដ្ឋាន៖
- មុខវិជ្ជា៖ ${formData.subject}
- មេរៀន៖ ${formData.lessonNo ? `មេរៀនទី ${formData.lessonNo}៖ ` : ''}${formData.lessonTitle}${formData.lessonSubtitle ? ` (ចំណងជើងរង៖ ${formData.lessonSubtitle})` : ''}
- ថ្នាក់៖ ${formData.classInCharge}

${methodologyInstruction}

**លក្ខខណ្ឌពិសេសបន្ថែម៖**
1. **ចំនួនជំហាន:** ត្រូវបង្កើតឱ្យមានត្រឹមតែ **៥ ជំហាន (Step 1 to Step 5)** ប៉ុណ្ណោះ។ ហាមដាច់ខាតមិនឱ្យមានជំហានទី ៦ ឬ ៧។
2. **ខ្លឹមសារមេរៀន និងសកម្មភាព (Step 3):** ក្នុងជំហានទី ៣ ត្រូវសរសេរ "សកម្មភាពគ្រូ", "ខ្លឹមសារមេរៀន", និង "សកម្មភាពសិស្ស" ឱ្យបានច្រើន លម្អិត និងស៊ីជម្រៅបំផុត។
3. **ភាសា:** ត្រូវប្រើភាសាខ្មែរ ១០០% ហាមប្រើភាសាអង់គ្លេសក្នុងអត្ថបទពន្យល់ ឬជំហាននានា។
4. **ជំហានទី១:** ត្រូវតែប្រើឃ្លា "${step1Content}"។
5. **វត្ថុបំណង:** បែងចែកជា វិជ្ជាសម្បទា បំណិនសម្បទា និងចរិយាសម្បទា។

សូមផ្ដល់លទ្ធផលជា JSON object តែមួយគត់ដែលមាន arrays of exactly 5 activities:
{
  "objectives": "string",
  "materials": "string",
  "activities": [
    { "teacherActivity": "string", "lessonContent": "string", "studentActivity": "string" }
  ]
}
`;

  const parts: any[] = [{ text: promptText }];
  if (formData.attachmentImages?.length) {
    formData.attachmentImages.forEach(img => {
      parts.push({ inlineData: { mimeType: img.mimeType, data: img.data.split(',')[1] } });
    });
  }

  const effectiveKey = customApiKey || getGeminiApiKey();
  if (!effectiveKey) {
    throw new Error("មិនទាន់បានកំណត់ Google Gemini API Key នៅឡើយទេ។ សូមបិទភ្ជាប់ API Key នៅរបារខាងលើនៃកម្មវិធី!");
  }
  const ai = new GoogleGenAI({ apiKey: effectiveKey });
  const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: { parts },
    config: { responseMimeType: "application/json" }
  }));
  
  const parsedData = JSON.parse(sanitizeAiJson(response.text)) as GeneratedLessonPlanStructuredContent;
  parsedData.objectives = cleanHtmlTags(parsedData.objectives);
  parsedData.materials = cleanHtmlTags(parsedData.materials);
  parsedData.activities = (parsedData.activities || []).map(act => ({
    teacherActivity: cleanHtmlTags(act.teacherActivity),
    lessonContent: cleanHtmlTags(act.lessonContent),
    studentActivity: cleanHtmlTags(act.studentActivity),
  }));

  return parsedData;
};
