"use client";

import { Download, FileText, Plus, Save, Trash2 } from "lucide-react";
import type { MouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ClientPreset,
  Invoice,
  VendorPreset,
  blankClientPreset,
  createInvoiceForClient,
  seedState
} from "../lib/invoice-store";
import { createInvoicePdfFile, downloadInvoicePdf } from "../lib/invoice-pdf";
import { useAppData } from "../lib/use-app-data";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

export function InvoiceWorkspace() {
  const { state, setState, ready } = useAppData();
  const [activeClientId, setActiveClientId] = useState(seedState.clients[0].id);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(seedState.invoices[0].id);
  const [draft, setDraft] = useState<Invoice>(seedState.invoices[0]);
  const [clientDraft, setClientDraft] = useState<ClientPreset>(blankClientPreset());
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const initializedSelection = useRef(false);

  useEffect(() => {
    if (!ready || initializedSelection.current) return;

    const firstClient = state.clients[0] ?? seedState.clients[0];
    let firstInvoice = state.invoices.find((invoice) => invoice.clientId === firstClient.id) ?? state.invoices[0];

    if (!firstInvoice) {
      firstInvoice = createInvoiceForClient(firstClient, state.vendors[0]?.id ?? "", state.invoices);
      setState((current) => ({ ...current, invoices: [firstInvoice, ...current.invoices] }));
    }

    setActiveClientId(firstClient.id);
    setSelectedInvoiceId(firstInvoice.id);
    setDraft(firstInvoice);
    initializedSelection.current = true;
  }, [ready, setState, state.clients, state.invoices, state.vendors]);

  const activeClient = state.clients.find((client) => client.id === activeClientId) ?? state.clients[0];
  const selectedVendor = state.vendors.find((vendor) => vendor.id === draft.vendorId) ?? state.vendors[0];
  const clientInvoices = useMemo(
    () => state.invoices.filter((invoice) => invoice.clientId === activeClient?.id),
    [activeClient?.id, state.invoices]
  );

  function selectClient(client: ClientPreset) {
    const invoice = state.invoices.find((item) => item.clientId === client.id);
    setActiveClientId(client.id);
    if (invoice) {
      setSelectedInvoiceId(invoice.id);
      setDraft(invoice);
      return;
    }

    const newInvoice = createInvoiceForClient(client, state.vendors[0]?.id ?? "", state.invoices);
    setState((current) => ({ ...current, invoices: [newInvoice, ...current.invoices] }));
    setSelectedInvoiceId(newInvoice.id);
    setDraft(newInvoice);
  }

  function selectInvoice(invoice: Invoice) {
    setSelectedInvoiceId(invoice.id);
    setDraft(invoice);
  }

  function addClient() {
    const name = clientDraft.name.trim();
    if (!name) return;

    const client = { ...clientDraft, name };
    const invoice = createInvoiceForClient(client, state.vendors[0]?.id ?? "", state.invoices);
    setState((current) => ({
      ...current,
      clients: [client, ...current.clients],
      invoices: [invoice, ...current.invoices]
    }));
    setActiveClientId(client.id);
    setSelectedInvoiceId(invoice.id);
    setDraft(invoice);
    setClientDraft(blankClientPreset());
    setClientDialogOpen(false);
  }

  function newInvoice() {
    if (!activeClient) return;
    const invoice = createInvoiceForClient(activeClient, state.vendors[0]?.id ?? "", state.invoices);
    setState((current) => ({ ...current, invoices: [invoice, ...current.invoices] }));
    setSelectedInvoiceId(invoice.id);
    setDraft(invoice);
  }

  function saveInvoice() {
    const event = {
      id: `history-${Date.now()}`,
      at: new Date().toISOString(),
      message: "Invoice details saved."
    };
    const updated = { ...draft, history: [event, ...draft.history] };
    setState((current) => ({
      ...current,
      invoices: current.invoices.map((invoice) => (invoice.id === updated.id ? updated : invoice))
    }));
    setSelectedInvoiceId(updated.id);
    setDraft(updated);
  }

  function deleteInvoice() {
    const remaining = state.invoices.filter((invoice) => invoice.id !== selectedInvoiceId);
    const nextInvoice =
      remaining.find((invoice) => invoice.clientId === activeClientId) ??
      remaining[0] ??
      (activeClient ? createInvoiceForClient(activeClient, state.vendors[0]?.id ?? "", remaining) : undefined);
    setState((current) => ({ ...current, invoices: remaining }));
    if (nextInvoice) {
      setState((current) =>
        current.invoices.some((invoice) => invoice.id === nextInvoice.id)
          ? current
          : { ...current, invoices: [nextInvoice, ...current.invoices] }
      );
      setSelectedInvoiceId(nextInvoice.id);
      setDraft(nextInvoice);
      setActiveClientId(nextInvoice.clientId);
    }
  }

  function updateDraft(patch: Partial<Invoice>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  return (
    <div className="workspace">
      <aside className="clientPanel panel">
        <div className="sectionHeader">
          <div className="panelTitle">Clients</div>
          <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus size={15} />
                Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add client</DialogTitle>
                <DialogDescription>
                  This creates a client folder and a first invoice from the preset.
                </DialogDescription>
              </DialogHeader>
              <ClientPresetForm value={clientDraft} onChange={setClientDraft} />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="button" onClick={addClient}>
                  Add client
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="clientList">
          {state.clients.map((client) => (
            <button
              className={client.id === activeClientId ? "clientFolder active" : "clientFolder"}
              key={client.id}
              onClick={() => selectClient(client)}
            >
              <span>{client.name || "Unnamed client"}</span>
              <span>{state.invoices.filter((invoice) => invoice.clientId === client.id).length}</span>
            </button>
          ))}
        </div>

        <div className="invoiceFolder">
          <div className="sectionHeader compact">
            <div className="panelTitle">Invoices</div>
            <Button size="icon" variant="outline" onClick={newInvoice} title="New invoice">
              <Plus size={15} />
            </Button>
          </div>
          {clientInvoices.map((invoice) => (
            <button
              className={invoice.id === selectedInvoiceId ? "invoiceRow active" : "invoiceRow"}
              key={invoice.id}
              onClick={() => selectInvoice(invoice)}
            >
              <span>
                <strong>{invoice.invoiceNumber}</strong>
                <small>{invoice.title || "Untitled"}</small>
              </span>
              <span>
                <strong>{currency(invoice.amount)}</strong>
                <small>{invoice.status}</small>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className="previewPanel panel">
        <div className="sectionHeader">
          <div className="panelTitle">
            <FileText size={18} />
            PDF preview
          </div>
          <PdfDownloadButton invoice={draft} client={activeClient} vendor={selectedVendor} />
        </div>
        <InvoicePreview invoice={draft} client={activeClient} vendor={selectedVendor} />
      </section>

      <section className="editorPanel panel">
        <div className="sectionHeader">
          <div>
            <div className="panelTitle">Invoice form</div>
            <p className="smallText">ID is generated automatically.</p>
          </div>
          <div className="actions">
            <Button size="sm" variant="outline" onClick={saveInvoice}>
              <Save size={15} />
              Save
            </Button>
            <Button size="icon" variant="danger" onClick={deleteInvoice} title="Delete invoice">
              <Trash2 size={15} />
            </Button>
          </div>
        </div>

        <div className="simpleForm">
          <div className="readonlyLine">
            <span>Invoice ID</span>
            <strong>{draft.invoiceNumber}</strong>
          </div>
          <div className="readonlyLine">
            <span>Client</span>
            <strong>{activeClient?.name}</strong>
          </div>
          <Label>
            Date
            <Input type="date" value={draft.date} onChange={(event) => updateDraft({ date: event.target.value })} />
          </Label>
          <Label>
            Terms
            <Input value={draft.terms} onChange={(event) => updateDraft({ terms: event.target.value })} />
          </Label>
          <Label>
            Title
            <Input value={draft.title} onChange={(event) => updateDraft({ title: event.target.value })} />
          </Label>
          <Label>
            Amount
            <Input value={draft.amount} onChange={(event) => updateDraft({ amount: event.target.value })} />
          </Label>
          <Label>
            Status
            <select
              className="uiSelect"
              value={draft.status}
              onChange={(event) => updateDraft({ status: event.target.value as Invoice["status"] })}
            >
              <option>Draft</option>
              <option>Sent</option>
              <option>Paid</option>
            </select>
          </Label>
          <Label>
            Description
            <Textarea
              value={draft.description}
              onChange={(event) => updateDraft({ description: event.target.value })}
            />
          </Label>
          <Label>
            Notes
            <Textarea value={draft.notes} onChange={(event) => updateDraft({ notes: event.target.value })} />
          </Label>
        </div>

        <div className="historyBlock">
          <div className="panelTitle">History</div>
          {draft.history.map((event) => (
            <div className="historyItem" key={event.id}>
              <strong>{event.message}</strong>
              <span>{new Date(event.at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PdfDownloadButton({
  invoice,
  client,
  vendor
}: {
  invoice: Invoice;
  client?: ClientPreset;
  vendor?: VendorPreset;
}) {
  const [downloadFile, setDownloadFile] = useState<{ url: string; fileName: string }>();

  useEffect(() => {
    let active = true;
    let currentUrl = "";

    setDownloadFile(undefined);
    createInvoicePdfFile({ invoice, client, vendor }).then(({ blob, fileName }) => {
      if (!active) return;
      currentUrl = URL.createObjectURL(blob);
      setDownloadFile({ url: currentUrl, fileName });
    });

    return () => {
      active = false;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [invoice, client, vendor]);

  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (downloadFile) return;
    event.preventDefault();
    await downloadInvoicePdf({ invoice, client, vendor });
  }

  return (
    <a
      className="uiButton uiButtonOutline uiButtonSmall"
      download={downloadFile?.fileName}
      href={downloadFile?.url ?? "#"}
      onClick={handleClick}
    >
      <Download size={15} />
      PDF
    </a>
  );
}

function ClientPresetForm({
  value,
  onChange
}: {
  value: ClientPreset;
  onChange: (client: ClientPreset) => void;
}) {
  const update = (patch: Partial<ClientPreset>) => onChange({ ...value, ...patch });

  return (
    <div className="dialogGrid">
      <Label>
        Client name
        <Input value={value.name} onChange={(event) => update({ name: event.target.value })} />
      </Label>
      <Label>
        Email
        <Input value={value.email} onChange={(event) => update({ email: event.target.value })} />
      </Label>
      <Label className="spanTwo">
        Address
        <Input value={value.address} onChange={(event) => update({ address: event.target.value })} />
      </Label>
      <Label>
        Identification number
        <Input
          value={value.identificationNumber}
          onChange={(event) => update({ identificationNumber: event.target.value })}
        />
      </Label>
      <Label>
        Tax identification
        <Input
          value={value.taxIdentificationNumber}
          onChange={(event) => update({ taxIdentificationNumber: event.target.value })}
        />
      </Label>
      <Label>
        Bank
        <Input value={value.bank} onChange={(event) => update({ bank: event.target.value })} />
      </Label>
      <Label>
        Account
        <Input value={value.account} onChange={(event) => update({ account: event.target.value })} />
      </Label>
      <Label>
        Routing
        <Input value={value.routing} onChange={(event) => update({ routing: event.target.value })} />
      </Label>
      <Label>
        Default amount
        <Input value={value.defaultAmount} onChange={(event) => update({ defaultAmount: event.target.value })} />
      </Label>
      <Label>
        Default title
        <Input value={value.defaultTitle} onChange={(event) => update({ defaultTitle: event.target.value })} />
      </Label>
      <Label>
        Default terms
        <Input value={value.defaultTerms} onChange={(event) => update({ defaultTerms: event.target.value })} />
      </Label>
      <Label className="spanTwo">
        Default description
        <Textarea
          value={value.defaultDescription}
          onChange={(event) => update({ defaultDescription: event.target.value })}
        />
      </Label>
    </div>
  );
}

function InvoicePreview({
  invoice,
  client,
  vendor
}: {
  invoice: Invoice;
  client?: ClientPreset;
  vendor?: VendorPreset;
}) {
  return (
    <div className="invoicePreview">
      <div className="previewHeader">
        <div className="previewSender">
          <strong>{vendor?.name}</strong>
          <span>{vendor?.email}</span>
          {splitAddress(vendor?.address).map((line) => (
            <span key={line}>{line}</span>
          ))}
          <span>{vendor?.phone}</span>
        </div>
        <div className="previewMeta">
          <h2>INVOICE</h2>
          <dl>
            <div>
              <dt>Invoice #</dt>
              <dd>{invoice.invoiceNumber}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{formatDate(invoice.date)}</dd>
            </div>
            <div>
              <dt>Payment Terms</dt>
              <dd>{invoice.terms}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="previewInfoGrid">
        <section className="previewSection">
          <h3>Bill To</h3>
          <strong>{client?.name}</strong>
          {splitAddress(client?.address).map((line) => (
            <span key={line}>{line}</span>
          ))}
          <span>{client?.email}</span>
          <PreviewDetail label="Identification Number" value={client?.identificationNumber} />
          <PreviewDetail label="Tax Identification Number" value={client?.taxIdentificationNumber} />
          <PreviewDetail label="Bank" value={client?.bank} />
          <PreviewDetail label="Account" value={client?.account} />
          <PreviewDetail label="Routing" value={client?.routing} />
        </section>
        <section className="previewSection">
          <h3>Payment Details</h3>
          <PreviewDetail label="Bank" value={vendor?.bank} />
          <PreviewDetail label="Account Number" value={vendor?.account} />
          <PreviewDetail label="Routing Number" value={vendor?.routing} />
          <PreviewDetail label="Wire Transfers" value={vendor?.wire} />
          <PreviewDetail label="Terms" value={invoice.terms} />
        </section>
      </div>

      <table className="previewTable">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{invoice.title}</td>
            <td>{invoice.description}</td>
            <td>{currency(invoice.amount)}</td>
          </tr>
        </tbody>
      </table>

      <div className="previewTotal">
        <span>Total Balance</span>
        <strong>{currency(invoice.amount)}</strong>
      </div>
      <div className="previewNotes">
        <strong>Notes</strong>
        <span>{invoice.notes || " "}</span>
      </div>
    </div>
  );
}

function PreviewDetail({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div className="previewDetail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function currency(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "$0.00";
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDate(value: string) {
  if (!value) return "";
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

function splitAddress(address?: string) {
  return (address || "")
    .split(",")
    .map((line) => line.trim())
    .filter(Boolean);
}
