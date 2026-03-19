import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

interface PostData {
  id: string;
  project_id: string;
  image_url: string;
  text: string | null;
  role: string;
  is_done: boolean;
  created_at: string;
}

interface QuickEventButtonProps {
  projectId: string;
  user: User;
  onPosted: (post: PostData) => void;
}

export default function QuickEventButton({ projectId, user, onPosted }: QuickEventButtonProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setOpen(true);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  function handleCancel() {
    setOpen(false);
    setFile(null);
    setPreviewUrl(null);
    setText("");
  }

  async function handlePost() {
    if (!file) return;
    setLoading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `${projectId}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Uppladdning misslyckades", description: uploadError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(filePath);

    const newPost = {
      project_id: projectId,
      image_url: urlData.publicUrl,
      role: "",
      text: text.trim() || null,
      is_done: false,
    };

    const { data, error } = await supabase.from("posts").insert(newPost).select().single();

    if (error) {
      toast({ title: "Kunde inte spara", description: error.message, variant: "destructive" });
    } else if (data) {
      onPosted(data);
      toast({ title: "Uppdatering publicerad" });
      handleCancel();
    }
    setLoading(false);
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pb-6">
        <Button
          onClick={() => fileRef.current?.click()}
          className="w-full max-w-lg rounded-full shadow-lg text-base py-6"
          size="lg"
        >
          ➕ Uppdatera projekt
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleCancel(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ny uppdatering</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Förhandsvisning"
              className="w-full max-h-64 rounded-md object-cover"
            />
          )}
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Skriv kort vad som hänt (valfritt)"
            autoFocus
          />
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={handleCancel} disabled={loading}>
              Avbryt
            </Button>
            <Button onClick={handlePost} disabled={loading}>
              {loading ? "Postar..." : "Posta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
