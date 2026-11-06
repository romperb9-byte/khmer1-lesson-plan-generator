
import { LessonPlanFormState } from '../types';

// Helper to convert newline characters to <br> tags and handle basic list formatting
const formatTextForHtml = (text: string): string => {
  if (!text || text.trim() === '') return '<p style="color: #888;"><em>មិនមានข้อมูล</em></p>';
  
  // Escape basic HTML characters to prevent injection
  let safeText = text.trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  // Process lines for list items
  const lines = safeText.split('\n');
  let inList = false;
  let html = '';

  lines.forEach(line => {
    line = line.trim();
    const isListItem = line.startsWith('•') || line.startsWith('-') || line.startsWith('*');

    if (isListItem && !inList) {
      html += '<ul style="margin: 0; padding-left: 20px;">';
      inList = true;
    }

    if (!isListItem && inList) {
      html += '</ul>';
      inList = false;
    }

    if (isListItem) {
      html += `<li style="margin-bottom: 5px;">${line.substring(1).trim()}</li>`;
    } else {
      if (line) {
        html += `<p style="margin: 0 0 10px 0;">${line}</p>`;
      }
    }
  });

  if (inList) {
    html += '</ul>';
  }

  // Remove empty <p> tags that might have been added
  return html.replace(/<p style="margin: 0 0 10px 0;"><\/p>/g, '');
};


const formatDateInKhmer = (dateString: string): string => {
  if (!dateString) return ".............. ខែ .............. ឆ្នាំ ..............";
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); 
    const year = date.getFullYear();
    return `ថ្ងៃទី ${day} ខែ ${month} ឆ្នាំ ${year}`;
  } catch (e) {
    return ".............. ខែ .............. ឆ្នាំ ..............";
  }
};


export const generateLmsPackageHtml = (formData: LessonPlanFormState): string => {
  const {
    date, subject, lessonNo, lessonTitle, teacherName, classInCharge,
    durationDetail, sourceBook, objectives, materials, activities,
    attachmentText, attachmentImages
  } = formData;

  const lessonFullTitle = lessonNo ? `មេរៀនទី ${lessonNo}៖ ${lessonTitle}` : lessonTitle;
  
  const activitiesToDisplay = activities.length > 0 ? activities : Array(5).fill(null).map((_, i) => ({ 
    id: `empty-${i}`,
    teacherActivity: "", lessonContent: "", studentActivity: ""
  }));

  const activitiesHtml = activitiesToDisplay.map((activity, index) => `
    <tr style="border: 1px solid #ccc; background-color: ${index % 2 === 0 ? '#f9f9f9' : '#ffffff'};">
        <td style="padding: 12px; border: 1px solid #ccc; vertical-align: top;">
            <p style="margin:0; font-weight: bold;">ជំហានទី ${index + 1}</p>
            ${formatTextForHtml(activity.lessonContent)}
        </td>
        <td style="padding: 12px; border: 1px solid #ccc; vertical-align: top;">${formatTextForHtml(activity.teacherActivity)}</td>
        <td style="padding: 12px; border: 1px solid #ccc; vertical-align: top;">${formatTextForHtml(activity.studentActivity)}</td>
    </tr>
  `).join('');

  const imagesHtml = attachmentImages && attachmentImages.length > 0
    ? attachmentImages.map(image => 
        `<img src="${image.data}" alt="ឯកសារភ្ជាប់" style="max-width: 100%; height: auto; border-radius: 5px; margin-top: 10px; border: 1px solid #ddd;">`
      ).join('')
    : '';

  const attachmentHtml = (attachmentText || (attachmentImages && attachmentImages.length > 0)) ? `
    <div style="margin-top: 30px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #fcfcfc;">
        <h2 style="font-size: 1.5em; color: #444; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 0;">ឯកសារភ្ជាប់</h2>
        ${attachmentText ? `<div style="margin-top: 15px;"><h3>អត្ថបទយោង៖</h3><div>${formatTextForHtml(attachmentText)}</div></div>` : ''}
        ${(attachmentImages && attachmentImages.length > 0) ? `<div style="margin-top: 15px;"><h3>រូបភាពយោង៖</h3>${imagesHtml}</div>` : ''}
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="km">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>កិច្ចតែងការបង្រៀន: ${lessonTitle}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            /* This style block might be stripped by some LMS, but is good for standalone viewing */
            body { font-family: 'Kantumruy Pro', sans-serif; line-height: 1.6; color: #333; }
        </style>
    </head>
    <body style="font-family: 'Kantumruy Pro', sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 900px; margin: auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 15px rgba(0,0,0,0.1);">
            
            <header style="text-align: center; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="font-size: 2em; color: #333; margin: 0;">កិច្ចតែងការបង្រៀន</h1>
                <h2 style="font-size: 1.6em; color: #555; margin: 10px 0;">${lessonFullTitle}</h2>
            </header>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                <p><strong>មុខវិជ្ជា:</strong> ${subject || '...'}</p>
                <p><strong>ថ្នាក់ទទួលបន្ទុក:</strong> ${classInCharge || '...'}</p>
                <p><strong>បង្រៀនដោយ:</strong> ${teacherName || '...'}</p>
                <p><strong>រយៈពេល:</strong> ${durationDetail || '...'}</p>
                <p><strong>កាលបរិច្ឆេទ:</strong> ${formatDateInKhmer(date)}</p>
                <p><strong>ឯកសារយោង:</strong> ${sourceBook || '...'}</p>
            </div>

            <div style="margin-top: 30px;">
                <h2 style="font-size: 1.5em; color: #444; border-bottom: 2px solid #eee; padding-bottom: 10px;">I. វត្ថុបំណង</h2>
                <div style="padding: 10px 0;">${formatTextForHtml(objectives)}</div>
            </div>
            
            <div style="margin-top: 30px;">
                <h2 style="font-size: 1.5em; color: #444; border-bottom: 2px solid #eee; padding-bottom: 10px;">II. សម្ភារឧបទេស</h2>
                <div style="padding: 10px 0;">${formatTextForHtml(materials)}</div>
            </div>

            <div style="margin-top: 30px;">
                <h2 style="font-size: 1.5em; color: #444; border-bottom: 2px solid #eee; padding-bottom: 10px;">III. ដំណើរការបង្រៀន និងរៀន</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 0.95em;">
                    <thead>
                        <tr style="background-color: #f2f2f2; font-weight: bold; text-align: left;">
                            <th style="padding: 12px; border: 1px solid #ccc;">ខ្លឹមសារមេរៀន</th>
                            <th style="padding: 12px; border: 1px solid #ccc;">សកម្មភាពគ្រូ</th>
                            <th style="padding: 12px; border: 1px solid #ccc;">សកម្មភាពសិស្ស</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${activitiesHtml}
                    </tbody>
                </table>
            </div>

            ${attachmentHtml}

        </div>
    </body>
    </html>
  `;
};