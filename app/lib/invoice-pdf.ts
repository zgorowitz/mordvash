import type { ClientPreset, Invoice, VendorPreset } from "./invoice-store";

type DownloadInvoicePdfInput = {
  invoice: Invoice;
  client?: ClientPreset;
  vendor?: VendorPreset;
};

type InvoicePdfFile = {
  blob: Blob;
  fileName: string;
};

const page = {
  width: 612,
  height: 792,
  margin: 54
};

const ink = "#1f1f1f";
const muted = "#666666";
const line = "#c7c7c7";
const soft = "#f3f3f3";

export async function downloadInvoicePdf({ invoice, client, vendor }: DownloadInvoicePdfInput) {
  const { blob, fileName } = await createInvoicePdfFile({ invoice, client, vendor });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

export async function createInvoicePdfFile({ invoice, client, vendor }: DownloadInvoicePdfInput): Promise<InvoicePdfFile> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  const fileName = `${slug(client?.name || "invoice")}-${invoice.invoiceNumber}.pdf`;

  doc.setProperties({
    title: `Invoice ${invoice.invoiceNumber}`,
    subject: client?.name ? `Invoice for ${client.name}` : "Invoice",
    creator: vendor?.name || "Invoice Desk"
  });

  drawPageBackground(doc);
  drawTop(doc, invoice, vendor);
  drawDetails(doc, invoice, client, vendor);
  drawLineItems(doc, invoice);
  drawTotal(doc, invoice);
  drawNotes(doc, invoice);

  return {
    blob: doc.output("blob"),
    fileName
  };
}

function drawPageBackground(doc: import("jspdf").jsPDF) {
  doc.setFillColor("#ffffff");
  doc.rect(0, 0, page.width, page.height, "F");
  doc.setDrawColor(line);
  doc.setLineWidth(0.8);
  doc.rect(page.margin - 18, page.margin - 18, page.width - (page.margin - 18) * 2, page.height - (page.margin - 18) * 2);
}

function drawTop(doc: import("jspdf").jsPDF, invoice: Invoice, vendor?: VendorPreset) {
  const left = page.margin;
  const right = page.width - page.margin;

  doc.setTextColor(ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(vendor?.name || "", left, 76);

  doc.setTextColor(muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  textLines(doc, [vendor?.email, ...splitAddress(vendor?.address), vendor?.phone], left, 94, 14, 230);

  doc.setTextColor(ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("INVOICE", right, 76, { align: "right" });

  const rows = [
    ["Invoice #", invoice.invoiceNumber],
    ["Date", formatDate(invoice.date)],
    ["Payment Terms", invoice.terms]
  ];
  let y = 108;
  rows.forEach(([label, value]) => {
    doc.setTextColor(ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(label, right - 150, y);
    doc.setTextColor(muted);
    doc.setFont("helvetica", "normal");
    doc.text(value || "", right, y, { align: "right" });
    y += 17;
  });

  doc.setDrawColor(line);
  doc.line(left, 164, right, 164);
}

function drawDetails(
  doc: import("jspdf").jsPDF,
  invoice: Invoice,
  client?: ClientPreset,
  vendor?: VendorPreset
) {
  sectionTitle(doc, "Bill To", page.margin, 196, 226);
  doc.setTextColor(ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(client?.name || "", page.margin, 224);
  doc.setTextColor(muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  textLines(doc, [...splitAddress(client?.address), client?.email], page.margin, 242, 14, 226);
  detailRow(doc, "Identification Number", client?.identificationNumber, page.margin, 292, 226);
  detailRow(doc, "Tax Identification Number", client?.taxIdentificationNumber, page.margin, 309, 226);
  detailRow(doc, "Bank", client?.bank, page.margin, 326, 226);
  detailRow(doc, "Account", client?.account, page.margin, 343, 226);
  detailRow(doc, "Routing", client?.routing, page.margin, 360, 226);

  const rightX = 330;
  sectionTitle(doc, "Payment Details", rightX, 196, 228);
  detailRow(doc, "Bank", vendor?.bank, rightX, 224, 228);
  detailRow(doc, "Account Number", vendor?.account, rightX, 241, 228);
  detailRow(doc, "Routing Number", vendor?.routing, rightX, 258, 228);
  detailRow(doc, "Wire Transfers", vendor?.wire, rightX, 275, 228);
  detailRow(doc, "Terms", invoice.terms, rightX, 292, 228);
}

function drawLineItems(doc: import("jspdf").jsPDF, invoice: Invoice) {
  const x = page.margin;
  const y = 380;
  const w = page.width - page.margin * 2;
  const titleW = 132;
  const amountW = 92;
  const descW = w - titleW - amountW;

  doc.setFillColor(soft);
  doc.setDrawColor(line);
  doc.rect(x, y, w, 30, "FD");

  doc.setTextColor(ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Title", x + 12, y + 19);
  doc.text("Description", x + titleW + 12, y + 19);
  doc.text("Total Price", x + w - 12, y + 19, { align: "right" });

  const rowY = y + 30;
  const rowH = 58;
  doc.setFillColor("#ffffff");
  doc.rect(x, rowY, w, rowH, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(ink);
  drawWrapped(doc, invoice.title || "", x + 12, rowY + 20, titleW - 20, 13);
  drawWrapped(doc, invoice.description || "", x + titleW + 12, rowY + 20, descW - 20, 13);
  doc.text(currency(invoice.amount), x + w - 12, rowY + 20, { align: "right" });

  doc.line(x + titleW, y, x + titleW, rowY + rowH);
  doc.line(x + titleW + descW, y, x + titleW + descW, rowY + rowH);
}

function drawTotal(doc: import("jspdf").jsPDF, invoice: Invoice) {
  const x = 356;
  const y = 512;
  const w = page.width - page.margin - x;

  doc.setDrawColor(ink);
  doc.setLineWidth(0.9);
  doc.line(x, y, x + w, y);
  doc.line(x, y + 36, x + w, y + 36);

  doc.setTextColor(ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Total Balance", x, y + 23);
  doc.text(currency(invoice.amount), x + w, y + 23, { align: "right" });
}

function drawNotes(doc: import("jspdf").jsPDF, invoice: Invoice) {
  const x = page.margin;
  const y = 606;
  const w = page.width - page.margin * 2;

  doc.setDrawColor(line);
  doc.setLineWidth(0.8);
  doc.line(x, y, x + w, y);
  doc.setTextColor(ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Notes:", x, y + 26);
  doc.setTextColor(muted);
  doc.setFont("helvetica", "normal");
  drawWrapped(doc, invoice.notes || "", x + 48, y + 26, w - 48, 14);
}

function sectionTitle(doc: import("jspdf").jsPDF, title: string, x: number, y: number, width: number) {
  doc.setFillColor(soft);
  doc.setDrawColor(line);
  doc.rect(x, y - 18, width, 24, "FD");
  doc.setTextColor(ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(title, x + 10, y - 2);
}

function detailRow(doc: import("jspdf").jsPDF, label: string, value: string | undefined, x: number, y: number, width: number) {
  if (!value) return;
  doc.setTextColor(ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(label, x, y);
  doc.setTextColor(muted);
  doc.setFont("helvetica", "normal");
  doc.text(value, x + width, y, { align: "right", maxWidth: width - 92 });
}

function textLines(
  doc: import("jspdf").jsPDF,
  lines: Array<string | undefined>,
  x: number,
  startY: number,
  lineHeight: number,
  maxWidth: number
) {
  let y = startY;
  lines
    .filter((line): line is string => Boolean(line?.trim()))
    .forEach((line) => {
      const wrapped = doc.splitTextToSize(line, maxWidth) as string[];
      wrapped.forEach((part) => {
        doc.text(part, x, y);
        y += lineHeight;
      });
    });
}

function drawWrapped(doc: import("jspdf").jsPDF, text: string, x: number, y: number, width: number, lineHeight: number) {
  const lines = doc.splitTextToSize(text, width) as string[];
  lines.slice(0, 4).forEach((line, index) => doc.text(line, x, y + index * lineHeight));
}

function splitAddress(address?: string) {
  return (address || "")
    .split(",")
    .map((line) => line.trim())
    .filter(Boolean);
}

function currency(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "$0.00";
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDate(value: string) {
  if (!value) return "";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US");
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}
