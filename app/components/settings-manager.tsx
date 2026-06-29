"use client";

import { Database, Plus, Settings2, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import {
  Invitation,
  VendorPreset,
  blankInvitation,
  blankVendorPreset,
  normalizeEmail,
  seedState,
} from "../lib/invoice-store";
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

export function SettingsManager() {
  const { state, setState, storageStatus } = useAppData();
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [invitationDialogOpen, setInvitationDialogOpen] = useState(false);
  const [draft, setDraft] = useState<VendorPreset>(seedState.vendors[0]);
  const [invitationDraft, setInvitationDraft] = useState<Invitation>(blankInvitation());

  function openVendor(vendor: VendorPreset) {
    setDraft(vendor);
    setVendorDialogOpen(true);
  }

  function openNewVendor() {
    setDraft(blankVendorPreset());
    setVendorDialogOpen(true);
  }

  function saveVendor() {
    const exists = state.vendors.some((vendor) => vendor.id === draft.id);
    setState((current) => ({
      ...current,
      vendors: exists
        ? current.vendors.map((vendor) => (vendor.id === draft.id ? draft : vendor))
        : [draft, ...current.vendors]
    }));
    setVendorDialogOpen(false);
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

  function openNewInvitation() {
    setInvitationDraft(blankInvitation());
    setInvitationDialogOpen(true);
  }

  function saveInvitation() {
    const email = normalizeEmail(invitationDraft.email);
    if (!email) return;

    const invitation = {
      ...invitationDraft,
      email
    };

    setState((current) => {
      const existing = current.invitations.some((item) => normalizeEmail(item.email) === email);
      return {
        ...current,
        invitations: existing
          ? current.invitations.map((item) => (normalizeEmail(item.email) === email ? invitation : item))
          : [invitation, ...current.invitations]
      };
    });
    setInvitationDialogOpen(false);
  }

  function deleteInvitation(id: string) {
    setState((current) => ({
      ...current,
      invitations: current.invitations.filter((invitation) => invitation.id !== id || invitation.role === "Owner")
    }));
  }

  return (
    <section className="settingsShell panel">
      <div className="settingsBlock">
        <div className="sectionHeader">
          <div>
            <div className="panelTitle">
              <Settings2 size={18} />
              Vendor presets
            </div>
            <p className="smallText">Company and payment details used on invoice previews.</p>
          </div>
          <Dialog open={vendorDialogOpen} onOpenChange={setVendorDialogOpen}>
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
      </div>

      <div className="settingsBlock">
        <div className="sectionHeader">
          <div>
            <div className="panelTitle">
              <ShieldCheck size={18} />
              Invitations
            </div>
            <p className="smallText">Only listed emails can open the invoice workspace after sign-in.</p>
          </div>
          <Dialog open={invitationDialogOpen} onOpenChange={setInvitationDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={openNewInvitation}>
                <UserPlus size={15} />
                Invite email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite email</DialogTitle>
                <DialogDescription>Add an email address allowed to use the workspace.</DialogDescription>
              </DialogHeader>
              <InvitationForm value={invitationDraft} onChange={setInvitationDraft} />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={saveInvitation}>Save invitation</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="settingsList">
          {state.invitations.map((invitation) => (
            <div className="settingsRow" key={invitation.id}>
              <div className="settingsRowMain">
                <strong>{invitation.email}</strong>
                <span>
                  {invitation.role} · Added {formatDate(invitation.createdAt)}
                </span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => deleteInvitation(invitation.id)}
                title={invitation.role === "Owner" ? "Owner invitation stays in the repo seed" : "Delete invitation"}
                disabled={invitation.role === "Owner"}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="settingsBlock">
        <div className="panelTitle">
          <Database size={18} />
          Storage
        </div>
        <div className="storageLine">
          <strong>{storageStatus.label}</strong>
          <span>{storageStatus.persisted ? "Persistent" : "Browser fallback"}</span>
        </div>
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

function InvitationForm({
  value,
  onChange
}: {
  value: Invitation;
  onChange: (invitation: Invitation) => void;
}) {
  const update = (patch: Partial<Invitation>) => onChange({ ...value, ...patch });

  return (
    <div className="dialogGrid">
      <Label className="spanTwo">
        Email
        <Input
          type="email"
          value={value.email}
          onChange={(event) => update({ email: event.target.value })}
        />
      </Label>
      <Label>
        Role
        <select
          className="uiSelect"
          value={value.role}
          onChange={(event) => update({ role: event.target.value as Invitation["role"] })}
        >
          <option>Member</option>
          <option>Owner</option>
        </select>
      </Label>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}
