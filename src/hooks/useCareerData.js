import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// Ensures the user has a CareerProfile and loads it along with record counts.
export function useCareerData() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    employment: 0, accomplishments: 0, stories: 0, skills: 0,
    projects: 0, identities: 0, archetypes: 0, insights: 0,
    opportunities: 0, resumes: 0, documents: 0, answers: 0,
  });

  const loadCounts = useCallback(async () => {
    try {
      const [
        employment, accomplishments, stories, skills, projects,
        identities, archetypes, insights, opportunities, resumes, documents, answers
      ] = await Promise.all([
        base44.entities.EmploymentRecord.list(),
        base44.entities.Accomplishment.list(),
        base44.entities.CareerStory.list(),
        base44.entities.Skill.list(),
        base44.entities.Project.list(),
        base44.entities.ProfessionalIdentity.list(),
        base44.entities.CareerArchetype.list(),
        base44.entities.CareerInsight.list(),
        base44.entities.JobOpportunity.list(),
        base44.entities.Resume.list(),
        base44.entities.CareerDocument.list(),
        base44.entities.InterviewAnswer.list(),
      ]);
      setCounts({
        employment: employment.length, accomplishments: accomplishments.length,
        stories: stories.length, skills: skills.length, projects: projects.length,
        identities: identities.length, archetypes: archetypes.length,
        insights: insights.length, opportunities: opportunities.length,
        resumes: resumes.length, documents: documents.length, answers: answers.length,
      });
    } catch (e) { /* ignore count errors */ }
  }, []);

  const ensureProfile = useCallback(async () => {
    let existing = await base44.entities.CareerProfile.list();
    if (existing.length > 0) {
      setProfile(existing[0]);
      return existing[0];
    }
    const created = await base44.entities.CareerProfile.create({});
    setProfile(created);
    return created;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await ensureProfile();
      await loadCounts();
    } catch (e) { /* ignore */ }
    setLoading(false);
  }, [ensureProfile, loadCounts]);

  useEffect(() => { refresh(); }, [refresh]);

  const updateProfile = useCallback(async (data) => {
    if (!profile) return;
    const updated = await base44.entities.CareerProfile.update(profile.id, data);
    setProfile(updated);
    return updated;
  }, [profile]);

  return { profile, loading, counts, refresh, updateProfile };
}