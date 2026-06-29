export type VendorPreset = {
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  terms: string;
  bank: string;
  account: string;
  routing: string;
  wire: string;
};

export type ClientPreset = {
  id: string;
  name: string;
  address: string;
  email: string;
  bank: string;
  account: string;
  routing: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultAmount: string;
  defaultTerms: string;
};

export type HistoryEvent = {
  id: string;
  at: string;
  message: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  clientId: string;
  vendorId: string;
  date: string;
  terms: string;
  title: string;
  description: string;
  amount: string;
  status: "Draft" | "Sent" | "Paid";
  notes: string;
  history: HistoryEvent[];
};

export type AppState = {
  vendors: VendorPreset[];
  clients: ClientPreset[];
  invoices: Invoice[];
};

export const storageKey = "invoice-desk-state-v2";

export const seedState: AppState = {
  vendors: [
    {
      id: "vendor-mordvash",
      name: "MORDVASH 613 INC.",
      email: "mordvash613@gmail.com",
      address: "551 Midwood St, Brooklyn, NY 11203",
      phone: "(929) 398 5737",
      terms: "Due on receipt",
      bank: "Bank",
      account: "966585561",
      routing: "267084131",
      wire: "21000021"
    }
  ],
  clients: [
    {
      id: "client-encoreone",
      name: "EncoreOne LLC",
      address: "180 College Road, Monsey, NY 10952",
      email: "",
      bank: "",
      account: "",
      routing: "",
      defaultTitle: "Consulting",
      defaultDescription: "Administrative Support Services",
      defaultAmount: "5964.00",
      defaultTerms: "Due on receipt"
    }
  ],
  invoices: [
    {
      id: "invoice-022",
      invoiceNumber: "022",
      clientId: "client-encoreone",
      vendorId: "vendor-mordvash",
      date: "2026-06-29",
      terms: "Due on receipt",
      title: "Consulting",
      description: "Administrative Support Services",
      amount: "5964.00",
      status: "Sent",
      notes: "",
      history: [
        {
          id: "history-imported",
          at: "2026-06-29T15:37:00.000Z",
          message: "Imported starter invoice."
        }
      ]
    }
  ]
};

export function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function nextInvoiceNumber(invoices: Invoice[]) {
  const maxNumber = invoices.reduce((max, invoice) => {
    const parsed = Number.parseInt(invoice.invoiceNumber, 10);
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
  }, 0);

  return String(maxNumber + 1).padStart(3, "0");
}

export function createInvoiceForClient(
  client: ClientPreset,
  vendorId: string,
  invoices: Invoice[]
): Invoice {
  return {
    id: createId("invoice"),
    invoiceNumber: nextInvoiceNumber(invoices),
    clientId: client.id,
    vendorId,
    date: new Date().toISOString().slice(0, 10),
    terms: client.defaultTerms || "Due on receipt",
    title: client.defaultTitle,
    description: client.defaultDescription,
    amount: client.defaultAmount,
    status: "Draft",
    notes: "",
    history: [
      {
        id: createId("history"),
        at: new Date().toISOString(),
        message: "Invoice created from client preset."
      }
    ]
  };
}

export function blankVendorPreset(): VendorPreset {
  return {
    id: createId("vendor"),
    name: "",
    email: "",
    address: "",
    phone: "",
    terms: "Due on receipt",
    bank: "",
    account: "",
    routing: "",
    wire: ""
  };
}

export function blankClientPreset(): ClientPreset {
  return {
    id: createId("client"),
    name: "",
    address: "",
    email: "",
    bank: "",
    account: "",
    routing: "",
    defaultTitle: "",
    defaultDescription: "",
    defaultAmount: "",
    defaultTerms: "Due on receipt"
  };
}

export function safeState(input: unknown): AppState {
  if (!input || typeof input !== "object") {
    return seedState;
  }

  const candidate = input as Partial<AppState>;
  if (!Array.isArray(candidate.clients) || !Array.isArray(candidate.vendors) || !Array.isArray(candidate.invoices)) {
    return seedState;
  }

  return {
    clients: candidate.clients.length ? candidate.clients : seedState.clients,
    vendors: candidate.vendors.length ? candidate.vendors : seedState.vendors,
    invoices: candidate.invoices
  };
}
