import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Capture an A4 sheet element to a high-DPI PDF.
 * The element MUST be 794 x 1123 px (A4 @ 96 dpi).
 *
 * IMPORTANT — fonts:
 * html2canvas measures text with the *currently loaded* fonts. If a custom
 * font (Inter Tight, JetBrains Mono, etc.) hasn't finished loading when we
 * snapshot, the browser falls back to a metric-incompatible font and
 * html2canvas mis-positions glyphs — producing the classic "wordsruntogether"
 * artefact. We block on `document.fonts.ready` (and a small RAF) before
 * capturing to make sure the snapshot uses real metrics.
 */
export async function exportSheetToPDF(el: HTMLElement, fileName: string) {
  // 1. Wait for webfonts to be fully loaded & laid out.
  if (typeof document !== "undefined" && (document as any).fonts?.ready) {
    try {
      await (document as any).fonts.ready;
    } catch {
      /* ignore */
    }
  }
  // 2. One paint frame so layout stabilises with the real metrics.
  await new Promise<void>((r) => requestAnimationFrame(() => r()));

  const canvas = await html2canvas(el, {
    scale: 3,                    // ~288 dpi — crisp print quality
    backgroundColor: "#ffffff",
    useCORS: true,
    allowTaint: false,
    logging: false,
    letterRendering: true,       // preserves kerning / word spacing
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  } as any);

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  // PNG preserves crisp text edges; JPEG compression was softening them.
  const img = canvas.toDataURL("image/png");
  pdf.addImage(img, "PNG", 0, 0, pageW, pageH, undefined, "FAST");
  pdf.save(fileName);
}
