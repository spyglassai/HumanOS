import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { buildResumeDraftPrompt } from "../../base44/shared/careerAI";
import { Card, SectionLabel, Badge, ConfidenceBar } from "@/components/ui-primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Lock, Unlock, PenLine, Loader2, Sparkles, ShieldCheck, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTION_TYPES = [
  "Executive Summary", "Career Accomplishments", "Professional Experience", "Major Projects",
  "Leadership Experience", "Early Career", "Education", "Certifications",
  "Professional Development", "Skills", "Technologies", "Professional Philosophy", "Custom"
];

export default function ResumeEditor({ resume, onDirty }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    base44.entities.CareerProfile.list().then((p) => setProfile(p[0])).catch(() => {});
  }, []);

  const load = async () => {
    if (!resume) return;
    setLoading(true);
    let secs = await base44.entities.ResumeSection.filter({ resume_id: resume.id }, "order");
    if (secs.length === 0 && resume.type === "Master") {
      secs = await seedMasterSections(resume.id);
    }
    setSections(secs);
    setLoading(false);
  };

  useEffect(() => { load(); }, [resume?.id]);

  const seedMasterSections = async (resumeId) => {
    const defaults = SECTION_TYPES.slice(0, 12).map((type, i) => ({
      resume_id: resumeId, title: type, type: type === "Custom" ? "Professional Experience" : type,
      content: "", lock_state: "Open", order: i,
    }));
    const created = await base44.entities.ResumeSection.bulkCreate(defaults);
    return base44.entities.ResumeSection.filter({ resume_id: resumeId }, "order");
  };

  const updateSection = async (id, data) => {
    await base44.entities.ResumeSection.update(id, data);
    setSections((secs) => secs.map((s) => (s.id === id ? { ...s, ...data } : s)));
    onDirty?.();
  };

  const cycleLock = async (section) => {
    const next = section.lock_state === "Open" ? "Locked" : section.lock_state === "Locked" ? "Surgical Edit Only" : "Open";
    await updateSection(section.id, { lock_state: next });
  };

  const draft = async (section) => {
    if (resume?.release_candidate) return;
    setDrafting(section.id);
    try {
      const [employment, accomplishments, stories, skills] = await Promise.all([
        base44.entities.EmploymentRecord.list(),
        base44.entities.Accomplishment.list(),
        base44.entities.CareerStory.list(),
        base44.entities.Skill.list(),
      ]);
      let material = "";
      if (section.type === "Executive Summary") {
        material = `Roles: ${employment.map((e) => `${e.title} at ${e.company}`).join("; ")}\nAccomplishments: ${accomplishments.map((a) => a.title).join("; ")}`;
      } else if (section.type === "Career Accomplishments") {
        material = accomplishments.map((a) => `${a.title} (${a.company}): ${a.outcome || a.action || ""}`).join("\n");
      } else if (section.type === "Professional Experience") {
        material = employment.map((e) => `${e.title} — ${e.company} (${e.start_date}–${e.end_date || "present"})\n${e.summary || ""}\nAchievements: ${(e.achievements || []).join("; ")}`).join("\n\n");
      } else if (section.type === "Skills" || section.type === "Technologies") {
        material = skills.map((s) => s.name).join(", ");
      } else {
        material = `Employment: ${employment.map((e) => `${e.title} at ${e.company}`).join("; ")}\nAccomplishments: ${accomplishments.map((a) => a.title).join("; ")}\nStories: ${stories.map((s) => s.title).join("; ")}`;
      }

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildResumeDraftPrompt({
          sectionType: section.type, sectionTitle: section.title,
          sourceMaterial: material, voiceCharacteristics: profile?.voice_characteristics,
          lockConstraints: section.lock_state === "Surgical Edit Only" ? section.edit_objectives : null,
        }),
        response_json_schema: { type: "object", properties: { content: { type: "string" } } },
      });
      await updateSection(section.id, { content: res.content });
    } catch (e) { console.error(e); }
    setDrafting(null);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {resume?.release_candidate && (
        <Card className="p-4 bg-accent/5 border-accent/30 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-accent shrink-0" />
          <div>
            <div className="text-sm font-medium text-accent">Release Candidate mode is on</div>
            <div className="text-xs text-muted-foreground">AI will not edit unless a change creates measurable improvement. The burden of proof is on the edit.</div>
          </div>
        </Card>
      )}
      {sections.map((s) => (
        <Card key={s.id} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-semibold">{s.title}</h3>
              <LockBadge state={s.lock_state} />
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => cycleLock(s)}>
                {s.lock_state === "Open" ? <><Lock className="h-3.5 w-3.5 mr-1" /> Lock</> : <><Unlock className="h-3.5 w-3.5 mr-1" /> Unlock</>}
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs" disabled={s.lock_state === "Locked" || resume?.release_candidate || drafting === s.id} onClick={() => draft(s)}>
                {drafting === s.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                {s.lock_state === "Surgical Edit Only" ? "Surgical edit" : "Draft"}
              </Button>
            </div>
          </div>
          {s.lock_state === "Surgical Edit Only" && (
            <div className="mb-3">
              <SectionLabel className="mb-1.5">Edit objectives (what AI may touch)</SectionLabel>
              <Textarea
                defaultValue={s.edit_objectives || ""}
                onBlur={(e) => updateSection(s.id, { edit_objectives: e.target.value })}
                placeholder="e.g. ONLY MODIFY the AT&T role. Do not modify Summary, highlights, or other roles."
                className="text-xs"
                rows={2}
              />
            </div>
          )}
          <Textarea
            value={s.content || ""}
            onChange={(e) => setSections((secs) => secs.map((x) => (x.id === s.id ? { ...x, content: e.target.value } : x)))}
            onBlur={(e) => updateSection(s.id, { content: e.target.value })}
            disabled={s.lock_state === "Locked"}
            placeholder={s.lock_state === "Locked" ? "This section is locked. Unlock to edit." : "Empty — draft with AI or write directly."}
            className={cn("min-h-[120px] editorial-prose", s.lock_state === "Locked" && "bg-muted/40")}
          />
        </Card>
      ))}
    </div>
  );
}

function LockBadge({ state }) {
  if (state === "Locked") return <Badge variant="locked"><Lock className="h-3 w-3" /> Locked</Badge>;
  if (state === "Surgical Edit Only") return <Badge variant="accent"><PenLine className="h-3 w-3" /> Surgical only</Badge>;
  return <Badge variant="muted"><Unlock className="h-3 w-3" /> Open</Badge>;
}