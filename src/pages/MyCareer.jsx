import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import EntityCollection from "@/components/EntityCollection";
import { PageHeader, PageBody, Card, Badge } from "@/components/ui-primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ROLE_FIELDS = [
  { name: "company", label: "Company" },
  { name: "title", label: "Title" },
  { name: "start_date", label: "Start date", type: "date" },
  { name: "end_date", label: "End date", type: "date" },
  { name: "current", label: "Current role?", type: "boolean" },
  { name: "location", label: "Location" },
  { name: "employment_type", label: "Employment type", type: "select", options: ["Full-time", "Part-time", "Contract", "Consulting", "Internship", "Other"] },
  { name: "manager_level", label: "Manager level" },
  { name: "team", label: "Team" },
  { name: "scope", label: "Scope", type: "textarea" },
  { name: "technologies", label: "Technologies", type: "array" },
  { name: "responsibilities", label: "Responsibilities", type: "array" },
  { name: "achievements", label: "Achievements", type: "array" },
  { name: "challenges", label: "Challenges", type: "textarea" },
  { name: "failures", label: "Failures", type: "textarea" },
  { name: "lessons", label: "Lessons", type: "textarea" },
  { name: "summary", label: "Summary", type: "textarea" },
  { name: "is_significant", label: "Significant role?", type: "boolean" },
];

const ACCOMPLISHMENT_FIELDS = [
  { name: "title", label: "Title" },
  { name: "company", label: "Company" },
  { name: "role", label: "Role" },
  { name: "date", label: "Date", type: "date" },
  { name: "problem", label: "Problem", type: "textarea" },
  { name: "context", label: "Context", type: "textarea" },
  { name: "action", label: "Action", type: "textarea" },
  { name: "outcome", label: "Outcome", type: "textarea" },
  { name: "business_impact", label: "Business impact", type: "textarea" },
  { name: "scale", label: "Scale" },
  { name: "metrics", label: "Metrics", type: "array" },
  { name: "stakeholders", label: "Stakeholders", type: "array" },
  { name: "skills_demonstrated", label: "Skills demonstrated", type: "array" },
  { name: "strategic_themes", label: "Strategic themes", type: "array" },
  { name: "approved_wording", label: "Approved wording", type: "textarea" },
  { name: "is_locked", label: "Lock this accomplishment", type: "boolean" },
];

const STORY_FIELDS = [
  { name: "title", label: "Title" },
  { name: "category", label: "Category", type: "select", options: ["Leadership", "Strategy", "Failure", "Innovation", "Conflict", "Mentoring", "Technical Decision", "Executive Influence", "Customer Challenge", "Transformation", "AI", "Crisis", "Career Pivot"] },
  { name: "situation", label: "Situation", type: "textarea" },
  { name: "task", label: "Task", type: "textarea" },
  { name: "action", label: "Action", type: "textarea" },
  { name: "result", label: "Result", type: "textarea" },
  { name: "learning", label: "Learning", type: "textarea" },
  { name: "is_locked", label: "Lock this story", type: "boolean" },
];

const SKILL_FIELDS = [
  { name: "name", label: "Skill" },
  { name: "category", label: "Category" },
  { name: "evidence_summary", label: "Evidence summary", type: "textarea" },
  { name: "confidence", label: "Confidence (0-100)", type: "number" },
];

const LEADERSHIP_FIELDS = [
  { name: "type", label: "Type", type: "select", options: ["Formal Management", "Team Leadership", "Mentoring", "Coaching", "Technical Leadership", "Executive Influence", "Cross-Functional", "Program Leadership", "Crisis Leadership", "Thought Leadership", "Knowledge Sharing"] },
  { name: "description", label: "Description", type: "textarea" },
  { name: "scope", label: "Scope" },
  { name: "people_count", label: "People count", type: "number" },
  { name: "details", label: "Details", type: "textarea" },
];

const EDUCATION_FIELDS = [
  { name: "institution", label: "Institution" },
  { name: "program", label: "Program" },
  { name: "major", label: "Major" },
  { name: "focus", label: "Focus" },
  { name: "start_date", label: "Start", type: "date" },
  { name: "end_date", label: "End", type: "date" },
  { name: "credits_completed", label: "Credits completed" },
  { name: "degree_earned", label: "Degree earned?", type: "boolean" },
  { name: "degree_not_earned_reason", label: "If no degree, reason", type: "textarea" },
  { name: "relevant_coursework", label: "Relevant coursework", type: "array" },
  { name: "capstone", label: "Capstone", type: "textarea" },
  { name: "notes", label: "Notes", type: "textarea" },
];

const CERT_FIELDS = [
  { name: "name", label: "Certification" },
  { name: "issuer", label: "Issuer" },
  { name: "status", label: "Status", type: "select", options: ["Active", "Expired", "In Progress", "Completed"] },
  { name: "date", label: "Date", type: "date" },
  { name: "expiry_date", label: "Expiry date", type: "date" },
  { name: "credential_id", label: "Credential ID" },
  { name: "include_in_outputs", label: "Include in outputs?", type: "boolean" },
];

const PHILOSOPHY_FIELDS = [
  { name: "type", label: "Type", type: "select", options: ["Leadership", "Technology", "AI", "Customer", "Learning", "Innovation", "Organizational", "Management"] },
  { name: "content", label: "Content", type: "textarea" },
  { name: "is_locked", label: "Lock", type: "boolean" },
];

export default function MyCareer() {
  const [tab, setTab] = useState("timeline");
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    base44.entities.EmploymentRecord.list("start_date").then(setRoles).catch(() => {});
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="My Career"
        title="The career behind the resume"
        description="Your professional memory — every role, project, accomplishment, story, and skill, preserved completely so the full record is always available."
      />
      <PageBody>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap h-auto bg-secondary/60 p-1 rounded-xl mb-6 gap-1">
            <TabsTrigger value="timeline" className="rounded-lg">Timeline</TabsTrigger>
            <TabsTrigger value="roles" className="rounded-lg">Roles</TabsTrigger>
            <TabsTrigger value="accomplishments" className="rounded-lg">Accomplishments</TabsTrigger>
            <TabsTrigger value="stories" className="rounded-lg">Stories</TabsTrigger>
            <TabsTrigger value="skills" className="rounded-lg">Skills</TabsTrigger>
            <TabsTrigger value="leadership" className="rounded-lg">Leadership</TabsTrigger>
            <TabsTrigger value="education" className="rounded-lg">Education</TabsTrigger>
            <TabsTrigger value="certifications" className="rounded-lg">Certifications</TabsTrigger>
            <TabsTrigger value="philosophy" className="rounded-lg">Philosophies</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline"><Timeline roles={roles} /></TabsContent>
          <TabsContent value="roles">
            <EntityCollection entityName="EmploymentRecord" fields={ROLE_FIELDS} title="Role" sortBy="start_date"
              emptyTitle="No roles yet" emptyDescription="Add the roles you've held. We'll reconstruct each one in depth during Career Discovery."
              renderSummary={(r) => (
                <div>
                  <div className="font-medium text-sm">{r.title} <span className="text-muted-foreground">· {r.company}</span></div>
                  <div className="text-xs text-muted-foreground mt-0.5">{r.start_date || "?"} — {r.current ? "present" : r.end_date || "?"}</div>
                  {r.is_significant === false && <Badge variant="muted" className="mt-1.5">Early career</Badge>}
                </div>
              )} />
          </TabsContent>
          <TabsContent value="accomplishments">
            <EntityCollection entityName="Accomplishment" fields={ACCOMPLISHMENT_FIELDS} title="Accomplishment" sortBy="-date"
              emptyTitle="No accomplishments yet" emptyDescription="Capture what you actually did — the problem, your action, and what changed."
              renderSummary={(a) => (
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">{a.title} {a.is_locked && <Badge variant="locked">Locked</Badge>}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{a.company} · {a.outcome?.slice(0, 80)}</div>
                </div>
              )} />
          </TabsContent>
          <TabsContent value="stories">
            <EntityCollection entityName="CareerStory" fields={STORY_FIELDS} title="Story" sortBy="-created_date"
              emptyTitle="No stories yet" emptyDescription="Career stories become the backbone of your interviews and narrative."
              renderSummary={(s) => (
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">{s.title} {s.is_locked && <Badge variant="locked">Locked</Badge>}</div>
                  <Badge variant="muted" className="mt-1.5">{s.category}</Badge>
                </div>
              )} />
          </TabsContent>
          <TabsContent value="skills">
            <EntityCollection entityName="Skill" fields={SKILL_FIELDS} title="Skill" sortBy="name"
              emptyTitle="No skills yet" emptyDescription="Skills are strongest when backed by evidence. Link them to accomplishments."
              renderSummary={(s) => (
                <div>
                  <div className="font-medium text-sm">{s.name}</div>
                  {s.category && <div className="text-xs text-muted-foreground mt-0.5">{s.category}</div>}
                </div>
              )} />
          </TabsContent>
          <TabsContent value="leadership">
            <EntityCollection entityName="LeadershipExperience" fields={LEADERSHIP_FIELDS} title="Leadership experience" sortBy="-created_date"
              emptyTitle="No leadership records yet" emptyDescription="Leadership is more than management. Capture mentoring, influence, technical leadership, and more."
              renderSummary={(l) => (
                <div>
                  <Badge variant="accent">{l.type}</Badge>
                  <div className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{l.description}</div>
                </div>
              )} />
          </TabsContent>
          <TabsContent value="education">
            <EntityCollection entityName="Education" fields={EDUCATION_FIELDS} title="Education record" sortBy="-end_date"
              emptyTitle="No education records yet" emptyDescription="Education doesn't have to end in a degree. Record it truthfully."
              renderSummary={(e) => (
                <div>
                  <div className="font-medium text-sm">{e.institution}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{e.program || e.major} {e.degree_earned ? "· Degree earned" : "· No degree"}</div>
                </div>
              )} />
          </TabsContent>
          <TabsContent value="certifications">
            <EntityCollection entityName="Certification" fields={CERT_FIELDS} title="Certification" sortBy="-date"
              emptyTitle="No certifications yet" emptyDescription="Track certifications and their status. Decide which appear in outputs."
              renderSummary={(c) => (
                <div>
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{c.issuer}</span>
                    <Badge variant={c.status === "Active" ? "success" : "muted"}>{c.status}</Badge>
                  </div>
                </div>
              )} />
          </TabsContent>
          <TabsContent value="philosophy">
            <EntityCollection entityName="ProfessionalPhilosophy" fields={PHILOSOPHY_FIELDS} title="Philosophy" sortBy="type"
              emptyTitle="No philosophies yet" emptyDescription="Your recurring beliefs about leadership, technology, AI, and more. Private by default."
              renderSummary={(p) => (
                <div>
                  <Badge variant="accent">{p.type}</Badge>
                  <div className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{p.content}</div>
                </div>
              )} />
          </TabsContent>
        </Tabs>
      </PageBody>
    </div>
  );
}

function Timeline({ roles }) {
  if (!roles || roles.length === 0) {
    return <Card className="p-8"><div className="text-center text-muted-foreground text-sm">Your timeline will appear here as you add roles. Each role opens to its full evidence and stories.</div></Card>;
  }
  const sorted = [...roles].sort((a, b) => (a.start_date || "").localeCompare(b.start_date || ""));
  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
      <div className="space-y-6">
        {sorted.map((r) => (
          <div key={r.id} className="relative">
            <div className="absolute -left-[22px] top-1.5 h-3 w-3 rounded-full bg-accent ring-4 ring-background" />
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">{r.start_date || "—"} → {r.current ? "present" : r.end_date || "—"}</div>
                  <h3 className="font-heading text-lg font-semibold mt-1">{r.title}</h3>
                  <div className="text-sm text-accent">{r.company}</div>
                </div>
                {r.current && <Badge variant="success">Current</Badge>}
              </div>
              {r.summary && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{r.summary}</p>}
              {r.technologies?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.technologies.slice(0, 6).map((t, i) => <Badge key={i} variant="muted">{t}</Badge>)}
                </div>
              )}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}