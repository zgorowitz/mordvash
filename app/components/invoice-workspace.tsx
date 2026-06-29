"use client";

import {
  Clock3,
  FileText,
  Folder,
  Plus,
  Save,
  Settings2,
  Trash2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type FolderItem = {
  id: string;
  name: string;
};

type VendorPreset = {
  id: string;
  name: string;
  email: string;
  address: string;
  terms: string;
  bank: string;
  account: string;
  routing: string;
  wire: string;
};

type HistoryEvent = {
  id: string;
  at: string;
  message: string;
};

type Invoice = {
  id: string;
  folderId: string;
  number: string;
  client: string;
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

type AppState = {
  folders: FolderItem[];
  vendors: VendorPreset[];
  invoices: Invoice[];
};

const storageKey = "invoice-desk-state";

const seedState: AppState = {
  folders: [
    { id: "active", name: "Active" },
    { id: "paid", name: "Paid" },
    { id: "archive", name: "Archive" }
  ],
  vendors: [
    {
      id: "mordvash",
      name: "MORDVASH 613 INC.",
      email: "mordvash613@gmail.com",
      address: "551 Midwood St, Brooklyn, NY 11203",
      terms: "Due on receipt",
      bank: "Bank",
      account: "966585561",
      routing: "267084131",
      wire: "21000021"
    }
  ],
  invoices: [
    {
      id: "inv-022",
      folderId: "active",
      number: "022",
      client: "EncoreOne LLC",
      vendorId: "mordvash",
      date: "2026-06-29",
      terms: "Due on receipt",
      title: "Consulting",
      description: "Administrative Support Services",
      amount: "5964.00",
      status: "Sent",
      notes: "",
      history: [
        {
          id: "h-1",
          at: "2026-06-29T15:37:00.000Z",
          message: "Imported starter invoice."
        }
      ]
    }
  ]
};

const blankInvoice = (folderId: string, vendorId: string): Invoice => ({
  id: crypto.randomUUID(),
  folderId,
  number: "",
  client: "",
  vendorId,
  date: new Date().toISOString().slice(0, 10),
  terms: "Due on receipt",
  title: "",
  description: "",
  amount: "",
  status: "Draft",
  notes: "",
  history: [
    {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      message: "Invoice created."
    }
  ]
});

const blankVendor = (): VendorPreset => ({
  id: crypto.randomUUID(),
  name: "",
  email: "",
  address: "",
  terms: "Due on receipt",
  bank: "",
  account: "",
  routing: "",
  wire: ""
});

export function InvoiceWorkspace() {
  const [state, setState] = useState<AppState>(seedState);
  const [ready, setReady] = useState(false);
  const [activeFolder, setActiveFolder] = useState(seedState.folders[0].id);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(seedState.invoices[0].id);
  const [draft, setDraft] = useState(seedState.invoices[0]);
  const [vendorDraft, setVendorDraft] = useState(seedState.vendors[0]);
  const [folderName, setFolderName] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved) as AppState;
      setState(parsed);
      setActiveFolder(parsed.folders[0]?.id ?? "active");
      setSelectedInvoiceId(parsed.invoices[0]?.id ?? "");
      setDraft(parsed.invoices[0] ?? blankInvoice(parsed.folders[0]?.id ?? "active", parsed.vendors[0]?.id ?? ""));
      setVendorDraft(parsed.vendors[0] ?? blankVendor());
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [ready, state]);

  const visibleInvoices = useMemo(
    () => state.invoices.filter((invoice) => invoice.folderId === activeFolder),
    [activeFolder, state.invoices]
  );

  const selectedInvoice = state.invoices.find((invoice) => invoice.id === selectedInvoiceId);
  const selectedVendor = state.vendors.find((vendor) => vendor.id === draft.vendorId);

  function selectInvoice(invoice: Invoice) {
    setSelectedInvoiceId(invoice.id);
    setDraft(invoice);
  }

  function addFolder() {
    const name = folderName.trim();
    if (!name) return;
    const folder = { id: crypto.randomUUID(), name };
    setState((current) => ({ ...current, folders: [...current.folders, folder] }));
    setActiveFolder(folder.id);
    setFolderName("");
  }

  function addInvoice() {
    const invoice = blankInvoice(activeFolder, state.vendors[0]?.id ?? "");
    setState((current) => ({ ...current, invoices: [invoice, ...current.invoices] }));
    setSelectedInvoiceId(invoice.id);
    setDraft(invoice);
  }

  function saveInvoice() {
    const event = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      message: "Invoice details saved."
    };
    const updated = { ...draft, history: [event, ...draft.history] };
    setState((current) => ({
      ...current,
      invoices: current.invoices.map((invoice) => (invoice.id === updated.id ? updated : invoice))
    }));
    setDraft(updated);
  }

  function deleteInvoice() {
    if (!selectedInvoice) return;
    setState((current) => ({
      ...current,
      invoices: current.invoices.filter((invoice) => invoice.id !== selectedInvoice.id)
    }));
    const nextInvoice = state.invoices.find((invoice) => invoice.id !== selectedInvoice.id);
    if (nextInvoice) {
      setSelectedInvoiceId(nextInvoice.id);
      setDraft(nextInvoice);
    }
  }

  function saveVendor() {
    const exists = state.vendors.some((vendor) => vendor.id === vendorDraft.id);
    setState((current) => ({
      ...current,
      vendors: exists
        ? current.vendors.map((vendor) => (vendor.id === vendorDraft.id ? vendorDraft : vendor))
        : [vendorDraft, ...current.vendors]
    }));
  }

  function newVendor() {
    setVendorDraft(blankVendor());
  }

  function applyVendor(vendorId: string) {
    const vendor = state.vendors.find((item) => item.id === vendorId);
    setDraft((current) => ({
      ...current,
      vendorId,
      terms: vendor?.terms ?? current.terms
    }));
  }

  return (
    <div className="workspace">
      <aside className="panel folderPanel">
        <div className="panelTitle">
          <Folder size={18} />
          <span>Folders</span>
        </div>
        <div className="folderList">
          {state.folders.map((folder) => {
            const count = state.invoices.filter((invoice) => invoice.folderId === folder.id).length;
            return (
              <button
                className={folder.id === activeFolder ? "folderButton active" : "folderButton"}
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
              >
                <span>{folder.name}</span>
                <span>{count}</span>
              </button>
            );
          })}
        </div>
        <div className="inlineForm">
          <input
            aria-label="New folder name"
            value={folderName}
            onChange={(event) => setFolderName(event.target.value)}
            placeholder="New folder"
          />
          <button className="iconButton" onClick={addFolder} title="Add folder">
            <Plus size={16} />
          </button>
        </div>
      </aside>

      <section className="panel invoiceList">
        <div className="sectionHeader">
          <div className="panelTitle">
            <FileText size={18} />
            <span>Invoices</span>
          </div>
          <button className="smallButton" onClick={addInvoice}>
            <Plus size={16} />
            New
          </button>
        </div>
        <div className="invoiceRows">
          {visibleInvoices.map((invoice) => (
            <button
              className={invoice.id === selectedInvoiceId ? "invoiceRow active" : "invoiceRow"}
              key={invoice.id}
              onClick={() => selectInvoice(invoice)}
            >
              <span>
                <strong>{invoice.number || "No number"}</strong>
                <small>{invoice.client || "No client"}</small>
              </span>
              <span>
                <strong>{currency(invoice.amount)}</strong>
                <small>{invoice.status}</small>
              </span>
            </button>
          ))}
          {!visibleInvoices.length && <p className="muted">No invoices in this folder.</p>}
        </div>
      </section>

      <section className="panel editorPanel">
        <div className="sectionHeader">
          <div className="panelTitle">
            <Settings2 size={18} />
            <span>Edit invoice</span>
          </div>
          <div className="actions">
            <button className="smallButton" onClick={saveInvoice}>
              <Save size={16} />
              Save
            </button>
            <button className="iconButton danger" onClick={deleteInvoice} title="Delete invoice">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="formGrid">
          <label>
            Invoice #
            <input value={draft.number} onChange={(event) => setDraft({ ...draft, number: event.target.value })} />
          </label>
          <label>
            Client
            <input value={draft.client} onChange={(event) => setDraft({ ...draft, client: event.target.value })} />
          </label>
          <label>
            Folder
            <select value={draft.folderId} onChange={(event) => setDraft({ ...draft, folderId: event.target.value })}>
              {state.folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Vendor preset
            <select value={draft.vendorId} onChange={(event) => applyVendor(event.target.value)}>
              {state.vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name || "Unnamed vendor"}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input
              type="date"
              value={draft.date}
              onChange={(event) => setDraft({ ...draft, date: event.target.value })}
            />
          </label>
          <label>
            Terms
            <input value={draft.terms} onChange={(event) => setDraft({ ...draft, terms: event.target.value })} />
          </label>
          <label>
            Title
            <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          </label>
          <label>
            Amount
            <input value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} />
          </label>
          <label>
            Description
            <textarea
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
          </label>
          <label>
            Notes
            <textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
          </label>
        </div>

        {selectedVendor && (
          <div className="vendorSummary">
            <strong>{selectedVendor.name}</strong>
            <span>{selectedVendor.email}</span>
            <span>{selectedVendor.address}</span>
            <span>
              Routing {selectedVendor.routing || "-"} · Account {selectedVendor.account || "-"}
            </span>
          </div>
        )}
      </section>

      <aside className="sideStack">
        <section className="panel">
          <div className="sectionHeader">
            <div className="panelTitle">
              <Settings2 size={18} />
              <span>Vendor preset</span>
            </div>
            <button className="smallButton" onClick={newVendor}>
              <Plus size={16} />
              New
            </button>
          </div>
          <div className="compactForm">
            <select
              value={vendorDraft.id}
              onChange={(event) => {
                const vendor = state.vendors.find((item) => item.id === event.target.value);
                if (vendor) setVendorDraft(vendor);
              }}
            >
              {state.vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name || "Unnamed vendor"}
                </option>
              ))}
            </select>
            <input
              value={vendorDraft.name}
              onChange={(event) => setVendorDraft({ ...vendorDraft, name: event.target.value })}
              placeholder="Vendor name"
            />
            <input
              value={vendorDraft.email}
              onChange={(event) => setVendorDraft({ ...vendorDraft, email: event.target.value })}
              placeholder="Email"
            />
            <input
              value={vendorDraft.address}
              onChange={(event) => setVendorDraft({ ...vendorDraft, address: event.target.value })}
              placeholder="Address"
            />
            <input
              value={vendorDraft.terms}
              onChange={(event) => setVendorDraft({ ...vendorDraft, terms: event.target.value })}
              placeholder="Terms"
            />
            <input
              value={vendorDraft.bank}
              onChange={(event) => setVendorDraft({ ...vendorDraft, bank: event.target.value })}
              placeholder="Bank"
            />
            <input
              value={vendorDraft.account}
              onChange={(event) => setVendorDraft({ ...vendorDraft, account: event.target.value })}
              placeholder="Account"
            />
            <input
              value={vendorDraft.routing}
              onChange={(event) => setVendorDraft({ ...vendorDraft, routing: event.target.value })}
              placeholder="Routing"
            />
            <input
              value={vendorDraft.wire}
              onChange={(event) => setVendorDraft({ ...vendorDraft, wire: event.target.value })}
              placeholder="Wire"
            />
            <button className="primaryButton fullWidth" onClick={saveVendor}>
              Save preset
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panelTitle">
            <Clock3 size={18} />
            <span>History</span>
          </div>
          <div className="historyList">
            {draft.history.map((event) => (
              <div className="historyItem" key={event.id}>
                <strong>{event.message}</strong>
                <span>{new Date(event.at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function currency(value: string) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "$0.00";
  return number.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
