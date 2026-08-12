import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { buildRoleFitPrompt } from "../../base44/shared/careerAI";
import { PageHeader, PageBody, Card, Badge, EmptyState, ConfidenceBar, SectionLabel } from "@/components/ui-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Target, Loader2, AlertTriangle, Check, Sparkles } from "lucide-react";

const STATUSES = ["Discovered", "Evaluating", "Apply", "Applied", "Recruiter Contact", "Interview", "Final Interview", "Offer", "Declined", "Closed"];

export default function Opportunities() {
  const [opps, setOpps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ company: "", role: "", job_description: "" });
  const [detail, setDetail] = useState(null);
  const [analyzing, setAnalyzing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setOpps(await base44.entities.JobOpportunity.list("-created_date")); } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    await base44.entities.JobOpportunity.create({ ...form, status: "Discovered" });
    setForm({ company: "", role: "", job_description: "" });
    setCreateOpen(false);
    await load();
  };

  const move = async (id, status) => {
    await base44.entities.JobOpportunity.update(id, { status });
    await load();
  };

  const runFit = async (opp) => {
    setAnalyzing(opp.id);
    try {
      const [employment, accomplishments, skills, identities] = await Promise.all([
        base44.entities.EmploymentRecord.list(),
        base44.entities.Accomplishment.list(),
        base44.entities.Skill.list(),
        base44.entities.ProfessionalIdentity.list(),
      ]);
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildRoleFitPrompt({ opportunity: opp, employment, accomplishments, skills, identities }),
        response_json_schema: {
          type: "object",
          properties: {
            role_actually_is: { type: "string" },
            core_capabilities: { type: "array", items: { type: "string" } },
            important_themes: { type: "array", items: { type: "string" } },
            career_alignment: { type: "number" }, skills_alignment: { type: "number" },
            leadership_alignment: { type: "number" }, domain_alignment: { type: "number" },
            strategic_alignment: { type: "number" }, overall_fit: { type: "number" },
            real_gaps: { type: "array", items: { type: "string" } },
            presentation_gaps: { type: "array", items: { type: "string" } },
            potential_concerns: { type: "array", items: { type: "string" } },
            strongest_evidence: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
          },
        },
      });
      const updated = await base44.entities.JobOpportunity.update(opp.id, {
        fit_score: res.overall_fit,
        career_alignment: res.career_alignment, skills_alignment: res.skills_alignment,
        leadership_alignment: res.leadership_alignment, domain_alignment: res.domain_alignment,
        strategic_alignment: res.strategic_alignment,
        real_gaps: res.real_gaps || [], presentation_gaps: res.presentation_gaps || [],
        potential_concerns: res.potential_concerns || [], strongest_evidence: res.strongest_evidence || [],
      });
      setDetail(updated);
      await load();
    } catch (e) { console.error(e); }
    setAnalyzing(null);
  };

  const columns = STATUSES.map((status) => ({ status, items: opps.filter((o) => o.status === status) }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Job Search"
        title="Opportunities"
        description="A pipeline for the roles you're considering. Add a job description and run Role Fit to see how your career evidence aligns — and where the real gaps versus presentation gaps are."
        actions={<Button onClick={() => setCreateOpen(true)} className="rounded-full"><Plus className="h-4 w-4 mr-2" /> Add opportunity</Button>}
      />
      <PageBody className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : opps.length === 0 ? (
          <Card className="p-10"><EmptyState icon={Target} title="No opportunities yet" description="Paste a job description to evaluate role fit against your career evidence." action={<Button onClick={() => setCreateOpen(true)} className="rounded-full"><Plus className="h-4 w-4 mr-2" /> Add opportunity</Button>} /></Card>
        ) : (
          <div className="flex gap-4 min-w-max pb-4">
            {columns.map((col) => (
              <div key={col.status} className="w-64 shrink-0">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{col.status}</span>
                  <span className="text-xs text-muted-foreground">{col.items.length}</span>
                </div>
                <div className="space-y-2.5">
                  {col.items.map((o) => (
                    <Card key={o.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDetail(o)}>
                      <div className="font-medium text-sm">{o.company}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{o.role}</div>
                      {o.fit_score > 0 && (
                        <div className="mt-2.5 flex items-center justify-between">
                          <Badge variant="accent">{o.fit_score}% fit</Badge>
                          <select
                            value={o.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => move(o.id, e.target.value)}
                            className="text-[10px] rounded border border-border bg-background px-1 py-0.5"
                          >
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </PageBody>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add opportunity</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="mb-1.5 block">Company</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1.5 block">Role</Label>
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1.5 block">Job description</Label>
              <Textarea value={form.job_description} onChange={(e) => setForm({ ...form, job_description: e.target.value })} rows={6} placeholder="Paste the full job description…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={create}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between pr-8">
                  <span>{detail.company} — {detail.role}</span>
                  <Button variant="outline" size="sm" onClick={() => runFit(detail)} disabled={analyzing === detail.id} className="rounded-full">
                    {analyzing === detail.id ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                    {analyzing === detail.id ? "Analyzing…" : "Run role fit"}
                  </Button>
                </DialogTitle>
              </DialogHeader>
              {detail.fit_score > 0 ? (
                <div className="space-y-5 py-2">
                  <div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="font-heading text-4xl font-semibold text-accent">{detail.fit_score}%</span>
                      <span className="text-sm text-muted-foreground">overall fit</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      <ConfidenceBar value={detail.career_alignment} label="Career" />
                      <ConfidenceBar value={detail.skills_alignment} label="Skills" />
                      <ConfidenceBar value={detail.leadership_alignment} label="Leadership" />
                      <ConfidenceBar value={detail.domain_alignment} label="Domain" />
                      <ConfidenceBar value={detail.strategic_alignment} label="Strategic" />
                    </div>
                  </div>
                  {detail.real_gaps?.length > 0 && (
                    <div>
                      <SectionLabel className="mb-2 flex items-center gap-1.5"><AlertTriangle className="h-3 w-3 text-amber-600" /> Real gaps</SectionLabel>
                      <ul className="space-y-1.5">{detail.real_gaps.map((g, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-amber-600">·</span>{g}</li>)}</ul>
                    </div>
                  )}
                  {detail.presentation_gaps?.length > 0 && (
                    <div>
                      <SectionLabel className="mb-2 flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-accent" /> Presentation gaps</SectionLabel>
                      <ul className="space-y-1.5">{detail.presentation_gaps.map((g, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-accent">·</span>{g}</li>)}</ul>
                    </div>
                  )}
                  {detail.strongest_evidence?.length > 0 && (
                    <div>
                      <SectionLabel className="mb-2 flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-600" /> Strongest evidence</SectionLabel>
                      <div className="flex flex-wrap gap-1.5">{detail.strongest_evidence.map((e, i) => <Badge key={i} variant="muted">{e}</Badge>)}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6">
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Run role fit to analyze this job description against your career evidence. The system distinguishes real gaps (genuine missing experience) from presentation gaps (experience you have that isn't surfaced yet).
                  </p>
                  {detail.job_description && (
                    <div className="rounded-lg bg-secondary/50 p-3 max-h-48 overflow-y-auto">
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{detail.job_description.slice(0, 600)}…</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}