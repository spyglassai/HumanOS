import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, PageBody, Card, SectionLabel, Badge, EmptyState } from "@/components/ui-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Globe, Loader2, Eye, EyeOff, Lock, Link2 } from "lucide-react";

const SECTION_DEFS = [
  { type: "snapshot", title: "Professional Snapshot" },
  { type: "bio", title: "Executive Bio" },
  { type: "timeline", title: "Career Timeline" },
  { type: "projects", title: "Major Projects" },
  { type: "philosophy", title: "Leadership Philosophy" },
  { type: "tech_philosophy", title: "Technology Philosophy" },
  { type: "ai_philosophy", title: "AI Philosophy" },
  { type: "certifications", title: "Certifications" },
  { type: "skills", title: "Skills with Evidence" },
  { type: "stories", title: "Public Career Stories" },
];

const STATUSES = ["Private", "Public", "Unlisted", "Share with Link"];

export default function PublicProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let profiles = await base44.entities.PublicProfile.list();
    if (profiles.length === 0) {
      profiles = [await base44.entities.PublicProfile.create({
        slug: "", tagline: "", snapshot: "", bio: "",
        sections: SECTION_DEFS.map((s, i) => ({ type: s.type, title: s.title, visible: false, order: i, summary: "" })),
        status: "Private",
      })];
    }
    setProfile(profiles[0]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (data) => {
    setSaving(true);
    const updated = await base44.entities.PublicProfile.update(profile.id, data);
    setProfile(updated);
    setSaving(false);
  };

  const toggleSection = (idx) => {
    const sections = profile.sections.map((s, i) => i === idx ? { ...s, visible: !s.visible } : s);
    save({ sections });
  };

  const updateSection = (idx, field, value) => {
    const sections = profile.sections.map((s, i) => i === idx ? { ...s, [field]: value } : s);
    setProfile({ ...profile, sections });
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Public Identity"
        title="Public Profile"
        description="Curate what the world sees. Nothing becomes public automatically — every section is private until you explicitly publish it. The evidence behind the resume."
      />
      <PageBody className="space-y-6">
        {/* Privacy banner */}
        <Card className="p-5 bg-secondary/40 flex items-start gap-3">
          <Lock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium">Private by default</div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">No career information becomes public without your action. Public AI can only ever answer using records you've explicitly made public.</p>
          </div>
        </Card>

        {/* Profile basics */}
        <Card className="p-6">
          <h3 className="font-heading text-lg font-semibold mb-4">Profile basics</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Public URL slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">humanos.app/</span>
                <Input value={profile.slug || ""} onChange={(e) => setProfile({ ...profile, slug: e.target.value })} onBlur={(e) => save({ slug: e.target.value })} placeholder="your-name" className="flex-1" />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Visibility</Label>
              <select value={profile.status} onChange={(e) => save({ status: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">Tagline</Label>
              <Input value={profile.tagline || ""} onChange={(e) => setProfile({ ...profile, tagline: e.target.value })} onBlur={(e) => save({ tagline: e.target.value })} placeholder="A single line that captures your professional identity" />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">Executive snapshot</Label>
              <Textarea value={profile.snapshot || ""} onChange={(e) => setProfile({ ...profile, snapshot: e.target.value })} onBlur={(e) => save({ snapshot: e.target.value })} rows={3} />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">Executive bio</Label>
              <Textarea value={profile.bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} onBlur={(e) => save({ bio: e.target.value })} rows={5} className="editorial-prose" />
            </div>
          </div>
        </Card>

        {/* Section visibility */}
        <Card className="p-6">
          <h3 className="font-heading text-lg font-semibold mb-1">Sections</h3>
          <p className="text-sm text-muted-foreground mb-5">Toggle visibility, set the public title and summary for each section.</p>
          <div className="space-y-3">
            {profile.sections?.map((s, i) => (
              <div key={i} className={`rounded-lg border p-4 ${s.visible ? "border-accent/30 bg-accent/5" : "border-border bg-secondary/30"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleSection(i)}>
                      {s.visible ? <Eye className="h-4 w-4 text-accent" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <span className="text-sm font-medium">{s.title}</span>
                    {s.visible ? <Badge variant="accent">Public</Badge> : <Badge variant="muted">Private</Badge>}
                  </div>
                </div>
                {s.visible && (
                  <div className="mt-3 pl-11 space-y-2">
                    <Input value={s.summary || ""} onChange={(e) => updateSection(i, "summary", e.target.value)} onBlur={() => save({ sections: profile.sections })} placeholder="Public summary for this section" className="text-sm" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full" onClick={() => window.open(`/portfolio?slug=${profile.slug}`, "_blank")}>
            <Globe className="h-4 w-4 mr-2" /> Preview public profile
          </Button>
          {saving && <span className="text-xs text-muted-foreground">Saving…</span>}
        </div>
      </PageBody>
    </div>
  );
}