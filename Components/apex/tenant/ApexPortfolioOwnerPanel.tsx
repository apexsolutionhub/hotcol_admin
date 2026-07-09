"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  apexCreateOwnerAccount,
  apexLinkOwnerProperty,
  fetchOwnerAccounts,
  type OwnerAccountRow,
} from "@/lib/apex/actions";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";

type Props = {
  tinNumber: string;
  hotelDisplayName: string;
};

export function ApexPortfolioOwnerPanel({ tinNumber, hotelDisplayName }: Props) {
  const [accounts, setAccounts] = useState<OwnerAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(hotelDisplayName);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchOwnerAccounts();
      setAccounts(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load owner accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const linkExisting = async () => {
    const id = Number(selectedId);
    if (!id) {
      toast.error("Select an owner account");
      return;
    }
    setBusy(true);
    try {
      await apexLinkOwnerProperty(id, tinNumber, hotelDisplayName);
      toast.success("Property linked to portfolio owner");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Link failed");
    } finally {
      setBusy(false);
    }
  };

  const createAndLink = async () => {
    if (!userName.trim() || password.length < 6) {
      toast.error("Username and password (6+ chars) are required");
      return;
    }
    setBusy(true);
    try {
      await apexCreateOwnerAccount({
        userName: userName.trim(),
        password,
        displayName: displayName.trim() || hotelDisplayName,
        phone: phone.trim() || null,
        email: email.trim() || null,
        linkTinNumber: tinNumber,
      });
      toast.success("Portfolio owner created and linked");
      setUserName("");
      setPassword("");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card id="portfolio-owner" className="scroll-mt-28">
      <CardHeader>
        <CardTitle>Portfolio owner (hotcol-owner app)</CardTitle>
        <CardDescription>
          Separate mobile-app login for business owners overseeing this property. This is
          not the same as the tenant Admin/Manager credential above.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Link existing portfolio owner</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={selectedId}
              onValueChange={setSelectedId}
              disabled={loading || accounts.length === 0}
            >
              <SelectTrigger className="sm:flex-1">
                <SelectValue placeholder={loading ? "Loading…" : "Select owner account"} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.userName}
                    {a.displayName ? ` — ${a.displayName}` : ""} ({a.propertyCount}{" "}
                    properties)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => void linkExisting()}
              disabled={busy || !selectedId}
            >
              Link to property
            </Button>
          </div>
        </div>

        <div className="border-t border-border/60 pt-6">
          <p className="mb-4 text-sm font-medium">Or create new portfolio owner</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="po-userName">Username</Label>
              <Input
                id="po-userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="po-password">Password</Label>
              <Input
                id="po-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="po-displayName">Display name</Label>
              <Input
                id="po-displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="po-phone">Phone (optional)</Label>
              <Input
                id="po-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="po-email">Email (optional)</Label>
              <Input
                id="po-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <Button
            className="mt-4"
            variant="apex"
            onClick={() => void createAndLink()}
            disabled={busy}
          >
            {busy ? "Creating…" : "Create & link owner"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
