import { forwardRef } from "react";
import { format } from "date-fns";
import { formatZAR, calcRowTotal, calcGrandTotal } from "@/lib/format";

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
 * Margins: 56 px (≈ 14.8 mm) on all sides — clean print margins
 */
export const InvoiceSheet = forwardRef<HTMLDivElement, { data: InvoiceData }>(({ data }, ref) => {
  const dateText =
    data.invoice_date instanceof Date
      ? format(data.invoice_date, "dd/MM/yyyy")
      : format(new Date(data.invoice_date), "dd/MM/yyyy");

  const items = data.items.length ? data.items : [{ service: "", qty: 0, unit_price: 0 }];
  const grand = calcGrandTotal(items);

  // ----- typography tokens (locked to the sheet, not the app theme) -----
  const ink = "#111317";
  const inkSoft = "#3a3d44";
  const inkMute = "#7a7d85";
  const ruleColor = "#d8d6d0";
  const accentNote = "#5b4b6f"; // muted plum-grey for the small note line, like the reference

  return (
    <div
      ref={ref}
      className="a4-sheet"
      style={{
        boxSizing: "border-box",
        padding: "56px 56px 48px 56px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ============== HEADER ============== */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <div
            style={{
              width: 48,
              height: 48,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              border: data.logo_url ? "none" : `1px dashed ${ruleColor}`,
              background: data.logo_url ? "transparent" : "#faf9f6",
            }}
          >
            {data.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.logo_url}
                alt=""
                crossOrigin="anonymous"
                style={{ maxWidth: 48, maxHeight: 48, objectFit: "contain", display: "block" }}
              />
            ) : (
              <span style={{ fontSize: 9, color: inkMute, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em" }}>LOGO</span>
            )}
          </div>
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
            {data.company_name || "Your company name"}
          </div>
        </div>
        <div
          style={{
            fontFamily: "Inter Tight, sans-serif",
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: "0.18em",
            color: ink,
          }}
        >
          INVOICE
        </div>
      </div>

      <div style={{ height: 1, background: ink, width: "100%", marginBottom: 22 }} />

      {/* ============== META BLOCK ============== */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.12em", color: ink, marginBottom: 14 }}>
            INVOICE TO :
          </div>
          <div style={{ fontFamily: "Inter Tight, sans-serif", fontWeight: 700, fontSize: 13, color: ink, letterSpacing: "0.04em" }}>
            {data.client_name || "Client name"}
          </div>
        </div>
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontFamily: "Inter Tight, sans-serif", fontSize: 12, color: ink }}>
            Invoice No : <span style={{ color: inkMute }}>__</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{data.invoice_number}</span>
            <span style={{ color: inkMute }}>__</span>
          </div>
          <div style={{ fontFamily: "Inter Tight, sans-serif", fontSize: 12, color: ink }}>
            Invoice Date : <span style={{ color: inkMute }}>__</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{dateText}</span>
            <span style={{ color: inkMute }}>__</span>
          </div>
        </div>
      </div>

      {/* ============== ITEMS TABLE ============== */}
      <div style={{ height: 1, background: ruleColor, width: "100%" }} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 70px 130px 110px",
          padding: "12px 0 10px",
          fontFamily: "Inter Tight, sans-serif",
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: "0.12em",
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
                padding: "14px 0 8px",
                alignItems: "start",
                fontFamily: "Inter Tight, sans-serif",
                fontSize: 13,
                color: ink,
              }}
            >
              <div>
                <div style={{ fontWeight: 500 }}>{it.service || "—"}</div>
                {it.note ? (
                  <div
                    style={{
                      fontSize: 10.5,
                      color: accentNote,
                      marginTop: 4,
                      fontStyle: "italic",
                      letterSpacing: "0.01em",
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
              <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatZAR(rowTotal)}</div>
            </div>
            <div style={{ height: 1, background: ruleColor, width: "100%" }} />
          </div>
        );
      })}

      {/* spacer pushes footer block down */}
      <div style={{ flex: 1, minHeight: 40 }} />

      {/* ============== BANK + TOTAL ============== */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start", marginBottom: 36 }}>
        <div
          style={{
            border: `1px solid ${accentNote}`,
            padding: "16px 18px",
            fontFamily: "Inter Tight, sans-serif",
            fontSize: 12,
            color: ink,
            lineHeight: 1.7,
            maxWidth: 320,
          }}
        >
          <div style={{ fontWeight: 700, letterSpacing: "0.06em", marginBottom: 8 }}>BANK ACCOUNT DETAILS:</div>
          <div><span style={{ fontWeight: 700 }}>NAME:</span> {data.bank_account_name || "—"}</div>
          <div><span style={{ fontWeight: 700 }}>BANK:</span> {data.bank_name || "—"}</div>
          <div><span style={{ fontWeight: 700 }}>ACC NO:</span> {data.bank_account_number || "—"}</div>
        </div>
        <div style={{ alignSelf: "end" }}>
          <div style={{ height: 1, background: ink }} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 4px 12px 12px",
              fontFamily: "Inter Tight, sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: ink,
              letterSpacing: "0.02em",
            }}
          >
            <span>Total Due :</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatZAR(grand)}</span>
          </div>
          <div style={{ height: 1, background: ink }} />
        </div>
      </div>

      {/* ============== SIGNATURE + THANK YOU ============== */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "end", marginBottom: 28 }}>
        <div>
          <div style={{ height: 56, display: "flex", alignItems: "flex-end" }}>
            {data.signature_url ? (
              // eslint-disable-next-line @next/next/no-img-element
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
          <div style={{ fontFamily: "Inter Tight, sans-serif", fontSize: 11, color: inkSoft, marginTop: 4, marginLeft: 70, letterSpacing: "0.06em" }}>
            Signed
          </div>
        </div>
        <div style={{ textAlign: "right", fontFamily: "Inter Tight, sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "0.18em", color: ink }}>
          THANK YOU!
        </div>
      </div>

      {/* ============== FOOTER ============== */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 16, fontFamily: "Inter Tight, sans-serif", fontSize: 11, color: ink }}>
        <div style={{ fontVariantNumeric: "tabular-nums" }}>{data.phone || ""}</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: inkSoft }}>
          <span style={{ fontSize: 11 }}>✉</span>
          <span style={{ fontSize: 11 }}>⌾</span>
        </div>
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 2 }}>
          <span>{data.email || ""}</span>
          <span>{data.website || ""}</span>
        </div>
      </div>
    </div>
  );
});
InvoiceSheet.displayName = "InvoiceSheet";
