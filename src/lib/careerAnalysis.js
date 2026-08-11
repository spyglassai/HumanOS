import { base44 } from "@/api/base44Client";
import { buildAnalysisPrompt } from "../../base44/shared/careerAI";

// Runs the full career analysis and persists insights, identities, archetypes, and themes.
export async function runCareerAnalysis() {
  const [profile, employment, accomplishments, stories, skills, answers] = await Promise.all([
    base44.entities.CareerProfile.list(),
    base44.entities.EmploymentRecord.list(),
    base44.entities.Accomplishment.list(),
    base44.entities.CareerStory.list(),
    base44.entities.Skill.list(),
    base44.entities.InterviewAnswer.list(),
  ]);

  const res = await base44.integrations.Core.InvokeLLM({
    prompt: buildAnalysisPrompt({
      profile: profile[0], employment, accomplishments, stories, skills, answers,
    }),
    response_json_schema: {
      type: "object",
      properties: {
        insights: { type: "array", items: { type: "object", properties: {
          insight: { type: "string" }, why: { type: "string" }, supporting_evidence: { type: "array", items: { type: "string" } }
        } } },
        identities: { type: "array", items: { type: "object", properties: {
          name: { type: "string" }, confidence_score: { type: "number" }, evidence_summary: { type: "string" },
          potential_job_titles: { type: "array", items: { type: "string" } }, underrepresented_reason: { type: "string" }
        } } },
        archetypes: { type: "array", items: { type: "object", properties: {
          name: { type: "string" }, fit_score: { type: "number" }, strengths: { type: "array", items: { type: "string" } },
          gaps: { type: "array", items: { type: "string" } }, recommended_keywords: { type: "array", items: { type: "string" } }
        } } },
        themes: { type: "array", items: { type: "object", properties: {
          theme: { type: "string" }, description: { type: "string" }, confidence: { type: "number" }
        } } },
      },
    },
  });

  if (res.insights?.length) {
    await base44.entities.CareerInsight.bulkCreate(
      res.insights.map((i) => ({ insight: i.insight, why: i.why, supporting_evidence: i.supporting_evidence || [], status: "pending" }))
    );
  }
  if (res.identities?.length) {
    const existing = await base44.entities.ProfessionalIdentity.list();
    if (existing.length) await base44.entities.ProfessionalIdentity.deleteMany({ id: { $in: existing.map((e) => e.id) } });
    await base44.entities.ProfessionalIdentity.bulkCreate(
      res.identities.map((i, idx) => ({ ...i, is_primary: idx === 0, top_accomplishments: [], top_roles: [], potential_weaknesses: [] }))
    );
  }
  if (res.archetypes?.length) {
    const existing = await base44.entities.CareerArchetype.list();
    if (existing.length) await base44.entities.CareerArchetype.deleteMany({ id: { $in: existing.map((e) => e.id) } });
    await base44.entities.CareerArchetype.bulkCreate(
      res.archetypes.map((a) => ({ ...a, supporting_evidence: [], role_examples: [], development_opportunities: [], recommended_narrative: "" }))
    );
  }
  if (res.themes?.length) {
    const existing = await base44.entities.CareerTheme.list();
    if (existing.length) await base44.entities.CareerTheme.deleteMany({ id: { $in: existing.map((e) => e.id) } });
    await base44.entities.CareerTheme.bulkCreate(res.themes.map((t) => ({ ...t, supporting_evidence: [] })));
  }

  const p = profile[0];
  if (p) await base44.entities.CareerProfile.update(p.id, { completeness_identity: Math.min(100, (p.completeness_identity || 0) + 25) });

  return res;
}