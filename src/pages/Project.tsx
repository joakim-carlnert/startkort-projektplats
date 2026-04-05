import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatSwedishDate } from "@/lib/formatSwedishDate";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Check } from "lucide-react";

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

const ROLES = [
  "Snickare", "Elektriker", "VVS", "Målare",
  "Plattsättare", "Golvläggare", "UE", "Arbetsledning", "Annat…",
];

export default function ProjectPage({ isAdmin = false }) {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
 

  const [project, setProject] = useState<Project | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [showPostDialog, setShowPostDialog] = useState(false);
  const [questionText, setQuestionText] = useState("");

  // Post form state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [postText, setPostText] = useState("");
  const [postRole, setPostRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [isDone, setIsDone] = useState(false);

  async function fetchProject() {
    if (!id) return;
    const { data } = await supabase.from("projects").select("*").eq("id", id).single();
    if (data) {
      setProject({ ...data, contacts: (data.contacts as unknown as Contact[]) ?? [] });
    }
  }

  async function fetchPosts() {
    if (!id) return;
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false });
    if (data) setPosts(data);
  }

  async function fetchQuestions() {
    if (!id) return;
    const { data } = await supabase
      .from("questions")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false });
    if (data) setQuestions(data);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([fetchProject(), fetchPosts(), fetchQuestions()]);
      setLoading(false);
    }
    load();
  }, [id]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function publishPost() {
    if (!id) return;
    const finalRole = postRole === "Annat…" ? customRole : postRole;

    // Upload image to storage
    const fileName = `${id}/${crypto.randomUUID()}-${imageFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(fileName, imageFile);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("post-images")
      .getPublicUrl(fileName);

    await supabase.from("posts").insert({
      project_id: id,
      image_url: urlData.publicUrl,
      text: postText || null,
      role: finalRole,
      is_done: isDone,
    });

    setImageFile(null);
    setImagePreview(null);
    setPostText("");
    setPostRole("");
    setCustomRole("");
    setIsDone(false);
    setShowPostDialog(false);
    fetchPosts();
  }

  async function submitQuestion() {
    if (!questionText.trim() || !id) return;
    await supabase.from("questions").insert({
      project_id: id,
      text: questionText.trim(),
    });
    setQuestionText("");
    fetchQuestions();
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
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Startkort</h1>
          <p className="text-xl font-semibold text-foreground">{project.title}</p>
          <p className="text-sm text-muted-foreground">{project.company}</p>
          <p className="text-sm text-muted-foreground">{project.address}</p>
        </div>
        

         <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
    <span className="h-2 w-2 rounded-full bg-red-500"></span>
    LÄGET JUST NU
  </div>

  <p className="mt-2 text-base font-medium text-foreground">
    {posts.length > 0 ? posts[0].text || "Se senaste uppdatering" : "Ingen status"}
  </p>

  {posts.length > 0 && (
    <p className="mt-1 text-xs text-muted-foreground">
      Senast uppdaterad: {formatSwedishDate(posts[0].created_at)}
    </p>
  )}

  <Button
    size="sm"
    onClick={() => setShowPostDialog(true)}
    className="mt-3 bg-white/70 hover:bg-white text-foreground border border-blue-100"
  >
    Uppdatera läget
  </Button>
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

        {/* Post button */}
        
  <div className="py-6 text-center">
    <Button variant="outline" onClick={() => setShowPostDialog(true)} className="gap-2">
      <Camera className="h-4 w-4" /> Lägg upp uppdatering
    </Button>
  </div>


        <Separator />

        {/* Uppdateringar */}
        <section className="py-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">Uppdateringar</h2>
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga uppdateringar ännu.</p>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <div key={post.id}>
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
          {questions.length === 0 ? (
            <p className="mb-4 text-sm text-muted-foreground">Inga frågor ännu.</p>
          ) : (
            <div className="mb-4 space-y-3">
              {questions.map((q) => (
                <div key={q.id}>
                  <p className="text-sm text-foreground">{q.text}</p>
                  <p className="text-xs text-muted-foreground">{formatSwedishDate(q.created_at)}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input placeholder="Skriv en fråga..." value={questionText} onChange={(e) => setQuestionText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitQuestion()} />
            <Button variant="outline" onClick={submitQuestion} disabled={!questionText.trim()}>Ställ fråga</Button>
          </div>
        </section>
      </div>

      {/* Post Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lägg upp uppdatering</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!imagePreview ? (
              <label className="flex h-40 cursor-pointer items-center justify-center rounded border border-dashed border-border text-sm text-muted-foreground">
                <div className="text-center">
                  <Camera className="mx-auto mb-2 h-6 w-6" />
                  <span>Ta foto eller välj bild</span>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            ) : (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full rounded" />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute right-2 top-2 rounded bg-background/80 px-2 py-1 text-xs text-foreground">Byt bild</button>
              </div>
            )}

            <Textarea placeholder="Lägg till info (valfritt)" value={postText} onChange={(e) => setPostText(e.target.value)} />

            <Select value={postRole} onValueChange={setPostRole}>
              <SelectTrigger><SelectValue placeholder="Välj roll" /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
              </SelectContent>
            </Select>

            {postRole === "Annat…" && (
              <Input placeholder="Ange roll" value={customRole} onChange={(e) => setCustomRole(e.target.value)} />
            )}

            <div className="flex items-center gap-2">
              <Checkbox id="is-done" checked={isDone} onCheckedChange={(v) => setIsDone(v === true)} />
              <label htmlFor="is-done" className="text-sm text-foreground">Markera som klart</label>
            </div>

            <Button 
  onClick={publishPost} 
  disabled={!postRole || (postRole === "Annat…" && !customRole)} 
  className="w-full"
>
  Publicera
</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
