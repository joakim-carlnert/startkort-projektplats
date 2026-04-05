import { useState, useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatSwedishDate } from "@/lib/formatSwedishDate";
import { useToast } from "@/hooks/use-toast";

interface ProjectStatusBarProps {
  projectId: string;
  statusText: string;
  statusUpdatedAt: string | null;
  statusUpdatedBy: string;
  user: User | null;
  onStatusUpdated: (text: string, updatedAt: string, updatedBy: string) => void;
}

function getIndicatorColor(updatedAt: string | null): string {
  if (!updatedAt) return "bg-destructive";
  const hours = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60);
  if (hours <= 8) return "bg-green-500";
  if (hours <= 24) return "bg-yellow-500";
  return "bg-destructive";
}

export default function ProjectStatusBar({
  projectId,
  statusText,
  statusUpdatedAt,
  statusUpdatedBy,
  user,
  onStatusUpdated,
}: ProjectStatusBarProps) {
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editOpen) {
      setDraft(statusText);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [editOpen, statusText]);

  useEffect(() => {
    if (flash) {
      const t = setTimeout(() => setFlash(false), 1200);
      return () => clearTimeout(t);
    }
  }, [flash]);

  async function handleSave() {
    setSaving(true);
    const now = new Date().toISOString();
    const by = user?.email ?? "";

    const { error } = await supabase
      .from("projects")
      .update({
        status_text: draft,
        status_updated_at: now,
        status_updated_by: by,
      })
      .eq("id", projectId);

    if (error) {
      toast({ title: "Kunde inte spara", description: error.message, variant: "destructive" });
    } else {
      onStatusUpdated(draft, now, by);
      setEditOpen(false);
      setFlash(true);
    }
    setSaving(false);
  }

  const dotColor = getIndicatorColor(statusUpdatedAt);
  const isEmpty = !statusText;

  return (
    <>
      <div
        className={`rounded-lg border border-border bg-muted p-5 transition-colors duration-700 ${
          flash ? "bg-green-100 dark:bg-green-900/30" : ""
        }`}
      >
        {/* Heading with indicator */}
        <div className="mb-3 flex items-center gap-2">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${dotColor}`} />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Läget just nu
          </h2>
        </div>

        {/* Status text */}
        {isEmpty ? (
          <p className="mb-3 text-sm italic text-muted-foreground">
            Ingen lägesuppdatering ännu.
          </p>
        ) : (
          <p className="mb-3 text-base leading-relaxed text-foreground line-clamp-3">
            {statusText}
          </p>
        )}

        {/* Meta row */}
        {!isEmpty && statusUpdatedAt && (
          <p className="mb-3 text-xs text-muted-foreground">
            Senast uppdaterat av {statusUpdatedBy} • {formatSwedishDate(statusUpdatedAt)}
          </p>
        )}

        {/* Action button */}
        {user && (
          <Button
            variant={isEmpty ? "default" : "outline"}
            size="sm"
            onClick={() => setEditOpen(true)}
          >
            {isEmpty ? "Skriv första läget" : "Uppdatera läget"}
          </Button>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Uppdatera läget</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 300))}
              placeholder="Skriv kort vad som gäller just nu i projektet. Detta kan ändras senare."
              className="min-h-[120px] resize-none"
              maxLength={300}
            />
            <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
              {draft.length}/300
            </span>
          </div>
          <DialogFooter className="sticky bottom-0 gap-2 bg-background pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Sparar..." : "Spara"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
