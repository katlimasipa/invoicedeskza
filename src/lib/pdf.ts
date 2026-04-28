import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

/**
 * Capture an A4 sheet element (794 x 1123 CSS px) to a single-page A4 PDF.
 *
 * Why html-to-image (and not html2canvas):
 *   html2canvas re-implements its own text layout engine. With variable fonts
 *   like Inter Tight that engine miscomputes glyph advance widths, producing
 *   the classic artefacts the user reported — characters running into each
 *   other AND extra phantom whitespace inside words ("CustomSpageWebsite",
 *   "26042026", "R5000"). html-to-image instead serialises the live DOM into
 *   an SVG <foreignObject>, so the browser itself does the text layout. Glyph
 *   metrics come out identical to what's on screen.
 */
export async function exportSheetToPDF(el: HTMLElement, fileName: string) {
  // Make sure every webfont the sheet uses is fully loaded & laid out before
  // we serialise. Without this the snapshot can fall back to a metric-
  // incompatible system font for one frame.
  if (typeof document !== "undefined" && (document as any).fonts?.ready) {
    try {
      await (document as any).fonts.ready;
      // Explicitly load the exact families/weights used in the sheet so
      // FontFaceSet doesn't lazy-skip any of them.
      const fonts: any = (document as any).fonts;
      await Promise.all([
        fonts.load("400 13px 'Inter Tight'"),
        fonts.load("600 13px 'Inter Tight'"),
        fonts.load("700 13px 'Inter Tight'"),
        fonts.load("800 18px 'Inter Tight'"),
        fonts.load("400 12px 'JetBrains Mono'"),
        fonts.load("700 10px 'JetBrains Mono'"),
      ]);
    } catch {
      /* non-fatal */
    }
  }
  // Two animation frames — first to apply any pending style, second to make
  // sure the layout has settled with the real font metrics.
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  await new Promise<void>((r) => requestAnimationFrame(() => r()));

  const width = el.offsetWidth || 794;
  const height = el.offsetHeight || 1123;

  const dataUrl = await toPng(el, {
    width,
    height,
    pixelRatio: 3, // ~288 dpi
    cacheBust: true,
    backgroundColor: "#ffffff",
    style: {
      // Neutralise any transform inherited from the offscreen container so
      // the snapshot is taken at 100% scale.
      transform: "none",
      transformOrigin: "top left",
      margin: "0",
    },
    skipFonts: false,
  });

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  pdf.addImage(dataUrl, "PNG", 0, 0, pageW, pageH, undefined, "FAST");
  pdf.save(fileName);
}
