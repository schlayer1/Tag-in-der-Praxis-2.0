// @ts-ignore
import html2pdf from 'html2pdf.js';
import confetti from 'canvas-confetti';
import { PraxisReport, StudentPortfolioReport } from '../types/report';

export async function exportReportToPDF(report: PraxisReport): Promise<void> {
  const element = document.getElementById('pdf-printable-report');
  if (!element) {
    throw new Error('Printable element not found');
  }

  const cleanTurnus = (report.stage || 'Turnus-1').replace(/\s+/g, '-');
  const cleanDate = report.reportDate || new Date().toISOString().split('T')[0];
  const cleanName = (report.studentName || 'Schueler')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-äöüÄÖÜß]/g, '');

  const filename = `${cleanTurnus}_${cleanDate}_${cleanName}.pdf`;

  const opt = {
    margin: [6, 6, 6, 6],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    html2canvas: {
      scale: 2,
      useCORS: true,
      scrollY: 0,
      scrollX: 0,
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  try {
    await html2pdf().set(opt).from(element).save();

    // Trigger confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0B7BA7', '#00A896', '#F39200', '#00558F'],
      });
    } catch {
      // Confetti is optional visual flair
    }
  } catch (err) {
    console.error('Error generating PDF:', err);
    throw err;
  }
}

export async function exportPortfolioToPDF(portfolio: StudentPortfolioReport): Promise<void> {
  const element = document.getElementById('pdf-printable-portfolio');
  if (!element) {
    throw new Error('Printable portfolio element not found');
  }

  const cleanTurnus = (portfolio.periodCovered || 'Turnus-Portfolio')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-äöüÄÖÜß]/g, '');
  const cleanDate = new Date().toISOString().split('T')[0];
  const cleanName = (portfolio.studentName || 'Schueler')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-äöüÄÖÜß]/g, '');

  const filename = `Portfolio_Tag_in_der_Praxis_${cleanName}_${cleanTurnus}_${cleanDate}.pdf`;

  const opt = {
    margin: 0,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    enableLinks: false,
    pagebreak: { mode: ['css', 'legacy'] },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      scrollY: 0,
      scrollX: 0,
      windowWidth: 1024,
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  try {
    await html2pdf().set(opt).from(element).save();

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#0B7BA7', '#00A896', '#F39200', '#00558F'],
      });
    } catch {
      // Optional
    }
  } catch (err) {
    console.error('Error generating PDF:', err);
    throw err;
  }
}
