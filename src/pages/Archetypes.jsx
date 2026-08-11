import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { runCareerAnalysis } from "@/lib/careerAnalysis";
import { PageHeader, PageBody, Card, SectionLabel, EmptyState, ConfidenceBar, Badge } from "@/components/ui-primitives";
import { Button } from "@/components/ui/button";
import { Layers, Loader2, Sparkles, Star, TrendingUp } from "lucide-react";

export default function Archetypes() {
  const [identities, setIdentities] = useState([]);
  const [archetypes, setArchetypes] = useState([]);
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ids, arch, th] = await Promise.all([
        base44.entities.ProfessionalIdentity.list(),
        base44.entities.CareerArchetype.list("-fit_score"),
        base44.entities.CareerTheme.list(),
      ]);
      setIdentities(ids);
      setArchetypes(arch);
      setThemes(th);
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const analyze = async () => {
    setAnalyzing(true);
    try { await runCareerAnalysis(); await load(); } catch (e) { console.error(e); }
    setAnalyzing(false);
  };

  const setPrimary = async (id) => {
    await base44.entities.ProfessionalIdentity.updateMany({ is_primary: true }, { $set: { is_primary: false } });
    await base44.entities.ProfessionalIdentity.update(id, { is_primary: true });
    await load();
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const hasData = identities.length > 0 || archetypes.length > 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Professional Identity"
        title="Career Archetypes"
        description="Evidence-backed professional identities and authentic career directions. One person can hold several authentic expressions — without inventing different personas."
        actions={
          <Button onClick={analyze} disabled={analyzing} className="rounded-full">
            {analyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {analyzing ? "Analyzing…" : "Analyze career"}
          </Button>
        }
      />
      <PageBody className="space-y-10">
        {!hasData ? (
          <Card className="p-10">
            <EmptyState icon={Layers} title="No identities or archetypes yet"
              description="After building career memory through Discovery, run analysis. The system proposes who you professionally are — based only on your evidence, never invented."
              action={<Button onClick={analyze} disabled={analyzing} className="rounded-full"><Sparkles className="h-4 w-4 mr-2" /> Analyze career</Button>} />
          </Card>
        ) : (
          <>
            {/* Professional Identities */}
            <section>
              <h2 className="font-heading text-2xl font-semibold mb-1">Professional Identities</h2>
              <p className="text-sm text-muted-foreground mb-5">Who the evidence says you professionally are — not who you wish you were.</p>
              <div className="grid lg:grid-cols-2 gap-4">
                {identities.map((id) => (
                  <Card key={id.id} className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {id.is_primary && <Badge variant="accent"><Star className="h-3 w-3" /> Primary</Badge>}
                        <h3 className="font-heading text-xl font-semibold">{id.name}</h3>
                      </div>
                      <span className="font-heading text-3xl font-semibold text-accent">{id.confidence_score}%</span>
                    </div>
                    <div className="mt-4"><ConfidenceBar value={id.confidence_score} label="Confidence" /></div>
                    {id.evidence_summary && <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{id.evidence_summary}</p>}
                    {id.underrepresented_reason && (
                      <div className="mt-4 rounded-lg bg-accent/5 border border-accent/20 p-3">
                        <SectionLabel className="mb-1 text-accent">Underrepresented today</SectionLabel>
                        <p className="text-xs text-muted-foreground leading-relaxed">{id.underrepresented_reason}</p>
                      </div>
                    )}
                    {id.potential_job_titles?.length > 0 && (
                      <div className="mt-4">
                        <SectionLabel className="mb-2">Potential job titles</SectionLabel>
                        <div className="flex flex-wrap gap-1.5">{id.potential_job_titles.map((t, i) => <Badge key={i} variant="muted">{t}</Badge>)}</div>
                      </div>
                    )}
                    {!id.is_primary && <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={() => setPrimary(id.id)}>Set as primary</Button>}
                  </Card>
                ))}
              </div>
            </section>

            {/* Career Archetypes */}
            <section>
              <h2 className="font-heading text-2xl font-semibold mb-1">Career Archetypes</h2>
              <p className="text-sm text-muted-foreground mb-5">Authentic career directions supported by your evidence.</p>
              <div className="space-y-4">
                {archetypes.map((a) => (
                  <Card key={a.id} className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-heading text-xl font-semibold">{a.name}</h3>
                        <div className="mt-3 max-w-md"><ConfidenceBar value={a.fit_score} label="Fit" /></div>
                      </div>
                      <span className="font-heading text-3xl font-semibold text-accent">{a.fit_score}%</span>
                    </div>
                    <div className="mt-5 grid sm:grid-cols-2 gap-5">
                      {a.strengths?.length > 0 && (
                        <div>
                          <SectionLabel className="mb-2 flex items-center gap-1.5"><TrendingUp className="h-3 w-3 text-emerald-600" /> Strengths</SectionLabel>
                          <ul className="space-y-1.5">{a.strengths.map((s, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-emerald-600">·</span>{s}</li>)}</ul>
                        </div>
                      )}
                      {a.gaps?.length > 0 && (
                        <div>
                          <SectionLabel className="mb-2">Gaps</SectionLabel>
                          <ul className="space-y-1.5">{a.gaps.map((g, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-muted-foreground/50">·</span>{g}</li>)}</ul>
                        </div>
                      )}
                    </div>
                    {a.recommended_keywords?.length > 0 && (
                      <div className="mt-5">
                        <SectionLabel className="mb-2">Search keywords</SectionLabel>
                        <div className="flex flex-wrap gap-1.5">{a.recommended_keywords.map((k, i) => <Badge key={i} variant="accent">{k}</Badge>)}</div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </section>

            {/* Themes */}
            {themes.length > 0 && (
              <section>
                <h2 className="font-heading text-2xl font-semibold mb-5">Recurring Themes</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {themes.map((t) => (
                    <Card key={t.id} className="p-5">
                      <h3 className="font-heading text-base font-semibold">{t.theme}</h3>
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{t.description}</p>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </PageBody>
    </div>
  );
}