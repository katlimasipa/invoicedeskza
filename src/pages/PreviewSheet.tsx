import { useEffect, useRef } from "react";
import { InvoiceSheet, type InvoiceData } from "@/components/invoice/InvoiceSheet";

const sample: InvoiceData = {
  invoice_number: "20260002",
  invoice_date: "2026-04-26",
  client_name: "Pegasus Premium",
  company_name: "Architeq Web Agency",
  logo_url: null,
  signature_url: null,
  phone: "+27 73 222 6839",
  email: "hello@architeq.co.za",
  website: "architeq.co.za",
  bank_name: "First National Bank",
  bank_account_name: "Business Account",
  bank_account_number: "62897336447",
  items: [
    { service: "Custom 5-page Website", note: "added functionalities", qty: 1, unit_price: 5000 },
    { service: "Google Business Profile", note: null, qty: 1, unit_price: 750 },
    { service: "Monthly Website Maintenance", note: "starting April 2026", qty: 1, unit_price: 500 },
  ],
};

export default function PreviewSheet() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (window as any).__sheetReady = false;
    if ((document as any).fonts?.ready) {
      (document as any).fonts.ready.then(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            (window as any).__sheetReady = true;
          });
        });
      });
    } else {
      (window as any).__sheetReady = true;
    }
  }, []);

  return (
    <div style={{ padding: 0, margin: 0, background: "#eee" }}>
      <InvoiceSheet ref={ref} data={sample} />
    </div>
  );
}
