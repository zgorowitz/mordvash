import repoState from "../../data/app-state.json";

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
  identificationNumber: string;
  taxIdentificationNumber: string;
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

export type Invitation = {
  id: string;
  email: string;
  role: "Owner" | "Member";
  createdAt: string;
};

export type AppState = {
  vendors: VendorPreset[];
  clients: ClientPreset[];
  invoices: Invoice[];
  invitations: Invitation[];
};

export const storageKey = "invoice-desk-state-v3";

const repoSeed = repoState as Partial<AppState>;
const repoSeedClients = Array.isArray(repoSeed.clients) ? repoSeed.clients : [];

const seedStateFallback: AppState = {
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
  clients: [],
  invoices: [],
  invitations: [
    {
      id: "invite-owner",
      email: "zgorowitz@gmail.com",
      role: "Owner",
      createdAt: "2026-06-29T00:00:00.000Z"
    }
  ]
};

export const seedState: AppState = normalizeAppState(repoSeed);

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
    identificationNumber: "",
    taxIdentificationNumber: "",
    bank: "",
    account: "",
    routing: "",
    defaultTitle: "",
    defaultDescription: "",
    defaultAmount: "",
    defaultTerms: "Due on receipt"
  };
}

export function blankInvitation(): Invitation {
  return {
    id: createId("invite"),
    email: "",
    role: "Member",
    createdAt: new Date().toISOString()
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

  return normalizeAppState(candidate);
}

export function isEmailInvited(email: string | null | undefined, invitations: Invitation[]) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return false;

  return invitations.some((invitation) => normalizeEmail(invitation.email) === normalizedEmail);
}

export function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export function serializeAppState(state: AppState) {
  return JSON.stringify(safeState(state), null, 2) + "\n";
}

function normalizeAppState(input: Partial<AppState>): AppState {
  const vendors = Array.isArray(input.vendors) && input.vendors.length ? input.vendors : seedStateFallback.vendors;
  const clients = mergeSeedClients(Array.isArray(input.clients) ? input.clients : []);
  const invoices = Array.isArray(input.invoices) ? input.invoices.map(normalizeInvoice) : seedStateFallback.invoices;
  const invitations = mergeSeedInvitations(Array.isArray(input.invitations) ? input.invitations : []);

  return {
    vendors,
    clients: clients.length ? clients : seedStateFallback.clients,
    invoices,
    invitations: invitations.length ? invitations : seedStateFallback.invitations
  };
}

function mergeSeedClients(clients: ClientPreset[]) {
  const normalized = clients.map((client) => normalizeClientPreset(client));
  const clientIds = new Set(normalized.map((client) => client.id));
  const seedClients = repoSeedClients.length ? repoSeedClients : seedStateFallback.clients;
  const missingSeedClients = seedClients.filter((client) => !clientIds.has(client.id));

  return [...normalized, ...missingSeedClients];
}

function normalizeClientPreset(client: ClientPreset): ClientPreset {
  return {
    ...client,
    identificationNumber: client.identificationNumber ?? "",
    taxIdentificationNumber: client.taxIdentificationNumber ?? ""
  };
}

function mergeSeedInvitations(invitations: Invitation[]) {
  const normalized = [...invitations, ...envInvitations()].map(normalizeInvitation).filter((invite) => invite.email);
  const invitationEmails = new Set(normalized.map((invitation) => normalizeEmail(invitation.email)));
  const missingSeedInvitations = seedStateFallback.invitations.filter(
    (invitation) => !invitationEmails.has(normalizeEmail(invitation.email))
  );

  return [...normalized, ...missingSeedInvitations];
}

function normalizeInvitation(invitation: Invitation): Invitation {
  return {
    id: invitation.id || createId("invite"),
    email: normalizeEmail(invitation.email),
    role: invitation.role === "Owner" ? "Owner" : "Member",
    createdAt: invitation.createdAt || new Date().toISOString()
  };
}

function normalizeInvoice(invoice: Invoice): Invoice {
  return {
    ...invoice,
    status: invoice.status === "Paid" || invoice.status === "Sent" ? invoice.status : "Draft",
    history: Array.isArray(invoice.history) ? invoice.history : []
  };
}

function envInvitations(): Invitation[] {
  return (process.env.NEXT_PUBLIC_INVITED_EMAILS ?? "")
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean)
    .map((email) => ({
      id: `invite-env-${email.replace(/[^a-z0-9]+/g, "-")}`,
      email,
      role: "Owner" as const,
      createdAt: "2026-06-29T00:00:00.000Z"
    }));
}
