import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Capture an A4 sheet element to a high-DPI PDF.
 * The element MUST be 794 x 1123 px (A4 @ 96 dpi).
 */
export async function exportSheetToPDF(el: HTMLElement, fileName: string) {
  const canvas = await html2canvas(el, {
    scale: 2.5,                 // ~240 dpi — sharp print quality
    backgroundColor: "#ffffff",
    useCORS: true,
    allowTaint: false,
    logging: false,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  });

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const img = canvas.toDataURL("image/jpeg", 0.95);
  pdf.addImage(img, "JPEG", 0, 0, pageW, pageH, undefined, "FAST");
  pdf.save(fileName);
}
