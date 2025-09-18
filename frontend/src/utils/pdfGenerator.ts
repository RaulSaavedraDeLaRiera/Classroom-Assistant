import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExerciseData {
  title: string;
  content: string;
  type: string;
  difficulty?: string;
  estimatedTime?: number;
  maxScore?: number;
  description?: string;
}

interface PDFOptions {
  includeMetadata?: boolean;
  includeInstructions?: boolean;
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
}

export class PDFGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number = 20;
  private lineHeight: number = 6;

  constructor(options: PDFOptions = {}) {
    this.doc = new jsPDF({
      format: options.format || 'A4',
      orientation: options.orientation || 'portrait',
      unit: 'mm'
    });
    
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
  }

  private addText(text: string, x: number, y: number, options: any = {}): void {
    const { fontSize = 12, fontStyle = 'normal', color = '#000000', maxWidth = this.pageWidth - 2 * this.margin } = options;
    
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', fontStyle);
    this.doc.setTextColor(color);
    
    // Split text into lines if it's too long
    const lines = this.doc.splitTextToSize(text, maxWidth);
    
    for (let i = 0; i < lines.length; i++) {
      if (y + (i * this.lineHeight) > this.pageHeight - this.margin) {
        this.doc.addPage();
        y = this.margin;
      }
      this.doc.text(lines[i], x, y + (i * this.lineHeight));
    }
    
    this.currentY = y + (lines.length * this.lineHeight) + 2;
  }

  private addHeader(title: string): void {
    // Calculate how many lines the title will need
    const words = title.split(' ');
    const wordsPerLine = Math.floor((this.pageWidth - 2 * this.margin) / 8); // Approximate words per line
    const linesNeeded = Math.ceil(words.length / wordsPerLine);
    const headerHeight = Math.max(20, 10 + (linesNeeded * 6)); // Dynamic height
    
    this.doc.setFillColor(59, 130, 246); // Blue background
    this.doc.rect(0, 0, this.pageWidth, headerHeight, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    
    // Use addText to handle line breaks properly
    this.addText(title, this.margin, 10, { fontSize: 16, fontStyle: 'bold', color: '#FFFFFF' });
    
    this.currentY = headerHeight + 10;
  }

  private addMetadata(exercise: ExerciseData): void {
    // Skip metadata display - not needed in PDF
    // this.doc.setFillColor(243, 244, 246); // Gray background
    // this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 20, 'F');
    
    // this.doc.setTextColor(0, 0, 0);
    // this.doc.setFontSize(10);
    // this.doc.setFont('helvetica', 'normal');
    
    // const metadata = [
    //   `Type: ${exercise.type}`,
    //   `Difficulty: ${exercise.difficulty || 'Not specified'}`,
    //   `Estimated Time: ${exercise.estimatedTime || 0} minutes`,
    //   `Max Score: ${exercise.maxScore || 10} points`
    // ];
    
    // let x = this.margin + 5;
    // let y = this.currentY + 5;
    
    // metadata.forEach((item, index) => {
    //   this.doc.text(item, x, y + (index * 4));
    // });
    
    // this.currentY += 25;
  }

  private processContent(content: string): string {
    // Process special formatting markers
    let processedContent = content;
    
    // Process markdown headers - convert to special markers for PDF formatting
    processedContent = processedContent.replace(/^### (.*$)/gim, '[H3: $1]');
    processedContent = processedContent.replace(/^## (.*$)/gim, '[H2: $1]');
    processedContent = processedContent.replace(/^# (.*$)/gim, '[H1: $1]');
    
    // Process markdown bold - convert to special markers
    processedContent = processedContent.replace(/\*\*(.*?)\*\*/g, '[BOLD: $1]');
    
    // Process markdown italic - convert to special markers
    processedContent = processedContent.replace(/\*(.*?)\*/g, '[ITALIC: $1]');
    
    // Process markdown horizontal rules - convert to special markers
    processedContent = processedContent.replace(/^---$/gim, '[HR]');
    
    // Convert $text$ to [CORRECTION: text] for PDF (professor correction section)
    processedContent = processedContent.replace(/\$([^$]*)\$/g, '[CORRECTION: $1]');
    
    // Convert {text} to student answer lines based on text length
    processedContent = processedContent.replace(/\{([^}]*)\}/g, (match, text) => {
      const textLength = text.trim().length;
      if (textLength === 0) {
        // Empty {} - show only lines
        return '________________________________';
      } else {
        // Has text - show only the text in blue
        return `[STUDENT_TEXT: ${text}]`;
      }
    });
    
    // Convert &text& to [FEEDBACK: text] for PDF (professor feedback section)
    processedContent = processedContent.replace(/\&([^&]*)\&/g, '[FEEDBACK: $1]');
    
    return processedContent;
  }

  private addContent(content: string): void {
    const processedContent = this.processContent(content);
    
    // Split content into paragraphs
    const paragraphs = processedContent.split('\n\n');
    
    paragraphs.forEach(paragraph => {
      if (paragraph.trim()) {
        // Check if paragraph contains special markers
        if (paragraph.includes('[CORRECTION:') || paragraph.includes('[FEEDBACK:') || paragraph.includes('[STUDENT_TEXT:') || paragraph.includes('[H1:') || paragraph.includes('[H2:') || paragraph.includes('[H3:') || paragraph.includes('[BOLD:') || paragraph.includes('[ITALIC:') || paragraph.includes('[HR]')) {
          // Process each special marker separately
          const parts = paragraph.split(/(\[CORRECTION:[^\]]+\]|\[FEEDBACK:[^\]]+\]|\[STUDENT_TEXT:[^\]]+\]|\[H1:[^\]]+\]|\[H2:[^\]]+\]|\[H3:[^\]]+\]|\[BOLD:[^\]]+\]|\[ITALIC:[^\]]+\]|\[HR\])/);
          
          // Find all professor sections in this paragraph
          const professorSections = parts.filter(part => part.startsWith('[CORRECTION:') || part.startsWith('[FEEDBACK:'));
          
          parts.forEach((part, index) => {
            if (part.startsWith('[CORRECTION:')) {
              const text = part.replace(/\[CORRECTION:|\]/g, '');
              const isLast = index === parts.length - 1 || !parts.slice(index + 1).some(p => p.startsWith('[CORRECTION:') || p.startsWith('[FEEDBACK:'));
              this.addProfessorSection(text, isLast);
            } else if (part.startsWith('[FEEDBACK:')) {
              const text = part.replace(/\[FEEDBACK:|\]/g, '');
              const isLast = index === parts.length - 1 || !parts.slice(index + 1).some(p => p.startsWith('[CORRECTION:') || p.startsWith('[FEEDBACK:'));
              this.addFeedbackSection(text, isLast);
            } else if (part.startsWith('[STUDENT_TEXT:')) {
              const text = part.replace(/\[STUDENT_TEXT:|\]/g, '');
              this.addStudentTextSection(text);
            } else if (part.startsWith('[H1:')) {
              const text = part.replace(/\[H1:|\]/g, '');
              this.addFormattedHeader(text, 18, true);
            } else if (part.startsWith('[H2:')) {
              const text = part.replace(/\[H2:|\]/g, '');
              this.addSimpleHeader(text, 16, true);
            } else if (part.startsWith('[H3:')) {
              const text = part.replace(/\[H3:|\]/g, '');
              this.addSimpleHeader(text, 14, true);
            } else if (part.startsWith('[BOLD:')) {
              const text = part.replace(/\[BOLD:|\]/g, '');
              this.addText(text, this.margin, this.currentY, { fontSize: 11, fontStyle: 'bold' });
              this.currentY += 2;
            } else if (part.startsWith('[ITALIC:')) {
              const text = part.replace(/\[ITALIC:|\]/g, '');
              this.addText(text, this.margin, this.currentY, { fontSize: 11, fontStyle: 'italic' });
              this.currentY += 2;
            } else if (part === '[HR]') {
              this.addHorizontalRule();
            } else if (part.trim()) {
              this.addText(part, this.margin, this.currentY, { fontSize: 11 });
              this.currentY += 6; // More space like mb-3 in markdown
            }
          });
        } else {
          this.addText(paragraph, this.margin, this.currentY, { fontSize: 11 });
          this.currentY += 6; // More space like mb-3 in markdown
        }
      }
    });
  }

  private addFormattedParagraph(paragraph: string): void {
    // Split paragraph by special markers while preserving them
    const parts = paragraph.split(/(\[PROFESSOR:[^\]]+\]|\[STUDENT:[^\]]+\]|\[CORRECTION:[^\]]+\])/);
    
    let currentX = this.margin;
    let currentY = this.currentY;
    
    parts.forEach(part => {
      if (part.startsWith('[PROFESSOR:')) {
        const text = part.replace(/\[PROFESSOR:|\]/g, '');
        this.doc.setFillColor(254, 226, 226); // Light red background
        this.doc.rect(currentX - 2, currentY - 4, this.doc.getTextWidth(text) + 4, 6, 'F');
        this.addText(`PROFESSOR: ${text}`, currentX, currentY, { fontSize: 10, color: '#DC2626' });
        currentX += this.doc.getTextWidth(`PROFESSOR: ${text} `) + 2;
      } else if (part.startsWith('[STUDENT:')) {
        const text = part.replace(/\[STUDENT:|\]/g, '');
        this.doc.setFillColor(219, 234, 254); // Light blue background
        this.doc.rect(currentX - 2, currentY - 4, this.doc.getTextWidth(text) + 4, 6, 'F');
        this.addText(`STUDENT: ${text}`, currentX, currentY, { fontSize: 10, color: '#2563EB' });
        currentX += this.doc.getTextWidth(`STUDENT: ${text} `) + 2;
      } else if (part.startsWith('[CORRECTION:')) {
        const text = part.replace(/\[CORRECTION:|\]/g, '');
        this.doc.setFillColor(254, 243, 199); // Light yellow background
        this.doc.rect(currentX - 2, currentY - 4, this.doc.getTextWidth(text) + 4, 6, 'F');
        this.addText(`CORRECTION: ${text}`, currentX, currentY, { fontSize: 10, color: '#D97706' });
        currentX += this.doc.getTextWidth(`CORRECTION: ${text} `) + 2;
      } else if (part.trim()) {
        this.addText(part, currentX, currentY, { fontSize: 11 });
        currentX += this.doc.getTextWidth(part) + 2;
      }
    });
    
    this.currentY += 3;
  }

  private addStudentSection(text: string): void {
    // Add student section with space for answers
    this.doc.setFillColor(219, 234, 254); // Light blue background
    this.doc.rect(this.margin - 2, this.currentY - 4, this.pageWidth - 2 * this.margin + 4, 8, 'F');
    
    this.addText(`STUDENT ANSWER:`, this.margin, this.currentY, { fontSize: 10, color: '#2563EB' });
    this.currentY += 8;
    
    // Add answer lines based on text length
    const textLength = text.trim().length;
    let linesNeeded = 1;
    
    if (textLength === 0) {
      linesNeeded = 1;
    } else if (textLength <= 20) {
      linesNeeded = 1;
    } else if (textLength <= 40) {
      linesNeeded = 2;
    } else if (textLength <= 60) {
      linesNeeded = 3;
    } else {
      linesNeeded = Math.ceil(textLength / 40);
    }
    
    // Draw answer lines
    for (let i = 0; i < linesNeeded; i++) {
      this.addText('________________________________________________', this.margin, this.currentY, { fontSize: 10 });
      this.currentY += this.lineHeight + 2;
    }
    
    this.currentY += 4;
  }

  private addStudentTextSection(text: string): void {
    // Add student text in blue only (no lines)
    if (text.trim()) {
      this.addText(text, this.margin, this.currentY, { fontSize: 10, color: '#2563EB' });
      this.currentY += this.lineHeight;
    }
  }

  private addFormattedHeader(text: string, fontSize: number, bold: boolean = false): void {
    // H1 headers - with gray background that fits multi-line text
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', bold ? 'bold' : 'normal');
    
    // Calculate how many lines the text will need
    const maxWidth = this.pageWidth - 2 * this.margin;
    const lines = this.doc.splitTextToSize(text, maxWidth);
    const lineCount = lines.length;
    const textHeight = fontSize * 0.35; // Approximate text height per line
    const totalHeight = lineCount * textHeight + 4; // Total height for all lines
    
    // Set background color and draw rectangle that fits all lines
    this.doc.setFillColor(243, 244, 246); // Gray background
    this.doc.rect(this.margin - 2, this.currentY - textHeight - 2, this.pageWidth - 2 * this.margin + 4, totalHeight, 'F');
    
    this.doc.setTextColor(0, 0, 0);
    this.addText(text, this.margin, this.currentY, { fontSize, fontStyle: bold ? 'bold' : 'normal' });
    this.currentY += 3; // Small spacing after H1
    
    // Reset font
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
  }

  private addSimpleHeader(text: string, fontSize: number, bold: boolean = false): void {
    // H2 and H3 headers - no background, just bold text like in markdown
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', bold ? 'bold' : 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    this.addText(text, this.margin, this.currentY, { fontSize, fontStyle: bold ? 'bold' : 'normal' });
    this.currentY += 2; // Small spacing after H2/H3
    
    // Reset font
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
  }

  private addHorizontalRule(): void {
    this.currentY += 8; // More space before hr like my-4 in markdown
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 8; // More space after hr like my-4 in markdown
  }

  private addProfessorSection(text: string, isLast: boolean = false): void {
    // Professor correction section - minimal space
    this.doc.setFillColor(254, 226, 226); // Light red background
    this.doc.rect(this.margin - 1, this.currentY - 1, this.pageWidth - 2 * this.margin + 2, 8, 'F');
    
    this.addText(text, this.margin, this.currentY, { fontSize: 9, color: '#DC2626' });
    this.currentY += isLast ? 4 : 0; // Only last section gets margin
  }

  private addFeedbackSection(text: string, isLast: boolean = false): void {
    // Feedback section - minimal space with orange background
    this.doc.setFillColor(254, 243, 199); // Light orange background
    this.doc.rect(this.margin - 1, this.currentY - 1, this.pageWidth - 2 * this.margin + 2, 8, 'F');
    
    this.addText(text, this.margin, this.currentY, { fontSize: 9, color: '#D97706' });
    this.currentY += isLast ? 4 : 0; // Only last section gets margin
  }

  private addFooter(): void {
    const pageCount = (this.doc as any).internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text(
        `Page ${i} of ${pageCount}`,
        this.pageWidth - 30,
        this.pageHeight - 10
      );
      this.doc.text(
        `Generated on ${new Date().toLocaleDateString('en-US')}`,
        this.margin,
        this.pageHeight - 10
      );
    }
  }

  public generateExercisePDF(exercise: ExerciseData, options: PDFOptions = {}): void {
    // Add header
    this.addHeader(exercise.title);
    
    // Add description if available
    if (exercise.description) {
      this.addText(exercise.description, this.margin, this.currentY, { 
        fontSize: 12, 
        fontStyle: 'italic',
        color: '#6B7280'
      });
      this.currentY += 10;
    }
    
    // Add metadata if requested
    if (options.includeMetadata !== false) {
      this.addMetadata(exercise);
    }
    
    // Skip automatic instructions - they're already in the content
    // if (options.includeInstructions !== false) {
    //   this.addText('Instructions:', this.margin, this.currentY, { 
    //     fontSize: 12, 
    //     fontStyle: 'bold' 
    //   });
    //   this.currentY += 8;
    // }
    
    // Add content
    this.addContent(exercise.content);
    
    // Add footer
    this.addFooter();
    
    // Save the PDF
    const fileName = `${exercise.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    this.doc.save(fileName);
  }

  public static async generateFromHTML(element: HTMLElement, title: string): Promise<void> {
    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        background: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        format: 'A4',
        orientation: 'portrait',
        unit: 'mm'
      });
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF from HTML:', error);
      throw error;
    }
  }
}

// Utility function for easy use
export const downloadExercisePDF = (exercise: ExerciseData, options: PDFOptions = {}) => {
  const generator = new PDFGenerator(options);
  generator.generateExercisePDF(exercise, options);
};

// Utility function for HTML to PDF
export const downloadHTMLAsPDF = async (element: HTMLElement, title: string) => {
  await PDFGenerator.generateFromHTML(element, title);
};
