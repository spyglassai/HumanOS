import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCareerData } from "@/hooks/useCareerData";
import { PageHeader, PageBody, Card, Badge } from "@/components/ui-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock, Mic, User, Loader2, Check } from "lucide-react";

const VOICE_OPTIONS = ["direct", "analytical", "curious", "practical", "humble", "executive", "technical", "conversational", "warm", "concise"];

export default function Settings() {
  const { profile, updateProfile, loading } = useCareerData();
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [voice, setVoice] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setHeadline(profile.headline || "");
      setVoice(profile.voice_characteristics || []);
    }
  }, [profile]);

  const toggleVoice = (v) => {
    setVoice((arr) => arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  const save = async () => {
    setSaving(true);
    await updateProfile({ display_name: displayName, headline, voice_characteristics: voice, voice_approved: true });
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="animate-fade-in">
      <PageHeader eyebrow="System" title="Settings" description="Your workspace, voice profile, and privacy." />
      <PageBody className="space-y-6">
        {/* Account */}
        <Card className="p-6">
          <h3 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2"><User className="h-4 w-4 text-accent" /> Account</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Display name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="How you refer to yourself" />
            </div>
            <div>
              <Label className="mb-1.5 block">Headline</Label>
              <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Your professional headline" />
            </div>
          </div>
          {user && (
            <div className="mt-4 pt-4 border-t border-border/60 text-sm text-muted-foreground">
              Signed in as {user.email} · Role: {user.role}
            </div>
          )}
        </Card>

        {/* Voice profile */}
        <Card className="p-6">
          <h3 className="font-heading text-lg font-semibold mb-1 flex items-center gap-2"><Mic className="h-4 w-4 text-accent" /> Authentic Voice Profile</h3>
          <p className="text-sm text-muted-foreground mb-4">How you naturally communicate. This guides all AI-generated content — "Would this person actually say this?" is a quality gate.</p>
          <div className="flex flex-wrap gap-2">
            {VOICE_OPTIONS.map((v) => (
              <button
                key={v}
                onClick={() => toggleVoice(v)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${voice.includes(v) ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                {voice.includes(v) && <Check className="h-3 w-3 inline mr-1" />}{v}
              </button>
            ))}
          </div>
          {profile?.voice_approved && <Badge variant="success" className="mt-4"><Check className="h-3 w-3" /> Voice approved</Badge>}
        </Card>

        {/* Privacy */}
        <Card className="p-6">
          <h3 className="font-heading text-lg font-semibold mb-1 flex items-center gap-2"><Lock className="h-4 w-4 text-accent" /> Privacy</h3>
          <div className="mt-3 space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium">Private by default</div>
                <p className="text-xs text-muted-foreground mt-0.5">Your entire workspace — including failures, salary history, reflections, and search strategy — is private. Nothing is published without explicit action.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium">You own your story</div>
                <p className="text-xs text-muted-foreground mt-0.5">AI augments your judgment; it never replaces it. Inferred insights never silently become confirmed facts.</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving} className="rounded-full">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
            Save settings
          </Button>
        </div>
      </PageBody>
    </div>
  );
}