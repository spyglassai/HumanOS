import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Card, EmptyState } from "@/components/ui-primitives";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

function FieldInput({ field, value, onChange }) {
  const common = { value: value || "", onChange: (e) => onChange(e.target.value), className: "w-full" };

  if (field.type === "textarea") return <Textarea {...common} rows={4} />;
  if (field.type === "date") return <Input type="date" {...common} />;
  if (field.type === "number") return <Input type="number" {...common} />;
  if (field.type === "boolean") return (
    <button type="button" onClick={() => onChange(!value)} className={`flex items-center gap-2 text-sm ${value ? "text-accent" : "text-muted-foreground"}`}>
      <span className={`h-5 w-9 rounded-full transition-colors ${value ? "bg-accent" : "bg-secondary"}`}>
        <span className={`block h-4 w-4 mt-0.5 ml-0.5 rounded-full bg-white transition-transform ${value ? "translate-x-4" : ""}`} />
      </span>
      {value ? "Yes" : "No"}
    </button>
  );
  if (field.type === "select") return (
    <select {...common} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
      <option value="">Select…</option>
      {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
  if (field.type === "array") return <Textarea {...common} rows={2} placeholder="Comma-separated" onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />;
  return <Input {...common} />;
}

export default function EntityCollection({ entityName, fields, title, emptyTitle, emptyDescription, renderSummary, sortBy }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities[entityName].list(sortBy);
      setItems(data);
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [entityName]);

  const startNew = () => { setEditing(null); setForm({}); setOpen(true); };
  const startEdit = (item) => { setEditing(item); setForm({ ...item }); setOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {};
      fields.forEach((f) => { if (form[f.name] !== undefined) payload[f.name] = form[f.name]; });
      if (editing) await base44.entities[entityName].update(editing.id, payload);
      else await base44.entities[entityName].create(payload);
      setOpen(false);
      await load();
    } catch (e) { /* ignore */ }
    setSaving(false);
  };

  const remove = async (id) => {
    await base44.entities[entityName].delete(id);
    await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg font-semibold">{title}</h3>
        <Button size="sm" variant="outline" onClick={startNew} className="rounded-full">
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <Card className="p-6"><EmptyState title={emptyTitle} description={emptyDescription} /></Card>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <Card key={item.id} className="p-4 group">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {renderSummary ? renderSummary(item) : (
                    <div>
                      <div className="font-medium text-sm">{item[fields[0].name]}</div>
                      {fields[1] && item[fields[1].name] && <div className="text-xs text-muted-foreground mt-0.5">{item[fields[1].name]}</div>}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${title}` : `Add ${title}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {fields.map((f) => (
              <div key={f.name}>
                <Label className="mb-1.5 block text-sm">{f.label || f.name}</Label>
                <FieldInput field={f} value={form[f.name]} onChange={(v) => setForm({ ...form, [f.name]: v })} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}