import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import ResumeEditor from "@/components/ResumeEditor";
import { PageHeader, PageBody, Card, Badge } from "@/components/ui-primitives";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldOff, FileText, Info } from "lucide-react";

export default function MasterResume() {
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let masters = await base44.entities.Resume.filter({ type: "Master" });
    if (masters.length === 0) {
      masters = [await base44.entities.Resume.create({ title: "Master Resume", type: "Master", version: "V1", status: "Draft" })];
    }
    setResume(masters[0]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleRC = async () => {
    const updated = await base44.entities.Resume.update(resume.id, { release_candidate: !resume.release_candidate });
    setResume(updated);
  };

  if (loading) return <div className="flex justify-center py-24"><div className="w-6 h-6 border-2 border-secondary border-t-accent rounded-full animate-spin" /></div>;

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Source Document"
        title="Master Resume"
        description="The authoritative career source document — not intended for submission. Its job is to capture everything. First capture, then refine."
        actions={
          <Button onClick={toggleRC} variant={resume.release_candidate ? "default" : "outline"} className="rounded-full">
            {resume.release_candidate ? <><ShieldCheck className="h-4 w-4 mr-2" /> RC mode on</> : <><ShieldOff className="h-4 w-4 mr-2" /> Release candidate</>}
          </Button>
        }
      />
      <PageBody className="space-y-5">
        <Card className="p-5 flex items-start gap-3 bg-secondary/40">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Master Resume may be many pages long. It preserves your complete career — including early career that
            targeted resumes may compress. Never let it be prematurely compressed. Everything here feeds your targeted resumes, bios, and interviews.
          </p>
        </Card>
        <div className="flex items-center gap-3 text-sm">
          <Badge variant="muted"><FileText className="h-3 w-3" /> {resume.version}</Badge>
          <Badge variant={resume.status === "Final" ? "success" : "muted"}>{resume.status}</Badge>
          {resume.release_candidate && <Badge variant="accent"><ShieldCheck className="h-3 w-3" /> Release Candidate</Badge>}
        </div>
        <ResumeEditor resume={resume} />
      </PageBody>
    </div>
  );
}