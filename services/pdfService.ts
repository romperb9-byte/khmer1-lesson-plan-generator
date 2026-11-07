
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { LessonPlanFormState } from "../types";

/**
 * Formats a date string into Khmer date format
 */
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

/**
 * Generates a PDF version of the lesson plan.
 */
export const generateLessonPlanPdf = async (formData: LessonPlanFormState): Promise<Blob> => {
  if (document.fonts) {
    await document.fonts.ready;
  }

  const {
    date, subject, lessonNo, lessonTitle, lessonSubtitle, teacherName, classInCharge,
    durationDetail, sourceBook, objectives, materials, activities
  } = formData;

  const formattedDate = formatDateInKhmer(date);
  let lessonFullTitle = lessonNo ? `មេរៀនទី ${lessonNo}៖ ${lessonTitle}` : lessonTitle;
  if (lessonSubtitle && lessonSubtitle.trim()) {
    lessonFullTitle += ` (ចំណងជើងរង៖ ${lessonSubtitle.trim()})`;
  }

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-5000px';
  container.style.top = '0';
  container.style.width = '210mm'; 
  container.style.backgroundColor = 'white';
  container.style.color = 'black';
  container.style.fontFamily = "'Kantumruy Pro', sans-serif";
  container.style.padding = '20mm';
  container.style.boxSizing = 'border-box';

  const activitiesHtml = (activities.length > 0 ? activities : Array(5).fill({ teacherActivity: ' ', lessonContent: ' ', studentActivity: ' ' }))
    .map((act, idx) => {
      return `
        <tr>
          <td style="border: 1px solid black; padding: 10px; vertical-align: top; width: 30%; font-size: 13px;">
            ${(act.teacherActivity || ' ').replace(/\n/g, '<br>')}
          </td>
          <td style="border: 1px solid black; padding: 10px; vertical-align: top; width: 40%; font-size: 13px;">
            <div style="font-weight: bold; margin-bottom: 5px;">ជំហានទី ${idx + 1}៖</div>
            ${(act.lessonContent || ' ').replace(/\n/g, '<br>')}
          </td>
          <td style="border: 1px solid black; padding: 10px; vertical-align: top; width: 30%; font-size: 13px;">
            ${(act.studentActivity || ' ').replace(/\n/g, '<br>')}
          </td>
        </tr>
      `;
    }).join('');

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 5px; font-weight: bold; font-size: 18px;">ព្រះរាជាណាចក្រកម្ពុជា</div>
    <div style="text-align: center; margin-bottom: 10px; font-weight: bold; font-size: 18px;">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
    <div style="text-align: center; margin-bottom: 15px; font-size: 14px;">✧ ☆ ✧</div>
    <div style="text-align: center; margin-bottom: 35px; font-weight: bold; font-size: 16px;">ក្រសួងអប់រំ យុវជន និងកីឡា</div>

    <div style="text-align: center; font-weight: bold; font-size: 28px; margin-bottom: 10px; color: #1a1a1a;">កិច្ចតែងការបង្រៀន</div>
    <div style="text-align: center; font-size: 15px; margin-bottom: 40px; color: #444;">${formattedDate}</div>

    <div style="margin-bottom: 30px; line-height: 1.8; font-size: 15px;">
      <div style="display: flex; margin-bottom: 8px;">
        <span style="font-weight: bold; min-width: 120px;">ថ្នាក់ទី:</span>
        <span>${classInCharge || '..............................'}</span>
      </div>
      <div style="display: flex; margin-bottom: 8px;">
        <span style="font-weight: bold; min-width: 120px;">មុខវិជ្ជា:</span>
        <span>${subject || '..............................'}</span>
      </div>
      <div style="display: flex; margin-bottom: 8px;">
        <span style="font-weight: bold; min-width: 120px;">${lessonNo ? 'មេរៀនទី:' : 'ចំណងជើងមេរៀន:'}</span>
        <span>${lessonFullTitle || '..............................'}</span>
      </div>
      <div style="display: flex; margin-bottom: 8px;">
        <span style="font-weight: bold; min-width: 120px;">រយៈពេល:</span>
        <span>${durationDetail || '..............................'}</span>
      </div>
      <div style="display: flex; margin-bottom: 8px;">
        <span style="font-weight: bold; min-width: 120px;">បង្រៀនដោយ:</span>
        <span>${teacherName || '..............................'}</span>
      </div>
      <div style="display: flex; margin-bottom: 8px;">
        <span style="font-weight: bold; min-width: 120px;">ឯកសារជំនួយ:</span>
        <span>${sourceBook || '..............................'}</span>
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <div style="font-weight: bold; font-size: 20px; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 5px;">I. វត្ថុបំណង</div>
      <div style="white-space: pre-wrap; font-size: 15px; padding-left: 10px;">${objectives || 'មិនមានព័ត៌មាន'}</div>
    </div>

    <div style="margin-bottom: 30px;">
      <div style="font-weight: bold; font-size: 20px; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 5px;">II. សម្ភារឧបទេស</div>
      <div style="font-weight: bold; font-size: 15px; margin-bottom: 8px; padding-left: 10px;">សម្ភារៈ (រៀបរាប់):</div>
      <div style="white-space: pre-wrap; font-size: 15px; padding-left: 10px;">${materials || 'មិនមានព័ត៌មាន'}</div>
    </div>

    <div style="margin-bottom: 30px;">
      <div style="font-weight: bold; font-size: 20px; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px;">III. ដំណើរការបង្រៀន និងរៀន</div>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid black;">
        <thead>
          <tr style="background-color: #f8f8f8;">
            <th style="border: 1px solid black; padding: 12px; text-align: center; font-weight: bold; font-size: 14px;">សកម្មភាពគ្រូ</th>
            <th style="border: 1px solid black; padding: 12px; text-align: center; font-weight: bold; font-size: 14px;">ខ្លឹមសារមេរៀន</th>
            <th style="border: 1px solid black; padding: 12px; text-align: center; font-weight: bold; font-size: 14px;">សកម្មភាពសិស្ស</th>
          </tr>
        </thead>
        <tbody>
          ${activitiesHtml}
        </tbody>
      </table>
    </div>

    <div style="margin-top: 60px; display: flex; justify-content: space-around; text-align: center; font-size: 14px;">
      <div style="width: 40%;">
        <div style="font-weight: bold; margin-bottom: 50px;">ឯកភាពដោយនាយកសាលា</div>
        <div style="border-top: 1px dotted black; width: 80%; margin: 0 auto 5px auto;"></div>
        <div style="font-size: 12px; color: #666;">ថ្ងៃទី ........ ខែ ........ ឆ្នាំ ........</div>
      </div>
      <div style="width: 40%;">
        <div style="font-weight: bold; margin-bottom: 50px;">រៀបចំដោយ</div>
        <div style="font-weight: bold; margin-bottom: 5px;">${teacherName || '.........................................'}</div>
        <div style="font-size: 12px; color: #666;">${formattedDate}</div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 3, 
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.body.querySelector('div[style*="left: -5000px"]') as HTMLElement;
        if (clonedElement) {
          clonedElement.style.left = '0';
        }
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const canvasAspectRatio = canvas.height / canvas.width;
    const imgHeight = pageWidth * canvasAspectRatio;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    document.body.removeChild(container);
    return pdf.output('blob');
  } catch (error) {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    throw error;
  }
};
