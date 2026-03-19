import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatSwedishDate } from "@/lib/formatSwedishDate";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";
import ProjectStatusBar from "@/components/ProjectStatusBar";

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
  status_text: string;
  status_updated_at: string | null;
  status_updated_by: string;
}

interface Post {
  id: string;
  image_url: string;
  text: string | null;
  role: string;
  is_done: boolean;
  created_at: string;
}

interface Question {
  id: string;
  text: string;
  created_at: string;
}

export default function PublicProject() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [notPublic, setNotPublic] = useState(false);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      setLoading(true);

      const { data: proj } = await (supabase
        .from("projects")
        .select("*") as any)
        .eq("public_slug", slug)
        .single();

      if (!proj || !(proj as any).is_public) {
        setNotPublic(true);
        setLoading(false);
        return;
      }

      const p = proj as any;
      setProject({
        id: p.id,
        title: p.title,
        company: p.company,
        address: p.address,
        directions: p.directions,
        practical_info: p.practical_info,
        contacts: (p.contacts as unknown as Contact[]) ?? [],
        status_text: p.status_text,
        status_updated_at: p.status_updated_at,
        status_updated_by: p.status_updated_by,
      });

      const [postsRes, questionsRes] = await Promise.all([
        supabase.from("posts").select("*").eq("project_id", p.id).order("created_at", { ascending: false }),
        supabase.from("questions").select("*").eq("project_id", p.id).order("created_at", { ascending: false }),
      ]);

      if (postsRes.data) setPosts(postsRes.data);
      if (questionsRes.data) setQuestions(questionsRes.data);
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Laddar...</p>
      </div>
    );
  }

  if (notPublic || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Detta projekt är inte publikt.</p>
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

        {/* Status bar — read-only (user=null hides edit) */}
        <div className="mb-6">
          <ProjectStatusBar
            projectId={project.id}
            statusText={project.status_text}
            statusUpdatedAt={project.status_updated_at}
            statusUpdatedBy={project.status_updated_by}
            user={null}
            onStatusUpdated={() => {}}
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
    </div>
  );
}
