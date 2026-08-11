import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, PageBody, Card, SectionLabel, Badge, EmptyState } from "@/components/ui-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Users, Loader2, Plus, BookOpen, FileText, Sparkles, Flag } from "lucide-react";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      if (u?.role === "admin") return base44.entities.User.list();
      return [];
    }).then(setUsers).catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  const invite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      setInviteEmail("");
      const list = await base44.entities.User.list();
      setUsers(list);
    } catch (e) { console.error(e); }
    setInviting(false);
  };

  const isAdmin = user?.role === "admin";

  const placeholders = [
    { icon: BookOpen, label: "Interview question library" },
    { icon: Sparkles, label: "Career archetypes" },
    { icon: FileText, label: "Resume templates" },
    { icon: FileText, label: "AI prompt templates" },
    { icon: Flag, label: "Feature flags" },
    { icon: Shield, label: "Reported content" },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader eyebrow="System" title="Admin" description="Manage users, content libraries, and system configuration." />
      <PageBody className="space-y-6">
        {!isAdmin ? (
          <Card className="p-10">
            <EmptyState icon={Shield} title="Admin access required" description="This area is restricted to workspace administrators. Contact your admin if you need access." />
          </Card>
        ) : (
          <>
            {/* Users */}
            <Card className="p-6">
              <h3 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2"><Users className="h-4 w-4 text-accent" /> Users</h3>
              {loading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="space-y-2">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                      <div>
                        <div className="text-sm font-medium">{u.full_name || u.email}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                      <Badge variant={u.role === "admin" ? "accent" : "muted"}>{u.role}</Badge>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-5 pt-5 border-t border-border/60">
                <SectionLabel className="mb-3">Invite user</SectionLabel>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="mb-1.5 block">Email</Label>
                    <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="name@example.com" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Role</Label>
                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm h-[38px]">
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <Button onClick={invite} disabled={inviting} className="rounded-full">
                    {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Management placeholders */}
            <Card className="p-6">
              <h3 className="font-heading text-lg font-semibold mb-1">Content & System</h3>
              <p className="text-sm text-muted-foreground mb-5">These areas are architected for future expansion.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {placeholders.map((p) => {
                  const Icon = p.icon;
                  return (
                    <div key={p.label} className="rounded-lg border border-border/60 p-4 flex items-center gap-3 opacity-70">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{p.label}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </PageBody>
    </div>
  );
}