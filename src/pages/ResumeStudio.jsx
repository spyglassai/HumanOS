import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import ResumeEditor from "@/components/ResumeEditor";
import { PageHeader, PageBody, Card, Badge, EmptyState } from "@/components/ui-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, FileText, ShieldCheck, ArrowLeft, History, Download } from "lucide-react";

export default function ResumeStudio() {
  const [resumes, setResumes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", type: "Targeted", archetype: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const data = await base44.entities.Resume.list("-created_date");
    setResumes(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    const created = await base44.entities.Resume.create({
      title: form.title || "Untitled Resume",
      type: form.type,
      archetype: form.archetype,
      version: "V1",
      status: "Draft",
    });
    setCreateOpen(false);
    setForm({ title: "", type: "Targeted", archetype: "" });
    await load();
    setSelected(created.id);
  };

  const toggleRC = async (r) => {
    await base44.entities.Resume.update(r.id, { release_candidate: !r.release_candidate });
    await load();
  };

  const exportResume = () => {
    window.print();
  };

  const current = resumes.find((r) => r.id === selected);

  if (current) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          eyebrow="Resume Studio"
          title={current.title}
          description={current.type === "ATS" ? "ATS-optimized version — clean structure for applicant tracking systems." : current.type === "Targeted" ? "Targeted to a specific role or archetype." : "Master source document."}
          actions={
            <>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}><ArrowLeft className="h-4 w-4 mr-1.5" /> Library</Button>
              <Button variant="outline" size="sm" onClick={exportResume}><Download className="h-4 w-4 mr-1.5" /> Export</Button>
              <Button variant={current.release_candidate ? "default" : "outline"} size="sm" onClick={() => toggleRC(current)}>
                <ShieldCheck className="h-4 w-4 mr-1.5" /> {current.release_candidate ? "RC on" : "Release candidate"}
              </Button>
            </>
          }
        />
        <PageBody>
          <div className="flex items-center gap-2 mb-5 text-sm">
            <Badge variant="muted">{current.type}</Badge>
            <Badge variant="muted">{current.version}</Badge>
            {current.archetype && <Badge variant="accent">{current.archetype}</Badge>}
            {current.release_candidate && <Badge variant="accent"><ShieldCheck className="h-3 w-3" /> RC</Badge>}
          </div>
          <ResumeEditor resume={current} />
        </PageBody>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Outputs"
        title="Resume Studio"
        description="Your resume library. Build targeted and ATS versions from your career evidence — with section locking, version control, and release candidate mode."
        actions={<Button onClick={() => setCreateOpen(true)} className="rounded-full"><Plus className="h-4 w-4 mr-2" /> Create resume</Button>}
      />
      <PageBody>
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-secondary border-t-accent rounded-full animate-spin" /></div>
        ) : resumes.length === 0 ? (
          <Card className="p-10"><EmptyState icon={FileText} title="No resumes yet" description="Create a targeted resume for a specific role, or start from the Master Resume in its dedicated workspace." action={<Button onClick={() => setCreateOpen(true)} className="rounded-full"><Plus className="h-4 w-4 mr-2" /> Create resume</Button>} /></Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((r) => (
              <Card key={r.id} className="p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(r.id)}>
                <div className="flex items-start justify-between">
                  <FileText className="h-5 w-5 text-accent" />
                  {r.release_candidate && <Badge variant="accent"><ShieldCheck className="h-3 w-3" /> RC</Badge>}
                </div>
                <h3 className="font-heading text-lg font-semibold mt-3">{r.title}</h3>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="muted">{r.type}</Badge>
                  <Badge variant="muted">{r.version}</Badge>
                  {r.archetype && <Badge variant="accent">{r.archetype}</Badge>}
                </div>
                {r.change_log?.length > 0 && (
                  <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5"><History className="h-3 w-3" /> {r.change_log.length} changes logged</div>
                )}
              </Card>
            ))}
          </div>
        )}
      </PageBody>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create resume</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="mb-1.5 block">Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Technology Strategy — U.S. Bank" />
            </div>
            <div>
              <Label className="mb-1.5 block">Type</Label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="Targeted">Targeted</option>
                <option value="ATS">ATS</option>
                <option value="Master">Master</option>
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block">Archetype / narrative</Label>
              <Input value={form.archetype} onChange={(e) => setForm({ ...form, archetype: e.target.value })} placeholder="e.g. Enterprise Technology Strategy" />
              <p className="text-xs text-muted-foreground mt-1.5">Selecting an existing flagship archetype avoids rebuilding resumes unnecessarily.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={create}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}