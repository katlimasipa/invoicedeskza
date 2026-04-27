import { forwardRef } from "react";
import { format } from "date-fns";
import { formatZAR, calcRowTotal, calcGrandTotal, formatPhone } from "@/lib/format";

export type InvoiceItemData = {
  service: string;
  note?: string | null;
  qty: number | string;
  unit_price: number | string;
  original_unit_price?: number | string | null;
};

export type InvoiceData = {
  invoice_number: string;
  invoice_date: string | Date;
  client_name: string;

  company_name?: string | null;
  logo_url?: string | null;        // resolved signed/data url
  signature_url?: string | null;

  phone?: string | null;
  email?: string | null;
  website?: string | null;

  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_account_number?: string | null;

  items: InvoiceItemData[];
};

/**
 * A4 invoice sheet — pixel-matched to the supplied reference.
 * Self-contained styles (inline + .a4-sheet class) so html2canvas
 * captures it cleanly and the PDF doesn't inherit app chrome.
 *
 * Sheet: 794 × 1123 px (A4 @ 96 dpi)
 *
 * Single-page strategy: items render in a flex column; if more than
 * ITEMS_BEFORE_SHRINK rows are present, font sizes & padding step down
 * gracefully so the sheet always fits one page.
 */
const ITEMS_BEFORE_SHRINK = 9;

export const InvoiceSheet = forwardRef<HTMLDivElement, { data: InvoiceData }>(({ data }, ref) => {
  const dateText =
    data.invoice_date instanceof Date
      ? format(data.invoice_date, "dd/MM/yyyy")
      : format(new Date(data.invoice_date), "dd/MM/yyyy");

  const items = data.items.length ? data.items : [{ service: "", qty: 0, unit_price: 0 }];
  const grand = calcGrandTotal(items);
  const dense = items.length > ITEMS_BEFORE_SHRINK;

  // ----- typography tokens (locked to the sheet, not the app theme) -----
  const ink = "#111317";
  const inkSoft = "#3a3d44";
  const inkMute = "#7a7d85";
  const ruleColor = "#d8d6d0";
  const accentNote = "#5b4b6f"; // muted plum-grey for the small note line, like the reference

  // Spacing scales — slightly more generous than v1
  const rowVPad = dense ? 11 : 16;            // vertical padding per item row
  const bodyFs = dense ? 12.5 : 13.5;          // body row font size
  const noteFs = dense ? 10 : 11;
  const sectionGap = dense ? 18 : 26;          // gap between major blocks
  const headerMb = dense ? 18 : 24;

  // Determine whether to render the company-name word-mark.
  // If a logo is present, the user told us the wordmark is redundant.
  const showWordmark = !data.logo_url && !!(data.company_name && data.company_name.trim());

  return (
    <div
      ref={ref}
      className="a4-sheet"
      style={{
        boxSizing: "border-box",
        padding: "56px 56px 44px 56px",
        display: "flex",
        flexDirection: "column",
        lineHeight: 1.55,
      }}
    >
      {/* ============== HEADER ============== */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: headerMb, gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0, flex: 1 }}>
          <div
            style={{
              // logo container — wider so non-square logos breathe
              maxWidth: 220,
              maxHeight: 96,
              minHeight: data.logo_url ? 0 : 64,
              minWidth: data.logo_url ? 0 : 96,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              flexShrink: 0,
              border: data.logo_url ? "none" : `1px dashed ${ruleColor}`,
              background: data.logo_url ? "transparent" : "#faf9f6",
              padding: data.logo_url ? 0 : "12px 18px",
            }}
          >
            {data.logo_url ? (
              <img
                src={data.logo_url}
                alt=""
                crossOrigin="anonymous"
                style={{ maxWidth: 220, maxHeight: 96, objectFit: "contain", display: "block" }}
              />
            ) : (
              <span style={{ fontSize: 9, color: inkMute, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em" }}>LOGO</span>
            )}
          </div>
          {showWordmark && (
            <div
              style={{
                fontFamily: "Inter Tight, sans-serif",
                fontWeight: 600,
                fontSize: 22,
                letterSpacing: "-0.01em",
                color: ink,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {data.company_name}
            </div>
          )}
        </div>
        <div
          style={{
            fontFamily: "Inter Tight, sans-serif",
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: "0.2em",
            color: ink,
            flexShrink: 0,
          }}
        >
          INVOICE
        </div>
      </div>

      <div style={{ height: 1, background: ink, width: "100%", marginBottom: sectionGap }} />

      {/* ============== META BLOCK ============== */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: sectionGap + 4 }}>
        <div>
          <div style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.14em", color: ink, marginBottom: 14 }}>
            INVOICE TO :
          </div>
          <div style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 700, fontSize: 14, color: ink, letterSpacing: "0.04em" }}>
            {data.client_name || "—"}
          </div>
        </div>
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontFamily: "Inter Tight, sans-serif", fontSize: 12.5, color: ink, letterSpacing: "0.01em" }}>
            <span>Invoice No&nbsp;:&nbsp;</span>
            <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{data.invoice_number}</span>
          </div>
          <div style={{ fontFamily: "Inter Tight, sans-serif", fontSize: 12.5, color: ink, letterSpacing: "0.01em" }}>
            <span>Invoice Date&nbsp;:&nbsp;</span>
            <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{dateText}</span>
          </div>
        </div>
      </div>

      {/* ============== ITEMS TABLE ============== */}
      <div style={{ height: 1, background: ruleColor, width: "100%" }} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 70px 130px 110px",
          padding: "14px 0 12px",
          fontFamily: "Inter Tight, sans-serif",
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: "0.14em",
          color: ink,
        }}
      >
        <div>SERVICE</div>
        <div style={{ textAlign: "center" }}>QTY</div>
        <div style={{ textAlign: "right" }}>UNIT PRICE</div>
        <div style={{ textAlign: "right" }}>TOTAL</div>
      </div>
      <div style={{ height: 1, background: ruleColor, width: "100%" }} />

      {items.map((it, i) => {
        const rowTotal = calcRowTotal(it.qty, it.unit_price);
        const orig = it.original_unit_price != null && Number(it.original_unit_price) > 0
          ? Number(it.original_unit_price)
          : null;
        return (
          <div key={i}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 70px 130px 110px",
                padding: `${rowVPad}px 0 ${Math.max(8, rowVPad - 6)}px`,
                alignItems: "start",
                fontFamily: "Inter Tight, sans-serif",
                fontSize: bodyFs,
                color: ink,
                lineHeight: 1.5,
              }}
            >
              <div style={{ paddingRight: 12 }}>
                <div style={{ fontWeight: 500, letterSpacing: 0, wordSpacing: "normal" }}>{it.service || "—"}</div>
                {it.note ? (
                  <div
                    style={{
                      fontSize: noteFs,
                      color: accentNote,
                      marginTop: 5,
                      fontStyle: "italic",
                      letterSpacing: 0,
                      wordSpacing: "normal",
                      lineHeight: 1.5,
                    }}
                  >
                    * {it.note}
                  </div>
                ) : null}
              </div>
              <div style={{ textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{it.qty || 0}</div>
              <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {orig ? (
                  <>
                    <span style={{ textDecoration: "line-through", color: inkMute, marginRight: 6 }}>
                      {formatZAR(orig)}
                    </span>
                    <span>{formatZAR(it.unit_price)}</span>
                  </>
                ) : (
                  formatZAR(it.unit_price)
                )}
              </div>
              <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{formatZAR(rowTotal)}</div>
            </div>
            <div style={{ height: 1, background: ruleColor, width: "100%" }} />
          </div>
        );
      })}

      {/* spacer pushes footer block down */}
      <div style={{ flex: 1, minHeight: dense ? 24 : 40 }} />

      {/* ============== BANK + TOTAL ============== */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start", marginBottom: dense ? 24 : 36 }}>
        <div
          style={{
            border: `1px solid ${accentNote}`,
            padding: "16px 20px",
            fontFamily: "Inter Tight, sans-serif",
            fontSize: 12,
            color: ink,
            lineHeight: 1.85,
            maxWidth: 320,
          }}
        >
          <div style={{ fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>BANK ACCOUNT DETAILS:</div>
          <div><span style={{ fontWeight: 700 }}>NAME:</span> {data.bank_account_name || "—"}</div>
          <div><span style={{ fontWeight: 700 }}>BANK:</span> {data.bank_name || "—"}</div>
          <div><span style={{ fontWeight: 700 }}>ACC NO:</span> <span style={{ fontVariantNumeric: "tabular-nums" }}>{data.bank_account_number || "—"}</span></div>
        </div>
        <div style={{ alignSelf: "end" }}>
          <div style={{ height: 1, background: ink }} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "14px 4px 14px 12px",
              fontFamily: "Inter Tight, sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: ink,
              letterSpacing: "0.02em",
            }}
          >
            <span>Total Due&nbsp;:</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatZAR(grand)}</span>
          </div>
          <div style={{ height: 1, background: ink }} />
        </div>
      </div>

      {/* ============== SIGNATURE + THANK YOU ============== */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "end", marginBottom: dense ? 20 : 32 }}>
        <div>
          <div style={{ height: 56, display: "flex", alignItems: "flex-end" }}>
            {data.signature_url ? (
              <img
                src={data.signature_url}
                alt=""
                crossOrigin="anonymous"
                style={{ maxHeight: 56, maxWidth: 200, objectFit: "contain" }}
              />
            ) : (
              <span style={{ fontFamily: "Caveat, cursive", fontSize: 28, color: ink }}>&nbsp;</span>
            )}
          </div>
          <div style={{ height: 1, background: ink, width: 200, marginTop: 4 }} />
          <div style={{ fontFamily: "Inter Tight, sans-serif", fontSize: 11, color: inkSoft, marginTop: 6, marginLeft: 70, letterSpacing: "0.08em" }}>
            Signed
          </div>
        </div>
        <div style={{ textAlign: "right", fontFamily: "Inter Tight, sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "0.2em", color: ink }}>
          THANK YOU!
        </div>
      </div>

      {/* ============== FOOTER ============== */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center", gap: 16, fontFamily: "Inter Tight, sans-serif", fontSize: 11.5, color: ink, lineHeight: 1.7 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {data.phone ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <PhoneGlyph />
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatPhone(data.phone)}</span>
            </span>
          ) : null}
        </div>
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 4 }}>
          {data.email ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
              <MailGlyph />
              <span>{data.email}</span>
            </span>
          ) : null}
          {data.website ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
              <GlobeGlyph />
              <span>{data.website}</span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
});
InvoiceSheet.displayName = "InvoiceSheet";

/* ============================================================
   Inline SVG glyphs — sized for footer line height (~13px).
   Stroke uses the sheet's ink colour so they survive html2canvas.
   ============================================================ */
function PhoneGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111317" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}
function MailGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111317" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2"/>
      <path d="m3 7 9 6 9-6"/>
    </svg>
  );
}
function GlobeGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111317" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9"/>
      <path d="M3 12h18"/>
      <path d="M12 3a14 14 0 0 1 0 18"/>
      <path d="M12 3a14 14 0 0 0 0 18"/>
    </svg>
  );
}
