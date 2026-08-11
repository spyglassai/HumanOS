import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import EntityCollection from "@/components/EntityCollection";
import { PageHeader, PageBody, Card, SectionLabel, Badge, ConfidenceBar, EmptyState } from "@/components/ui-primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Sparkles, Loader2, Clock, Star } from "lucide-react";

const STORY_FIELDS = [
  { name: "title", label: "Title" },
  { name: "category", label: "Category", type: "select", options: ["Leadership", "Strategy", "Failure", "Innovation", "Conflict", "Mentoring", "Technical Decision", "Executive Influence", "Customer Challenge", "Transformation", "AI", "Crisis", "Career Pivot"] },
  { name: "question_type", label: "Best for question type" },
  { name: "situation", label: "Situation", type: "textarea" },
  { name: "task", label: "Task", type: "textarea" },
  { name: "action", label: "Action", type: "textarea" },
  { name: "result", label: "Result", type: "textarea" },
  { name: "learning", label: "Learning", type: "textarea" },
  { name: "is_locked", label: "Lock", type: "boolean" },
];

const QUESTION_CATEGORIES = [
  "Leadership", "Strategy", "Failure", "Innovation", "Conflict", "Mentoring",
  "Technical Decision", "Executive Influence", "Customer Challenge", "Transformation", "AI", "Crisis", "Career Pivot",
];

export default function InterviewStudio() {
  const [tab, setTab] = useState("readiness");
  const [stories, setStories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [intros, setIntros] = useState({ short: "", medium: "", long: "" });
  const [draftingIntro, setDraftingIntro] = useState(null);

  useEffect(() => {
    base44.entities.InterviewStory.list().then(setStories).catch(() => {});
  }, []);

  const readiness = Math.min(100, Math.round((stories.length / 8) * 100));

  const generateQuestions = async () => {
    setGenerating(true);
    try {
      const [employment, accomplishments, identities] = await Promise.all([
        base44.entities.EmploymentRecord.list(),
        base44.entities.Accomplishment.list(),
        base44.entities.ProfessionalIdentity.list(),
      ]);
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this person's career, generate 8 likely interview questions they should prepare for, across categories. For each, recommend the strongest existing story from their library (or note if none fits). Return JSON: { "questions": [{ "question": "", "category": "", "recommended_story": "", "why": "" }] }\n\nIdentities: ${identities.map((i) => i.name).join(", ")}\nAccomplishments: ${accomplishments.map((a) => a.title).join("; ")}\nEmployment: ${employment.map((e) => `${e.title} at ${e.company}`).join("; ")}\nAvailable stories: ${stories.map((s) => `${s.title} (${s.category})`).join("; ")}`,
        response_json_schema: { type: "object", properties: { questions: { type: "array", items: { type: "object", properties: {
          question: { type: "string" }, category: { type: "string" }, recommended_story: { type: "string" }, why: { type: "string" }
        } } } } },
      });
      setQuestions(res.questions || []);
    } catch (e) { console.error(e); }
    setGenerating(false);
  };

  const draftIntro = async (length) => {
    setDraftingIntro(length);
    try {
      const [employment, accomplishments, identities] = await Promise.all([
        base44.entities.EmploymentRecord.list(),
        base44.entities.Accomplishment.list(),
        base44.entities.ProfessionalIdentity.list(),
      ]);
      const target = length === "short" ? "30 seconds" : length === "medium" ? "2 minutes" : "5 minutes";
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a ${target} career introduction for this person, in simple earned language (no corporate buzzwords). Base it only on the evidence. Return JSON: { "text": "" }\n\nPrimary identity: ${identities[0]?.name || ""}\nRoles: ${employment.map((e) => `${e.title} at ${e.company}`).join("; ")}\nKey accomplishments: ${accomplishments.slice(0, 5).map((a) => a.title).join("; ")}`,
        response_json_schema: { type: "object", properties: { text: { type: "string" } } },
      });
      setIntros({ ...intros, [length]: res.text });
    } catch (e) { console.error(e); }
    setDraftingIntro(null);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Preparation"
        title="Interview Studio"
        description="The resume gets you into the room. The Human OS helps you tell the story — with a story library, likely questions, STAR builder, and career introductions."
      />
      <PageBody>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap h-auto bg-secondary/60 p-1 rounded-xl mb-6 gap-1">
            <TabsTrigger value="readiness" className="rounded-lg">Readiness</TabsTrigger>
            <TabsTrigger value="stories" className="rounded-lg">Story Library</TabsTrigger>
            <TabsTrigger value="questions" className="rounded-lg">Likely Questions</TabsTrigger>
            <TabsTrigger value="intros" className="rounded-lg">Introductions</TabsTrigger>
          </TabsList>

          <TabsContent value="readiness">
            <Card className="p-6 mb-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading text-xl font-semibold">Interview Readiness</h3>
                  <p className="text-sm text-muted-foreground mt-1">Built from your story library coverage.</p>
                </div>
                <span className="font-heading text-4xl font-semibold text-accent">{readiness}%</span>
              </div>
              <ConfidenceBar value={readiness} />
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {QUESTION_CATEGORIES.slice(0, 8).map((c) => {
                  const has = stories.some((s) => s.category === c);
                  return (
                    <div key={c} className="flex items-center gap-2 text-xs">
                      <span className={`h-2 w-2 rounded-full ${has ? "bg-emerald-500" : "bg-secondary"}`} />
                      <span className={has ? "text-foreground" : "text-muted-foreground"}>{c}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card className="p-6">
              <SectionLabel className="mb-3">STAR Builder</SectionLabel>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">Structure any experience into Situation, Task, Action, Result — then capture what you learned. Add stories in the Story Library tab.</p>
              <Button variant="outline" onClick={() => setTab("stories")} className="rounded-full"><Star className="h-4 w-4 mr-2" /> Go to Story Library</Button>
            </Card>
          </TabsContent>

          <TabsContent value="stories">
            <EntityCollection entityName="InterviewStory" fields={STORY_FIELDS} title="Interview story" sortBy="-created_date"
              emptyTitle="No stories yet" emptyDescription="Build a library of stories across categories. The system recommends the strongest story for each likely question."
              renderSummary={(s) => (
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">{s.title} {s.is_locked && <Badge variant="locked">Locked</Badge>}</div>
                  <Badge variant="muted" className="mt-1.5">{s.category}</Badge>
                </div>
              )} />
          </TabsContent>

          <TabsContent value="questions">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-muted-foreground">Likely questions with recommended stories from your library.</p>
              <Button onClick={generateQuestions} disabled={generating} className="rounded-full">
                {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {generating ? "Generating…" : "Generate questions"}
              </Button>
            </div>
            {questions.length === 0 ? (
              <Card className="p-8"><EmptyState icon={MessageSquare} title="No questions generated yet" description="Generate likely interview questions based on your career. Each comes with a recommended story." /></Card>
            ) : (
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <Card key={i} className="p-5">
                    <div className="flex items-start gap-3">
                      <span className="font-heading text-lg font-semibold text-muted-foreground/50 shrink-0">{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-[15px] font-medium">{q.question}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="accent">{q.category}</Badge>
                          {q.recommended_story && q.recommended_story !== "none" && <Badge variant="success"><Star className="h-3 w-3" /> {q.recommended_story}</Badge>}
                        </div>
                        {q.why && <p className="mt-2 text-xs text-muted-foreground">{q.why}</p>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="intros">
            <div className="grid lg:grid-cols-3 gap-4">
              {[{ key: "short", label: "30-Second", icon: Clock }, { key: "medium", label: "2-Minute", icon: Clock }, { key: "long", label: "5-Minute", icon: Clock }].map(({ key, label }) => (
                <Card key={key} className="p-5 flex flex-col">
                  <h3 className="font-heading text-lg font-semibold mb-3">{label} Career Story</h3>
                  <Textarea value={intros[key]} onChange={(e) => setIntros({ ...intros, [key]: e.target.value })} placeholder="Draft or generate…" className="flex-1 min-h-[160px] editorial-prose" />
                  <Button variant="outline" size="sm" className="mt-3 self-start rounded-full" disabled={draftingIntro === key} onClick={() => draftIntro(key)}>
                    {draftingIntro === key ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                    Draft
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </PageBody>
    </div>
  );
}