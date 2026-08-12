import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCareerData } from "@/hooks/useCareerData";
import { PageBody, Card, SectionLabel, ConfidenceBar, EmptyState } from "@/components/ui-primitives";
import { Button } from "@/components/ui/button";
import { Compass, FileText, Target, Sparkles, ArrowRight, Layers, Briefcase } from "lucide-react";

export default function Home() {
  const { profile, loading, counts, refresh } = useCareerData();
  const navigate = useNavigate();
  const [insights, setInsights] = useState([]);
  const [identities, setIdentities] = useState([]);
  const [archetypes, setArchetypes] = useState([]);
  const [opportunities, setOpportunities] = useState([]);

  useEffect(() => {
    base44.entities.CareerInsight.list("-created_date", 3).then(setInsights).catch(() => {});
    base44.entities.ProfessionalIdentity.list().then(setIdentities).catch(() => {});
    base44.entities.CareerArchetype.list("-fit_score", 5).then(setArchetypes).catch(() => {});
    base44.entities.JobOpportunity.filter({ status: { $in: ["Discovered", "Evaluating", "Apply", "Applied", "Interview", "Final Interview"] } }, "-created_date", 3).then(setOpportunities).catch(() => {});
  }, []);

  const discoveryPct = profile ? Math.round((profile.completeness_discovery || 0)) : 0;
  const totalFacts = counts.answers + counts.accomplishments + counts.stories + counts.employment;

  const completenessItems = [
    { label: "Career Discovery", value: profile?.completeness_discovery || 0 },
    { label: "Employment History", value: profile?.completeness_employment || 0 },
    { label: "Accomplishment Evidence", value: profile?.completeness_accomplishments || 0 },
    { label: "Professional Identity Confidence", value: profile?.completeness_identity || 0 },
    { label: "Interview Readiness", value: profile?.completeness_interview || 0 },
  ];

  const primaryIdentity = identities.find((i) => i.is_primary) || identities[0];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="border-b border-border/60 bg-gradient-to-b from-secondary/40 to-background">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 pt-14 pb-12">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent mb-4">
            My Human OS
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold tracking-tight text-balance max-w-2xl leading-[1.1]">
            Your career is more than your resume.
          </h1>
          <p className="mt-5 max-w-xl text-muted-foreground text-[15px] leading-relaxed text-balance">
            The Human OS helps you understand the patterns, decisions, accomplishments, and experiences
            that shaped your professional life — then turns that insight into better career decisions,
            stronger resumes, and more authentic interviews.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate("/discovery")} className="rounded-full">
              <Compass className="h-4 w-4 mr-2" /> Begin Career Discovery
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/documents")} className="rounded-full">
              <FileText className="h-4 w-4 mr-2" /> Import My Current Resume
            </Button>
          </div>
        </div>
      </div>

      <PageBody className="space-y-10">
        {/* Top row: completeness + identity */}
        <div className="grid lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-xl font-semibold">Career Completeness</h2>
              <span className="text-sm text-muted-foreground">How much of your career has been explored</span>
            </div>
            <div className="space-y-4">
              {completenessItems.map((item) => (
                <div key={item.label}>
                  <ConfidenceBar value={item.value} label={item.label} />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 flex flex-col">
            <SectionLabel className="mb-3">Current Professional Identity</SectionLabel>
            {primaryIdentity ? (
              <>
                <h3 className="font-heading text-2xl font-semibold leading-tight">{primaryIdentity.name}</h3>
                <div className="mt-3"><ConfidenceBar value={primaryIdentity.confidence_score} label="Confidence" /></div>
                {primaryIdentity.evidence_summary && (
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed line-clamp-4">{primaryIdentity.evidence_summary}</p>
                )}
                <Button variant="outline" size="sm" className="mt-5 self-start rounded-full" onClick={() => navigate("/archetypes")}>
                  Explore Why <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Your professional identity emerges from career evidence. Begin discovery to let patterns surface.
                </p>
                <Button variant="outline" size="sm" className="self-start rounded-full" onClick={() => navigate("/discovery")}>
                  Start Discovery <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Career archetypes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-semibold flex items-center gap-2"><Layers className="h-5 w-5 text-accent" /> Career Archetypes</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/archetypes")}>View all</Button>
          </div>
          {archetypes.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {archetypes.map((a) => (
                <Card key={a.id} className="p-5" onClick={() => navigate("/archetypes")}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading text-base font-semibold leading-snug">{a.name}</h3>
                    <span className="text-2xl font-heading font-semibold text-accent shrink-0">{a.fit_score}%</span>
                  </div>
                  {a.strengths?.length > 0 && (
                    <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{a.strengths.slice(0, 3).join(" · ")}</p>
                  )}
                  <div className="mt-4"><ConfidenceBar value={a.fit_score} label="Fit" /></div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8">
              <EmptyState icon={Layers} title="No archetypes yet" description="After Career Discovery, the system will propose authentic career directions supported by your evidence." action={<Button variant="outline" size="sm" onClick={() => navigate("/archetypes")} className="rounded-full">Analyze career</Button>} />
            </Card>
          )}
        </div>

        {/* Master record + opportunities */}
        <div className="grid lg:grid-cols-2 gap-5">
          <Card className="p-6">
            <h2 className="font-heading text-xl font-semibold mb-5 flex items-center gap-2"><Briefcase className="h-5 w-5 text-accent" /> Master Career Record</h2>
            <div className="grid grid-cols-3 gap-4">
              <Stat label="Career facts" value={totalFacts} />
              <Stat label="Accomplishments" value={counts.accomplishments} />
              <Stat label="Stories" value={counts.stories} />
              <Stat label="Skills" value={counts.skills} />
              <Stat label="Roles" value={counts.employment} />
              <Stat label="Documents" value={counts.documents} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-xl font-semibold flex items-center gap-2"><Target className="h-5 w-5 text-accent" /> Active Opportunities</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate("/opportunities")}>Pipeline</Button>
            </div>
            {opportunities.length > 0 ? (
              <div className="space-y-3">
                {opportunities.map((o) => (
                  <div key={o.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <div className="text-sm font-medium">{o.company}</div>
                      <div className="text-xs text-muted-foreground">{o.role}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-accent">{o.fit_score || "—"}{o.fit_score ? "%" : ""}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{o.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Target} title="No active opportunities" description="Add a job description to evaluate role fit against your career evidence." action={<Button variant="outline" size="sm" onClick={() => navigate("/opportunities")} className="rounded-full">Add opportunity</Button>} />
            )}
          </Card>
        </div>

        {/* Recent insights */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> Recent Insights</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/insights")}>All insights</Button>
          </div>
          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((ins) => (
                <Card key={ins.id} className="p-5">
                  <p className="text-[15px] leading-relaxed text-foreground italic">"{ins.insight}"</p>
                  {ins.why && <p className="mt-2 text-xs text-muted-foreground">{ins.why}</p>}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8">
              <EmptyState icon={Sparkles} title="Insights appear as your career record grows" description="The system surfaces patterns you may not have articulated — how you reduce complexity, build repeatable systems, or create value." action={<Button variant="outline" size="sm" onClick={() => navigate("/insights")} className="rounded-full">Generate insights</Button>} />
            </Card>
          )}
        </div>
      </PageBody>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="font-heading text-2xl font-semibold text-foreground">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}