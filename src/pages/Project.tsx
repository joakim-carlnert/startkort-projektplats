import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatSwedishDate } from "@/lib/formatSwedishDate";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, Plus, LogOut, Send, MoreVertical, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProjectStatusBar from "@/components/ProjectStatusBar";
import QuickEventButton from "@/components/QuickEventButton";

interface Contact {
  role: string;
  name: string;
  phone: string;
}

interface Project {
  id: string;
  title: string;
  company: string;
  address: string;
  directions: string;
  practical_info: string;
  contacts: Contact[];
  created_at: string;
  status_text: string;
  status_updated_at: string | null;
  status_updated_by: string;
}

interface Post {
  id: string;
  project_id: string;
  image_url: string;
  text: string | null;
  role: string;
  is_done: boolean;
  created_at: string;
}

interface Question {
  id: string;
  project_id: string;
  text: string;
  created_at: string;
}

function extractStoragePath(imageUrl: string): string | null {
  const marker = "/object/public/post-images/";
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return null;
  return imageUrl.substring(idx + marker.length);
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // New update form state
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateRole, setUpdateRole] = useState("");
  const [updateText, setUpdateText] = useState("");
  const [updateIsDone, setUpdateIsDone] = useState(false);
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  // New question form state
  const [questionText, setQuestionText] = useState("");
  const [questionLoading, setQuestionLoading] = useState(false);

  // Delete confirmation state
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    const [projectRes, postsRes, questionsRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("posts").select("*").eq("project_id", id).order("created_at", { ascending: false }),
      supabase.from("questions").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    ]);
    if (projectRes.data) {
      setProject({ ...projectRes.data, contacts: (projectRes.data.contacts as unknown as Contact[]) ?? [] });
    }
    if (postsRes.data) setPosts(postsRes.data);
    if (questionsRes.data) setQuestions(questionsRes.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  function handleDeletePost(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  async function confirmDeletePost() {
    if (!deletePostId) return;
    const post = posts.find((p) => p.id === deletePostId);
    if (!post) return;

    // Optimistic removal
    handleDeletePost(deletePostId);
    setDeletePostId(null);

    const storagePath = extractStoragePath(post.image_url);
    await supabase.from("posts").delete().eq("id", post.id);
    if (storagePath) {
      await supabase.storage.from("post-images").remove([storagePath]);
    }
    toast({ title: "Uppdatering borttagen" });
  }

  async function handleCreateUpdate() {
    if (!id || !updateFile) return;
    setUpdateLoading(true);

    const fileExt = updateFile.name.split(".").pop();
    const filePath = `${id}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(filePath, updateFile);

    if (uploadError) {
      toast({ title: "Uppladdning misslyckades", description: uploadError.message, variant: "destructive" });
      setUpdateLoading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(filePath);

    const { error } = await supabase.from("posts").insert({
      project_id: id,
      image_url: urlData.publicUrl,
      role: updateRole,
      text: updateText || null,
      is_done: updateIsDone,
    });

    if (error) {
      toast({ title: "Kunde inte spara", description: error.message, variant: "destructive" });
    } else {
      setUpdateOpen(false);
      setUpdateRole("");
      setUpdateText("");
      setUpdateIsDone(false);
      setUpdateFile(null);
      load();
    }
    setUpdateLoading(false);
  }

  async function handleAskQuestion() {
    if (!id || !questionText.trim()) return;
    setQuestionLoading(true);

    const { error } = await supabase.from("questions").insert({
      project_id: id,
      text: questionText.trim(),
    });

    if (error) {
      toast({ title: "Kunde inte spara", description: error.message, variant: "destructive" });
    } else {
      setQuestionText("");
      load();
    }
    setQuestionLoading(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Laddar...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Projektet hittades inte.</p>
      </div>
    );
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.address)}`;

  return (
    <div className="min-h-screen bg-background">
      <div className={`mx-auto max-w-lg px-4 py-8 ${user ? "pb-24" : ""}`}>
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Startkort</h1>
          <p className="text-xl font-semibold text-foreground">{project.title}</p>
          <p className="text-sm text-muted-foreground">{project.company}</p>
          <p className="text-sm text-muted-foreground">{project.address}</p>
          {user && (
            <button onClick={signOut} className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground underline">
              <LogOut className="h-3 w-3" /> Logga ut
            </button>
          )}
        </div>

        {/* Status bar */}
        <div className="mb-6">
          <ProjectStatusBar
            projectId={project.id}
            statusText={project.status_text}
            statusUpdatedAt={project.status_updated_at}
            statusUpdatedBy={project.status_updated_by}
            user={user}
            onStatusUpdated={(text, at, by) =>
              setProject((p) => p ? { ...p, status_text: text, status_updated_at: at, status_updated_by: by } : p)
            }
          />
        </div>

        <Separator />

        {/* Hitta hit */}
        <section className="py-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">Hitta hit</h2>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mb-2 block text-sm text-foreground underline">{project.address}</a>
          {project.directions && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{project.directions}</p>}
        </section>

        <Separator />

        {/* Praktiskt */}
        {project.practical_info && (
          <>
            <section className="py-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">Praktiskt</h2>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{project.practical_info}</p>
            </section>
            <Separator />
          </>
        )}

        {/* Kontakt */}
        {project.contacts.length > 0 && (
          <>
            <section className="py-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">Kontakt</h2>
              <div className="space-y-1">
                {project.contacts.map((c, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="text-muted-foreground">{c.role}</span>
                    <span className="text-foreground">–</span>
                    <span className="text-foreground">{c.name}</span>
                    <span className="text-foreground">–</span>
                    <a href={`tel:${c.phone}`} className="text-foreground underline">{c.phone}</a>
                  </div>
                ))}
              </div>
            </section>
            <Separator />
          </>
        )}

        {/* Uppdateringar */}
        <section className="py-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Uppdateringar</h2>
            {user && (
              <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Plus className="mr-1 h-3 w-3" /> Ny uppdatering
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ny uppdatering</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm text-muted-foreground">Bild *</label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setUpdateFile(e.target.files?.[0] ?? null)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-muted-foreground">Roll</label>
                      <Input value={updateRole} onChange={(e) => setUpdateRole(e.target.value)} placeholder="T.ex. Elektriker" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-muted-foreground">Text (valfri)</label>
                      <Textarea value={updateText} onChange={(e) => setUpdateText(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={updateIsDone} onCheckedChange={setUpdateIsDone} />
                      <label className="text-sm text-muted-foreground">Klar</label>
                    </div>
                    <Button onClick={handleCreateUpdate} disabled={!updateFile || updateLoading} className="w-full">
                      {updateLoading ? "Sparar..." : "Publicera"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga uppdateringar ännu.</p>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <div key={post.id} className="relative">
                  {user && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 z-10 h-8 w-8 rounded-full bg-background/70 backdrop-blur-sm"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeletePostId(post.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Ta bort uppdatering
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <img src={post.image_url} alt="Uppdatering" className="mb-2 w-full rounded" loading="lazy" />
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-foreground">{post.role}</span>
                    {post.is_done && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Check className="h-3 w-3" /> Klar
                      </span>
                    )}
                  </div>
                  {post.text && <p className="mt-1 text-sm text-muted-foreground">{post.text}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{formatSwedishDate(post.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <Separator />

        {/* Frågor */}
        <section className="py-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">Frågor</h2>
          {user && (
            <div className="mb-4 flex gap-2">
              <Input
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Ställ en fråga..."
                onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
              />
              <Button size="icon" onClick={handleAskQuestion} disabled={!questionText.trim() || questionLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
          {questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga frågor ännu.</p>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <div key={q.id}>
                  <p className="text-sm text-foreground">{q.text}</p>
                  <p className="text-xs text-muted-foreground">{formatSwedishDate(q.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {user && (
        <QuickEventButton
          projectId={project.id}
          user={user}
          onPosted={(post) => setPosts((prev) => [post, ...prev])}
          onDeleted={handleDeletePost}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletePostId} onOpenChange={(open) => { if (!open) setDeletePostId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort uppdatering?</AlertDialogTitle>
            <AlertDialogDescription>
              Detta tar bort bilden och texten från projektets flöde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePost}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
