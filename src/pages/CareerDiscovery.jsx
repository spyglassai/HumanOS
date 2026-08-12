import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useCareerData } from "@/hooks/useCareerData";
import { CAREER_PHASES, buildDiscoveryPrompt } from "../../base44/shared/careerAI";
import { PageBody, Card, SectionLabel, Badge } from "@/components/ui-primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Check, Loader2, Sparkles, ArrowRight, Route } from "lucide-react";
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
  const [pathOpen, setPathOpen] = useState(false);
  const scrollRef = useRef(null);

  const phase = CAREER_PHASES[phaseIndex];
  const progressPct = Math.round(((phaseIndex + 1) / CAREER_PHASES.length) * 100);
  const conversationPanelHeight = "clamp(340px, calc(100vh - 19rem), 520px)";

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
      <PageBody className="max-w-6xl py-4 lg:py-6">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              Career Discovery
            </div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              One question at a time
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Start with what is true, then go deeper into why choices made sense and what they reveal.
            </p>
          </div>
          <div className="w-full rounded-xl border border-border/70 bg-card/70 p-3.5 lg:w-80">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Current phase</div>
                <div className="mt-1 text-sm font-medium text-foreground">{phase.title}</div>
              </div>
              <Badge variant="accent">{phaseIndex + 1} of {CAREER_PHASES.length}</Badge>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
            <button
              type="button"
              onClick={() => setPathOpen((open) => !open)}
              className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Route className="h-3.5 w-3.5 text-accent" />
              Discovery path
              <span className="text-accent">{pathOpen ? "Hide" : "Show"}</span>
            </button>
          </div>
        </div>

        {pathOpen && (
          <div className="mb-4 flex flex-wrap gap-2">
            {CAREER_PHASES.map((p, i) => (
              <button
                key={p.id}
                onClick={() => { setPhaseIndex(i); setConversation([]); setFacts([]); setPathOpen(false); }}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",
                  i === phaseIndex ? "border-accent bg-accent/10 text-accent font-medium" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                )}
              >
                <span className={cn("flex h-4 w-4 items-center justify-center rounded-full text-[10px]", i < phaseIndex ? "bg-accent text-primary-foreground" : i === phaseIndex ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground")}>
                  {i < phaseIndex ? <Check className="h-2.5 w-2.5" /> : i + 1}
                </span>
                {p.title}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          {/* Conversation */}
          <div>
            <Card className="flex flex-col overflow-hidden border-accent/15" style={{ height: conversationPanelHeight }}>
              <div className="flex items-center justify-between gap-4 border-b border-border/60 px-5 py-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">{phase.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{phase.description}</div>
                </div>
                <Badge variant="accent">{answersCount} answers</Badge>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 sm:px-6">
                {conversation.map((m, i) => (
                  <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[88%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed sm:max-w-[76%] sm:px-5",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-secondary/80 text-foreground rounded-bl-sm"
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

              <div className="border-t border-border/60 bg-background/25 p-3">
                <div className="flex gap-2 items-end">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Take your time. Answer as fully as feels right…"
                    className="min-h-[58px] max-h-[120px] resize-none border-border/70 bg-secondary/50 focus-visible:ring-accent"
                  />
                  <Button onClick={send} disabled={!input.trim() || thinking} size="icon" className="h-11 w-11 shrink-0 rounded-full">
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
          <div className="space-y-4">
            <Card className="p-5">
              <SectionLabel className="mb-3">Captured facts</SectionLabel>
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
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Facts, decisions, and patterns will appear here after you answer. You decide later what becomes part of your career memory.
                </p>
              )}
            </Card>

            <Card className="border-accent/20 bg-accent/5 p-5">
              <div className="mb-1.5 text-sm font-medium text-accent">Private by default</div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Discovery is for reflection first. Nothing becomes public, and inferred patterns remain hypotheses until you confirm them.
              </p>
            </Card>
          </div>
        </div>
      </PageBody>
    </div>
  );
}
