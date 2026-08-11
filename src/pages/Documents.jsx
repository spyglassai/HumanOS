import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import EntityCollection from "@/components/EntityCollection";
import { PageHeader, PageBody, Card, EmptyState } from "@/components/ui-primitives";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, FolderOpen, FileText } from "lucide-react";

const DOC_FIELDS = [
  { name: "title", label: "Title" },
  { name: "type", label: "Type", type: "select", options: ["Resume", "Performance Review", "Certificate", "Presentation", "Article", "Project Document", "Writing Sample", "Job Description", "Interview Notes", "Portfolio", "Other"] },
  { name: "file_url", label: "File URL (paste after upload)" },
  { name: "linked_roles", label: "Linked roles", type: "array" },
  { name: "linked_projects", label: "Linked projects", type: "array" },
  { name: "linked_skills", label: "Linked skills", type: "array" },
  { name: "notes", label: "Notes", type: "textarea" },
];

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInput = React.useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setDocs(await base44.entities.CareerDocument.list("-created_date")); } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const upload = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.CareerDocument.create({ title: file.name, type: "Other", file_url });
      await load();
    } catch (e) { console.error(e); }
    setUploading(false);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Library"
        title="Documents"
        description="Upload and organize resumes, performance reviews, certificates, presentations, writing samples, and other career evidence. Link them to roles, projects, and skills."
        actions={
          <>
            <input ref={fileInput} type="file" className="hidden" onChange={(e) => e.target.files[0] && upload(e.target.files[0])} />
            <Button onClick={() => fileInput.current?.click()} disabled={uploading} className="rounded-full">
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? "Uploading…" : "Upload document"}
            </Button>
          </>
        }
      />
      <PageBody className="space-y-6">
        <Card className="p-5 bg-secondary/40 flex items-start gap-3">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            When you upload a resume, the system uses it as one source of information — not a complete or accurate representation of your career. You'll verify what's extracted.
          </p>
        </Card>

        <EntityCollection entityName="CareerDocument" fields={DOC_FIELDS} title="Document" sortBy="-created_date"
          emptyTitle="No documents yet"
          emptyDescription="Upload resumes, reviews, certificates, and evidence. Link them to roles, projects, and skills."
          renderSummary={(d) => (
            <div>
              <div className="font-medium text-sm flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-accent" /> {d.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{d.type}</div>
              {d.file_url && <a href={d.file_url} target="_blank" rel="noreferrer" className="mt-1.5 inline-block text-xs text-accent hover:underline">View file →</a>}
            </div>
          )} />
      </PageBody>
    </div>
  );
}