
import { 
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, VerticalAlign, PageNumber, Footer, BorderStyle, ImageRun
} from 'docx';
import { LessonPlanFormState, Activity } from '../types';

const KHMER_OS_SIEMREAP_FONT = "!Khmer OS Siemreap"; 

// Helper to create multi-line text paragraphs for table cells or general text
const createMultiLineContent = (
  text: string, 
  { 
    font = KHMER_OS_SIEMREAP_FONT, 
    size = 22, 
    bold = false, 
    isTableCell = false,
    stepTitle = ""
  } = {}
): (Paragraph)[] => {
  const paragraphs: Paragraph[] = [];

  if (stepTitle) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: stepTitle, font: font, size: size, bold: true })], 
      spacing: { after: 50 } 
    }));
  }

  if (!text || text.trim() === '') {
    if (isTableCell && text.trim() === '') { 
        paragraphs.push(new Paragraph({ 
          children: [new TextRun({ text: " ", font: font, size: size })], 
          spacing: { after: 0 } 
        }));
    } else if (!stepTitle) { 
        paragraphs.push(new Paragraph({ 
          children: [new TextRun({ text: isTableCell ? " " : "មិនមានព័ត៌មាន", font: font, size: size, italics: !isTableCell })],
          spacing: { after: 100 } 
        }));
    }
    return paragraphs;
  }

  text.split('\n').forEach(line => {
    // Basic math/science parsing for superscript (e.g. x^2) and subscript (e.g. H_2O)
    const children: TextRun[] = [];
    const parts = line.split(/(\^[0-9a-zA-Z]+|_[0-9a-zA-Z]+)/g);
    
    parts.forEach(part => {
      if (part.startsWith('^')) {
        children.push(new TextRun({
          text: part.substring(1),
          font: font,
          size: size,
          bold: bold,
          superScript: true
        }));
      } else if (part.startsWith('_')) {
        children.push(new TextRun({
          text: part.substring(1),
          font: font,
          size: size,
          bold: bold,
          subScript: true
        }));
      } else {
        children.push(new TextRun({
          text: part,
          font: font,
          size: size,
          bold: bold
        }));
      }
    });

    paragraphs.push(new Paragraph({ 
      children: children.length > 0 ? children : [new TextRun({ text: line, font: font, size: size, bold: bold })], 
      spacing: { after: 50 } 
    }));
  });
  return paragraphs;
};

const createLabeledText = (label: string, value?: string, options: { labelFont?: string, valueFont?: string, labelSize?: number, valueSize?: number, labelBold?: boolean, valueBold?: boolean, spacingAfter?: number } = {}): Paragraph => {
  const { 
    labelFont = KHMER_OS_SIEMREAP_FONT, valueFont = KHMER_OS_SIEMREAP_FONT, 
    labelSize = 24, valueSize = 22, 
    labelBold = true, valueBold = false,
    spacingAfter = 80
  } = options;

  return new Paragraph({
    children: [
      new TextRun({ text: `${label} `, font: labelFont, size: labelSize, bold: labelBold }),
      new TextRun({ text: value || "..............................", font: valueFont, size: valueSize, bold: valueBold }),
    ],
    spacing: { after: spacingAfter }
  });
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

export const generateLessonPlanDocx = async (formData: LessonPlanFormState): Promise<Blob> => {
  const {
    date, subject, lessonNo, lessonTitle, lessonSubtitle, teacherName, classInCharge,
    durationDetail, sourceBook, objectives, materials, activities
  } = formData;

  const formattedDate = formatDateInKhmer(date);
  let lessonFullTitle = lessonNo ? `មេរៀនទី ${lessonNo}៖ ${lessonTitle}` : lessonTitle;
  if (lessonSubtitle && lessonSubtitle.trim()) {
    lessonFullTitle += ` (ចំណងជើងរង៖ ${lessonSubtitle.trim()})`;
  }

  const docChildren: (Paragraph | Table)[] = [
    new Paragraph({
      children: [new TextRun({ text: "ព្រះរាជាណាចក្រកម្ពុជា", font: KHMER_OS_SIEMREAP_FONT, size: 26, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "ជាតិ សាសនា ព្រះមហាក្សត្រ", font: KHMER_OS_SIEMREAP_FONT, size: 26, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 50 },
    }),
     new Paragraph({ 
      children: [new TextRun({ text: "✧ ☆ ✧", font: KHMER_OS_SIEMREAP_FONT, size: 16})],
      alignment: AlignmentType.CENTER,
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "ក្រសួងអប់រំ យុវជន និងកីឡា", font: KHMER_OS_SIEMREAP_FONT, size: 24, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
    }),
    new Paragraph({}),

    new Paragraph({
      children: [new TextRun({ text: "កិច្ចតែងការបង្រៀន", font: KHMER_OS_SIEMREAP_FONT, size: 36, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [new TextRun({ text: formattedDate, font: KHMER_OS_SIEMREAP_FONT, size: 22 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),

    createLabeledText("ថ្នាក់ទី:", classInCharge, {labelFont: KHMER_OS_SIEMREAP_FONT, valueFont: KHMER_OS_SIEMREAP_FONT}),
    createLabeledText("មុខវិជ្ជា:", subject, {labelFont: KHMER_OS_SIEMREAP_FONT, valueFont: KHMER_OS_SIEMREAP_FONT}),
    createLabeledText(lessonNo ? "មេរៀនទី:" : "ចំណងជើងមេរៀន:", lessonFullTitle, {labelFont: KHMER_OS_SIEMREAP_FONT, valueFont: KHMER_OS_SIEMREAP_FONT}),
    createLabeledText("រយៈពេល:", durationDetail, {labelFont: KHMER_OS_SIEMREAP_FONT, valueFont: KHMER_OS_SIEMREAP_FONT}),
    createLabeledText("បង្រៀនដោយ:", teacherName, {labelFont: KHMER_OS_SIEMREAP_FONT, valueFont: KHMER_OS_SIEMREAP_FONT}),
    createLabeledText("ឯកសារជំនួយ:", sourceBook, {labelFont: KHMER_OS_SIEMREAP_FONT, valueFont: KHMER_OS_SIEMREAP_FONT, spacingAfter: 250 }),
    
    new Paragraph({
      children: [new TextRun({ text: "I. វត្ថុបំណង", font: KHMER_OS_SIEMREAP_FONT, bold: true, size: 28 })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 150 },
    }),
    ...createMultiLineContent(objectives, {font: KHMER_OS_SIEMREAP_FONT, size: 22}),

    new Paragraph({
      children: [new TextRun({ text: "II. សម្ភារឧបទេស", font: KHMER_OS_SIEMREAP_FONT, bold: true, size: 28 })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 150 },
    }),
    new Paragraph({ 
        children: [new TextRun({ text: "សម្ភារៈ (រៀបរាប់):", font: KHMER_OS_SIEMREAP_FONT, bold: true, italics: false, size: 24 })],
        spacing: { after: 100 }
    }),
    ...createMultiLineContent(materials, {font: KHMER_OS_SIEMREAP_FONT, size: 22}),
    
    new Paragraph({
      children: [new TextRun({ text: "III. ដំណើរការបង្រៀន និងរៀន", font: KHMER_OS_SIEMREAP_FONT, bold: true, size: 28 })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 150 },
    }),
  ];

  const tableRows = [
    new TableRow({
      children: [
        new TableCell({ children: createMultiLineContent("សកម្មភាពគ្រូ", { bold: true, font: KHMER_OS_SIEMREAP_FONT, isTableCell: true }), verticalAlign: VerticalAlign.CENTER, margins: {top:100, bottom:100, left:100, right:100} }),
        new TableCell({ children: createMultiLineContent("ខ្លឹមសារមេរៀន", { bold: true, font: KHMER_OS_SIEMREAP_FONT, isTableCell: true }), verticalAlign: VerticalAlign.CENTER, margins: {top:100, bottom:100, left:100, right:100} }),
        new TableCell({ children: createMultiLineContent("សកម្មភាពសិស្ស", { bold: true, font: KHMER_OS_SIEMREAP_FONT, isTableCell: true }), verticalAlign: VerticalAlign.CENTER, margins: {top:100, bottom:100, left:100, right:100} }),
      ],
      tableHeader: true,
    }),
  ];

  const activitiesToDisplay = formData.activities.length > 0 ? formData.activities : Array(5).fill(null).map((_, i) => ({ 
    id: `empty-${i}`,
    teacherActivity: " ", lessonContent: " ", studentActivity: " "
  }));

  activitiesToDisplay.forEach((activity, index) => {
    const stepTitleText = `ជំហានទី ${index + 1}៖`;

    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: createMultiLineContent(activity.teacherActivity, { font: KHMER_OS_SIEMREAP_FONT, isTableCell: true }), verticalAlign: VerticalAlign.TOP, margins: {top:100, bottom:100, left:100, right:100} }),
          new TableCell({ 
            children: createMultiLineContent(activity.lessonContent, { 
              font: KHMER_OS_SIEMREAP_FONT, 
              isTableCell: true,
              stepTitle: stepTitleText
            }), 
            verticalAlign: VerticalAlign.TOP, 
            margins: {top:100, bottom:100, left:100, right:100} 
          }),
          new TableCell({ children: createMultiLineContent(activity.studentActivity, { font: KHMER_OS_SIEMREAP_FONT, isTableCell: true }), verticalAlign: VerticalAlign.TOP, margins: {top:100, bottom:100, left:100, right:100} }),
        ],
      })
    );
  });
  
  const tableBorders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  };

  const processTable = new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [3500, 4300, 3500], 
    borders: tableBorders,
  });
  docChildren.push(processTable);

  docChildren.push(new Paragraph({ spacing: { before: 400 } })); 

    const signatureTable = new Table({
        columnWidths: [5000, 5000], 
        borders: { 
            top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({ children: [
                        new Paragraph({ text: "ឯកភាពដោយនាយកសាលា", alignment: AlignmentType.CENTER, style: "SignatureRole"}),
                        new Paragraph({ text: " ", spacing: {after: 100}}), 
                        new Paragraph({ text: ".........................................", alignment: AlignmentType.CENTER, style: "SignatureLine"}),
                        new Paragraph({ text: `ថ្ងៃទី ........ ខែ ........ ឆ្នាំ ........`, alignment: AlignmentType.CENTER, style: "SignatureDate"}),
                    ], verticalAlign: VerticalAlign.TOP, margins: { left: 100, right: 100} }),
                    new TableCell({ children: [
                        new Paragraph({ text: "រៀបចំដោយ", alignment: AlignmentType.CENTER, style: "SignatureRole"}),
                        new Paragraph({ text: " ", spacing: {after: 100}}), 
                        new Paragraph({ text: teacherName || ".........................................", alignment: AlignmentType.CENTER, style: "SignatureLine"}),
                        new Paragraph({ text: formattedDate, alignment: AlignmentType.CENTER, style: "SignatureDate"}),
                    ], verticalAlign: VerticalAlign.TOP, margins: { left: 100, right: 100} }),
                ],
            }),
        ],
    });
    docChildren.push(new Paragraph({spacing: {before: 300}})); 
    docChildren.push(signatureTable);

  const doc = new Document({
    creator: "Khmer Lesson Plan Generator",
    title: `កិច្ចតែងការបង្រៀន - ${lessonTitle || 'Untitled'}`,
    description: "Lesson plan generated by the Khmer Lesson Plan Generator application.",
    styles: {
      default: {
        document: { run: { font: KHMER_OS_SIEMREAP_FONT, size: 22 } }, 
      },
      paragraphStyles: [
        { id: "Normal", name: "Normal", run: { font: KHMER_OS_SIEMREAP_FONT, size: 22 }, paragraph: { spacing: { after: 120 }}},
        { id: "SignatureRole", name: "Signature Role", basedOn: "Normal", run: { font: KHMER_OS_SIEMREAP_FONT, size: 22, bold: true }, paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 20 }}},
        { id: "SignatureLine", name: "Signature Line", basedOn: "Normal", run: { font: KHMER_OS_SIEMREAP_FONT, size: 22 }, paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 20 }}},
        { id: "SignatureDate", name: "Signature Date", basedOn: "Normal", run: { font: KHMER_OS_SIEMREAP_FONT, size: 22 }, paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 150 }}},
      ],
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1000, right: 1000, bottom: 1000, left: 1200 }, 
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "ទំព័រទី ", font: KHMER_OS_SIEMREAP_FONT, size: 18 }),
                new TextRun({ children: [PageNumber.CURRENT], font: KHMER_OS_SIEMREAP_FONT, size: 18 }),
                new TextRun({ text: " នៃ ", font: KHMER_OS_SIEMREAP_FONT, size: 18 }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], font: KHMER_OS_SIEMREAP_FONT, size: 18 }),
              ],
            }),
          ],
        }),
      },
      children: docChildren,
    }],
  });

  return Packer.toBlob(doc);
};

export const saveDocumentToFile = (blob: Blob, filename: string) => {
  let mimeType = blob.type;
  if (filename.endsWith('.docx')) {
    mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  } else if (filename.endsWith('.pptx')) {
    mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }

  let fileToSave: Blob;
  try {
    fileToSave = new File([blob], filename, { type: mimeType, lastModified: Date.now() });
  } catch (e) {
    fileToSave = new Blob([blob], { type: mimeType });
  }

  const nav = window.navigator as any;
  if (nav && nav.msSaveOrOpenBlob) {
    nav.msSaveOrOpenBlob(fileToSave, filename);
    return;
  }

  const url = URL.createObjectURL(fileToSave);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(url);
  }, 5000);
};
