import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useCareerData } from "@/hooks/useCareerData";
import { CAREER_PHASES, buildDiscoveryPrompt } from "../../base44/shared/careerAI";
import { PageHeader, PageBody, Card, SectionLabel, Badge } from "@/components/ui-primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Check, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CareerDiscovery() {
  const { profile, updateProfile } = useCareerData();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [conversation, setConversation] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [facts, setFacts] = useState([]);
  const [answersCount, setAnswersCount] = useState(0);
  const [session, setSession] = useState(null);
  const scrollRef = useRef(null);

  const phase = CAREER_PHASES[phaseIndex];

  useEffect(() => {
    base44.entities.InterviewAnswer.list().then((a) => setAnswersCount(a.length)).catch(() => {});
    base44.entities.InterviewSession.filter({ status: "in_progress" }).then((s) => {
      if (s.length > 0) setSession(s[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [conversation, thinking]);

  // Open the phase with the AI's first question
  const openPhase = useCallback(async (idx) => {
    const p = CAREER_PHASES[idx];
    setThinking(true);
    try {
      const prompt = buildDiscoveryPrompt({
        phase: p,
        conversation: [],
        profile,
        questionBank: p.questions,
        areasExplored: 0,
      });
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            message: { type: "string" },
            extracted_facts: { type: "array", items: { type: "string" } },
            phase_complete: { type: "boolean" },
          },
        },
      });
      setConversation([{ role: "assistant", content: res.message }]);
    } catch (e) {
      setConversation([{ role: "assistant", content: p.questions[0] }]);
    }
    setThinking(false);
  }, [profile]);

  useEffect(() => {
    if (profile && conversation.length === 0) openPhase(phaseIndex);
  }, [profile, phaseIndex, openPhase, conversation.length]);

  const send = async () => {
    if (!input.trim() || thinking) return;
    const userMsg = { role: "user", content: input.trim() };
    const newConv = [...conversation, userMsg];
    setConversation(newConv);
    setInput("");
    setThinking(true);

    try {
      const prompt = buildDiscoveryPrompt({
        phase,
        conversation: newConv,
        profile,
        questionBank: phase.questions,
        areasExplored: answersCount,
      });
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            message: { type: "string" },
            extracted_facts: { type: "array", items: { type: "string" } },
            phase_complete: { type: "boolean" },
          },
        },
      });

      // Save the answer + extracted facts
      const lastUser = newConv[newConv.length - 1].content;
      const lastQuestion = conversation[conversation.length - 1]?.content || phase.questions[0];
      await base44.entities.InterviewAnswer.create({
        session_id: session?.id,
        phase: phase.id,
        question: lastQuestion,
        answer: lastUser,
        extracted_facts: res.extracted_facts || [],
        confidence: 0.7,
      });
      setAnswersCount((c) => c + 1);
      if (res.extracted_facts?.length) setFacts((f) => [...res.extracted_facts, ...f].slice(0, 12));

      setConversation([...newConv, { role: "assistant", content: res.message }]);

      // Update completeness heuristically
      const newPct = Math.min(100, (profile.completeness_discovery || 0) + 3);
      updateProfile({ completeness_discovery: newPct });
    } catch (e) {
      setConversation([...newConv, { role: "assistant", content: "I lost my train of thought for a moment. Could you say a bit more about that?" }]);
    }
    setThinking(false);
  };

  const advancePhase = () => {
    if (phaseIndex < CAREER_PHASES.length - 1) {
      setConversation([]);
      setFacts([]);
      setPhaseIndex((i) => i + 1);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Career Discovery"
        title="Let's understand your career"
        description="A long-term, conversational interview — not a form. One thoughtful question at a time, with follow-ups that go deeper. The purpose is discovery."
      />

      <PageBody>
        {/* Phase tracker */}
        <div className="mb-6 flex flex-wrap gap-2">
          {CAREER_PHASES.map((p, i) => (
            <button
              key={p.id}
              onClick={() => { setPhaseIndex(i); setConversation([]); setFacts([]); }}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",
                i === phaseIndex ? "border-accent bg-accent/10 text-accent font-medium" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              )}
            >
              <span className={cn("flex h-4 w-4 items-center justify-center rounded-full text-[10px]", i < phaseIndex ? "bg-accent text-white" : i === phaseIndex ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground")}>
                {i < phaseIndex ? <Check className="h-2.5 w-2.5" /> : i + 1}
              </span>
              {p.title}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Conversation */}
          <div className="lg:col-span-2">
            <Card className="flex flex-col h-[600px]">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
                <div>
                  <div className="text-sm font-semibold">{phase.title}</div>
                  <div className="text-xs text-muted-foreground">{phase.description}</div>
                </div>
                <Badge variant="accent">{answersCount} answers</Badge>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                {conversation.map((m, i) => (
                  <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-secondary text-foreground rounded-bl-sm"
                    )}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {thinking && (
                  <div className="flex justify-start">
                    <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border/60 p-3">
                <div className="flex gap-2 items-end">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Take your time. Answer as fully as feels right…"
                    className="resize-none border-0 bg-secondary/50 focus-visible:ring-0 min-h-[60px] max-h-[140px]"
                  />
                  <Button onClick={send} disabled={!input.trim() || thinking} size="icon" className="rounded-full h-10 w-10 shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-2 px-1">
                  <span className="text-[11px] text-muted-foreground">⌘+Enter to send</span>
                  {phaseIndex < CAREER_PHASES.length - 1 && (
                    <button onClick={advancePhase} className="text-[11px] text-accent hover:underline flex items-center gap-1">
                      Move to next phase <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Side panel: extracted facts */}
          <div className="space-y-5">
            <Card className="p-5">
              <SectionLabel className="mb-3">What I'm capturing</SectionLabel>
              {facts.length > 0 ? (
                <div className="space-y-2.5">
                  {facts.map((f, i) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <Sparkles className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                      <span className="text-foreground/90 leading-relaxed">{f}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  As you answer, the system captures concrete career facts — companies, roles, projects, skills — into your private career memory. Nothing is invented.
                </p>
              )}
            </Card>

            <Card className="p-5">
              <SectionLabel className="mb-3">This phase</SectionLabel>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{phase.description}</p>
              <div className="space-y-2">
                {phase.questions.slice(0, 5).map((q, i) => (
                  <div key={i} className="flex gap-2 text-xs text-muted-foreground/80">
                    <span className="text-accent">·</span> {q}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 bg-accent/5 border-accent/20">
              <div className="text-sm font-medium text-accent mb-1.5">A note on depth</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Reflection is a feature here. You can pause and return any time — your conversation is saved to your private workspace. There's no rush to finish.
              </p>
            </Card>
          </div>
        </div>
      </PageBody>
    </div>
  );
}