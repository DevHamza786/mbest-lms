import jsPDF from 'jspdf';
import type { Invoice } from '@/lib/types/common';

interface TutorInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  periodStart: string;
  periodEnd: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  amount: number;
  tutorName?: string;
  tutorAddress?: string;
  items?: Array<{
    description: string;
    quantity?: number;
    rate?: number;
    amount: number;
  }>;
  notes?: string;
}

export function generateStudentInvoicePDF(invoice: Invoice): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - margin, yPos, { align: 'right' });
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #${invoice.id}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 20;

  // Invoice Details
  doc.setFontSize(10);
  doc.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, margin, yPos);
  yPos += 6;
  doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, margin, yPos);
  yPos += 6;
  if (invoice.paidDate) {
    doc.text(`Paid Date: ${new Date(invoice.paidDate).toLocaleDateString()}`, margin, yPos);
    yPos += 6;
  }
  yPos += 10;

  // Bill To Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Bill To:', margin, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(invoice.studentName, margin, yPos);
  yPos += 6;
  if (invoice.parentName) {
    doc.text(invoice.parentName, margin, yPos);
    yPos += 6;
  }
  yPos += 15;

  // Description
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Description:', margin, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const descriptionLines = doc.splitTextToSize(invoice.description, pageWidth - 2 * margin);
  doc.text(descriptionLines, margin, yPos);
  yPos += descriptionLines.length * 6 + 10;

  // Items Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Items', margin, yPos);
  yPos += 8;

  // Table Header
  const tableStartY = yPos;
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
  
  doc.setFontSize(9);
  doc.text('Description', margin + 2, yPos);
  doc.text('Amount', pageWidth - margin - 2, yPos, { align: 'right' });
  yPos += 10;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  invoice.items.forEach((item) => {
    if (yPos > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      yPos = margin;
    }
    const itemDescLines = doc.splitTextToSize(item.description, pageWidth - 2 * margin - 50);
    doc.text(itemDescLines, margin + 2, yPos);
    doc.text(`$${item.amount.toFixed(2)}`, pageWidth - margin - 2, yPos, { align: 'right' });
    yPos += Math.max(itemDescLines.length * 5, 8);
  });

  // Total
  yPos += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total Amount:', pageWidth - margin - 60, yPos);
  doc.text(`$${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 2, yPos, { align: 'right' });
  yPos += 15;

  // Status
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Status: ${invoice.status.toUpperCase()}`, margin, yPos);
  yPos += 8;

  // Payment Info
  if (invoice.paymentMethod) {
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Method: ${invoice.paymentMethod}`, margin, yPos);
    yPos += 6;
  }
  if (invoice.transactionId) {
    doc.text(`Transaction ID: ${invoice.transactionId}`, margin, yPos);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });

  // Save PDF
  doc.save(`invoice-${invoice.id}.pdf`);
}

export async function generateTutorInvoicePDF(invoice: TutorInvoice & { 
  due_date?: string;
  currency?: string;
  paid_date?: string;
  payment_method?: string;
  transaction_id?: string;
}): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Add Logo (if available)
  try {
    const logoWidth = 50;
    const logoHeight = 20;
    
    // Load logo image
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    
    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => {
        try {
          doc.addImage(logoImg, 'PNG', margin, yPos, logoWidth, logoHeight);
          yPos += logoHeight + 10;
          resolve();
        } catch (e) {
          console.log('Failed to add logo to PDF:', e);
          yPos += 5;
          resolve(); // Continue without logo
        }
      };
      logoImg.onerror = () => {
        console.log('Logo image not found, continuing without logo');
        yPos += 5;
        resolve(); // Continue without logo
      };
      logoImg.src = '/M.B.E.S.T-logo.png';
    });
  } catch (e) {
    // Logo loading failed, continue without it
    console.log('Logo not available, continuing without logo');
  }

  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('TUTOR INVOICE', pageWidth - margin, yPos, { align: 'right' });
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #${invoice.invoiceNumber}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 20;

  // Invoice Details
  doc.setFontSize(10);
  doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, margin, yPos);
  yPos += 6;
  if (invoice.due_date) {
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, margin, yPos);
    yPos += 6;
  }
  doc.text(`Period: ${new Date(invoice.periodStart).toLocaleDateString()} - ${new Date(invoice.periodEnd).toLocaleDateString()}`, margin, yPos);
  yPos += 6;
  if (invoice.currency) {
    doc.text(`Currency: ${invoice.currency}`, margin, yPos);
    yPos += 6;
  }
  yPos += 4;

  // Tutor Info
  if (invoice.tutorName || invoice.tutorAddress) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Tutor Information:', margin, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (invoice.tutorName) {
      doc.text(invoice.tutorName, margin, yPos);
      yPos += 6;
    }
    if (invoice.tutorAddress) {
      const addressLines = invoice.tutorAddress.split('\n');
      addressLines.forEach((line) => {
        doc.text(line, margin, yPos);
        yPos += 6;
      });
    }
    yPos += 10;
  }

  // Items Table
  if (invoice.items && invoice.items.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Invoice Items', margin, yPos);
    yPos += 8;

    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
    
    doc.setFontSize(9);
    doc.text('Description', margin + 2, yPos);
    if (invoice.items.some(item => item.quantity !== undefined)) {
      doc.text('Qty', margin + 100, yPos);
      doc.text('Rate', margin + 120, yPos);
    }
    doc.text('Amount', pageWidth - margin - 2, yPos, { align: 'right' });
    yPos += 10;

    // Table Rows
    doc.setFont('helvetica', 'normal');
    invoice.items.forEach((item) => {
      if (yPos > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        yPos = margin;
      }
      const itemDescLines = doc.splitTextToSize(item.description, 80);
      doc.text(itemDescLines, margin + 2, yPos);
      if (item.quantity !== undefined && item.rate !== undefined) {
        doc.text(item.quantity.toString(), margin + 100, yPos);
        doc.text(`$${item.rate.toFixed(2)}`, margin + 120, yPos);
      }
      doc.text(`$${item.amount.toFixed(2)}`, pageWidth - margin - 2, yPos, { align: 'right' });
      yPos += Math.max(itemDescLines.length * 5, 8);
    });

    // Total
    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total Amount:', pageWidth - margin - 60, yPos);
    doc.text(`$${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 2, yPos, { align: 'right' });
    yPos += 15;
  } else {
    // Simple total if no items
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total Amount:', margin, yPos);
    doc.text(`$${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 2, yPos, { align: 'right' });
    yPos += 15;
  }

  // Status
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Status: ${invoice.status}`, margin, yPos);
  yPos += 6;
  
  // Payment Information
  if (invoice.paid_date) {
    doc.setFont('helvetica', 'normal');
    doc.text(`Paid Date: ${new Date(invoice.paid_date).toLocaleDateString()}`, margin, yPos);
    yPos += 6;
  }
  if (invoice.payment_method) {
    doc.text(`Payment Method: ${invoice.payment_method}`, margin, yPos);
    yPos += 6;
  }
  if (invoice.transaction_id) {
    doc.text(`Transaction ID: ${invoice.transaction_id}`, margin, yPos);
    yPos += 6;
  }
  yPos += 4;

  // Notes
  if (invoice.notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Notes:', margin, yPos);
    yPos += 6;
    const notesLines = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin);
    doc.text(notesLines, margin, yPos);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for your service!', pageWidth / 2, footerY, { align: 'center' });

  // Save PDF
  doc.save(`tutor-invoice-${invoice.invoiceNumber}.pdf`);
}

