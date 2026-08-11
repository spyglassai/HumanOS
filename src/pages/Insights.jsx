import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { runCareerAnalysis } from "@/lib/careerAnalysis";
import { PageHeader, PageBody, Card, SectionLabel, EmptyState, Badge } from "@/components/ui-primitives";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Check, X, MessageSquare } from "lucide-react";

export default function Insights() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setInsights(await base44.entities.CareerInsight.list("-created_date")); } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    await base44.entities.CareerInsight.update(id, { status });
    await load();
  };

  const generate = async () => {
    setAnalyzing(true);
    try {
      await runCareerAnalysis();
      await load();
    } catch (e) {
      console.error(e);
    }
    setAnalyzing(false);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Career Intelligence"
        title="Insights"
        description="Patterns the system notices across your career — how you reduce complexity, build repeatable systems, and create value. You decide what feels accurate."
        actions={
          <Button onClick={generate} disabled={analyzing} className="rounded-full">
            {analyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {analyzing ? "Analyzing…" : "Generate insights"}
          </Button>
        }
      />
      <PageBody>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : insights.length === 0 ? (
          <Card className="p-8">
            <EmptyState icon={Sparkles} title="No insights yet"
              description="Once you've added career memory through Discovery or manually, generate insights to surface patterns you may not have articulated. The system never invents — it works only from your evidence."
              action={<Button onClick={generate} disabled={analyzing} className="rounded-full"><Sparkles className="h-4 w-4 mr-2" /> Generate insights</Button>} />
          </Card>
        ) : (
          <div className="space-y-4">
            {insights.map((ins) => (
              <Card key={ins.id} className="p-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-4 w-4 text-accent shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-[15px] leading-relaxed text-foreground italic">"{ins.insight}"</p>
                    {ins.why && (
                      <div className="mt-3 rounded-lg bg-secondary/50 p-3">
                        <SectionLabel className="mb-1">Why I think this</SectionLabel>
                        <p className="text-xs text-muted-foreground leading-relaxed">{ins.why}</p>
                      </div>
                    )}
                    {ins.supporting_evidence?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {ins.supporting_evidence.map((e, i) => <Badge key={i} variant="muted">{e}</Badge>)}
                      </div>
                    )}
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground mr-1">Does this feel accurate?</span>
                      <Button size="sm" variant={ins.status === "accepted" ? "default" : "outline"} className="h-7 rounded-full text-xs" onClick={() => setStatus(ins.id, "accepted")}><Check className="h-3 w-3 mr-1" /> Yes</Button>
                      <Button size="sm" variant={ins.status === "modified" ? "default" : "outline"} className="h-7 rounded-full text-xs" onClick={() => setStatus(ins.id, "modified")}>Partly</Button>
                      <Button size="sm" variant={ins.status === "rejected" ? "default" : "outline"} className="h-7 rounded-full text-xs" onClick={() => setStatus(ins.id, "rejected")}><X className="h-3 w-3 mr-1" /> No</Button>
                      <Button size="sm" variant="ghost" className="h-7 rounded-full text-xs"><MessageSquare className="h-3 w-3 mr-1" /> Discuss</Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageBody>
    </div>
  );
}