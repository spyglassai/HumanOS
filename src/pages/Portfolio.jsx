import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useSearchParams } from "react-router-dom";
import { PageHeader, PageBody, Card, Badge, EmptyState } from "@/components/ui-primitives";
import { Globe, Loader2, Lock } from "lucide-react";

export default function Portfolio() {
  const [params] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const profiles = await base44.entities.PublicProfile.list();
    setProfile(profiles[0] || null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  if (!profile || profile.status === "Private") {
    return (
      <div className="animate-fade-in">
        <PageHeader eyebrow="Public Identity" title="Portfolio" description="Your curated public professional profile — the evidence behind the resume." />
        <PageBody>
          <Card className="p-12">
            <EmptyState icon={profile ? Lock : Globe}
              title={profile ? "Your profile is private" : "No public profile yet"}
              description={profile ? "Toggle sections to public in the Public Profile builder to preview your portfolio here." : "Build your public profile to see a preview of what the world sees."}
            />
          </Card>
        </PageBody>
      </div>
    );
  }

  const visibleSections = (profile.sections || []).filter((s) => s.visible);

  return (
    <div className="animate-fade-in">
      <div className="border-b border-border/60 bg-gradient-to-b from-secondary/40 to-background">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 pt-14 pb-12 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent mb-3">humanos.app/{profile.slug || "you"}</div>
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold tracking-tight text-balance">
            {profile.tagline || "Your professional identity"}
          </h1>
          {profile.snapshot && <p className="mt-5 max-w-2xl mx-auto text-muted-foreground text-[15px] leading-relaxed text-balance">{profile.snapshot}</p>}
        </div>
      </div>

      <PageBody className="max-w-3xl space-y-10">
        {profile.bio && (
          <section>
            <h2 className="font-heading text-2xl font-semibold mb-4">Executive Bio</h2>
            <p className="editorial-prose text-[15px] text-foreground/90 whitespace-pre-wrap">{profile.bio}</p>
          </section>
        )}

        {visibleSections.map((s, i) => (
          <section key={i}>
            <h2 className="font-heading text-2xl font-semibold mb-3">{s.title}</h2>
            <p className="editorial-prose text-[15px] text-foreground/90 whitespace-pre-wrap">{s.summary || "—"}</p>
          </section>
        ))}

        <div className="pt-8 border-t border-border/60 text-center">
          <Badge variant="muted"><Globe className="h-3 w-3" /> {profile.status}</Badge>
          <p className="mt-3 text-xs text-muted-foreground">This is a preview of your public profile. Only content you've explicitly published appears here.</p>
        </div>
      </PageBody>
    </div>
  );
}