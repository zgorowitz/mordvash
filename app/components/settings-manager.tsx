"use client";

import { Plus, Settings2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  AppState,
  VendorPreset,
  blankVendorPreset,
  safeState,
  seedState,
  storageKey
} from "../lib/invoice-store";
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

export function SettingsManager() {
  const [state, setState] = useState<AppState>(seedState);
  const [ready, setReady] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<VendorPreset>(seedState.vendors[0]);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      setState(safeState(JSON.parse(saved)));
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [ready, state]);

  function openVendor(vendor: VendorPreset) {
    setDraft(vendor);
    setDialogOpen(true);
  }

  function openNewVendor() {
    setDraft(blankVendorPreset());
    setDialogOpen(true);
  }

  function saveVendor() {
    const exists = state.vendors.some((vendor) => vendor.id === draft.id);
    setState((current) => ({
      ...current,
      vendors: exists
        ? current.vendors.map((vendor) => (vendor.id === draft.id ? draft : vendor))
        : [draft, ...current.vendors]
    }));
    setDialogOpen(false);
  }

  function deleteVendor(id: string) {
    setState((current) => {
      const nextVendors = current.vendors.filter((vendor) => vendor.id !== id);
      return {
        ...current,
        vendors: nextVendors.length ? nextVendors : [blankVendorPreset()]
      };
    });
  }

  return (
    <section className="settingsShell panel">
      <div className="sectionHeader">
        <div>
          <div className="panelTitle">
            <Settings2 size={18} />
            Vendor presets
          </div>
          <p className="smallText">Edit the company and payment details used on invoice previews.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={openNewVendor}>
              <Plus size={15} />
              Vendor preset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vendor preset</DialogTitle>
              <DialogDescription>These details are used as the sender and payment information.</DialogDescription>
            </DialogHeader>
            <VendorPresetForm value={draft} onChange={setDraft} />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={saveVendor}>Save preset</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="settingsList">
        {state.vendors.map((vendor) => (
          <div className="settingsRow" key={vendor.id}>
            <button className="settingsRowMain" onClick={() => openVendor(vendor)}>
              <strong>{vendor.name || "Unnamed vendor"}</strong>
              <span>{vendor.email || "No email"}</span>
              <span>{vendor.address || "No address"}</span>
              <span>
                Account {vendor.account || "-"} · Routing {vendor.routing || "-"}
              </span>
            </button>
            <Button size="icon" variant="ghost" onClick={() => deleteVendor(vendor.id)} title="Delete vendor">
              <Trash2 size={15} />
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

function VendorPresetForm({
  value,
  onChange
}: {
  value: VendorPreset;
  onChange: (vendor: VendorPreset) => void;
}) {
  const update = (patch: Partial<VendorPreset>) => onChange({ ...value, ...patch });

  return (
    <div className="dialogGrid">
      <Label>
        Vendor name
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
        Phone
        <Input value={value.phone} onChange={(event) => update({ phone: event.target.value })} />
      </Label>
      <Label>
        Terms
        <Input value={value.terms} onChange={(event) => update({ terms: event.target.value })} />
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
        Wire
        <Input value={value.wire} onChange={(event) => update({ wire: event.target.value })} />
      </Label>
    </div>
  );
}
