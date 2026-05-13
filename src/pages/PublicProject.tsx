import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatSwedishDate } from "@/lib/formatSwedishDate";
import { Separator } from "@/components/ui/separator";
import { Check, FileText, Image, File } from "lucide-react";



interface Contact {
  role: string;
  name: string;
  phone: string;
}

interface ProjectDocument {
  name: string;
  url: string;
  path: string;
}

interface Project {
  id: string;
  title: string;
  company: string;
  address: string;
  directions: string;
  practical_info: string;
  access_info: string;
  timeline: string;
  important_info: string;
  contacts: Contact[];
  start_date: string | null;
  end_date: string | null;
  status_text: string;
  status_updated_at: string | null;
  status_updated_by: string;
  documents: ProjectDocument[];
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

function getIndicatorColor(updatedAt: string | null): string {
  if (!updatedAt) return "bg-destructive";
  const hours = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60);
  if (hours <= 8) return "bg-green-500";
  if (hours <= 24) return "bg-yellow-500";
  return "bg-destructive";
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
        directions: p.directions ?? "",
        practical_info: p.practical_info ?? "",
        access_info: p.access_info ?? "",
        timeline: p.timeline ?? "",
        important_info: p.important_info ?? "",
        contacts: (p.contacts as unknown as Contact[]) ?? [],
        start_date: p.start_date ?? null,
        end_date: p.end_date ?? null,
        status_text: p.status_text ?? "",
        status_updated_at: p.status_updated_at ?? null,
        status_updated_by: p.status_updated_by ?? "",
        documents: (p.documents as unknown as ProjectDocument[]) ?? [],
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
  const importantInfo = project.important_info?.trim() ?? "";

  let deadlineCountdown: string | null = null;
  if (project.end_date) {
    const target = new Date(project.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
    if (diff > 1) deadlineCountdown = `${diff} dagar kvar`;
    else if (diff === 1) deadlineCountdown = "1 dag kvar";
    else if (diff === 0) deadlineCountdown = "Sista dagen";
    else deadlineCountdown = `${Math.abs(diff)} dagar försenat`;
  }

  function getDocumentIcon(name: string) {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff"].includes(ext)) {
      return <Image className="h-4 w-4 shrink-0 text-muted-foreground" />;
    }
    if (["pdf", "txt", "md", "doc", "docx"].includes(ext)) {
      return <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />;
    }
    return <File className="h-4 w-4 shrink-0 text-muted-foreground" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Project information + Deadline line */}
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Startkort</h1>
          <p className="text-xl font-semibold text-foreground">{project.title}</p>
          <p className="text-sm text-muted-foreground">{project.company}</p>
          <p className="text-sm text-muted-foreground">{project.address}</p>
          {(() => {
            const parts: string[] = [];
            const fmt = (s: string) => {
              const d = new Date(s);
              const months = ["jan","feb","mars","apr","maj","juni","juli","aug","sep","okt","nov","dec"];
              return `${d.getDate()} ${months[d.getMonth()]}`;
            };
            if (project.start_date) parts.push(`Start: ${fmt(project.start_date)}`);
            if (project.end_date) parts.push(`Deadline: ${fmt(project.end_date)}`);
            if (deadlineCountdown) parts.push(deadlineCountdown);
            return parts.length > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">{parts.join(" • ")}</p>
            ) : null;
          })()}
        </div>

        <Separator />

        {/* Läget just nu */}
        <section className="py-6">
          <div className="rounded-lg border border-border bg-muted p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${getIndicatorColor(project.status_updated_at)}`} />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Läget just nu</h2>
            </div>
            {!project.status_text ? (
              <p className="text-sm italic text-muted-foreground">Ingen lägesuppdatering ännu.</p>
            ) : (
              <>
                <p className="mb-3 text-base leading-relaxed text-foreground">{project.status_text}</p>
                {project.status_updated_at && (
                  <p className="text-xs text-muted-foreground">
                    Senast uppdaterat av {project.status_updated_by} • {formatSwedishDate(project.status_updated_at)}
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        <Separator />

        {/* 1. Viktigt */}
        {importantInfo && (
          <>
            <section className="py-6">
              <div className="border-l-2 border-foreground pl-4">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground">Viktigt</h2>
                <p className="whitespace-pre-wrap text-sm font-medium text-foreground">{project.important_info}</p>
              </div>
            </section>
            <Separator />
          </>
        )}

        {/* 2. Hitta hit */}
        <section className="py-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">Hitta hit</h2>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mb-2 block text-sm text-foreground underline">{project.address}</a>
          {project.directions && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{project.directions}</p>}
        </section>

        <Separator />

        {/* 3. Tillträdesinformation */}
        {project.access_info && (
          <>
            <section className="py-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">Tillträdesinformation</h2>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{project.access_info}</p>
            </section>
            <Separator />
          </>
        )}

        {/* 4. Praktisk information */}
        {project.practical_info && (
          <>
            <section className="py-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">Praktisk information</h2>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{project.practical_info}</p>
            </section>
            <Separator />
          </>
        )}

        {/* 5. Tidsplan */}
        {project.timeline && (
          <>
            <section className="py-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">Tidsplan</h2>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{project.timeline}</p>
            </section>
            <Separator />
          </>
        )}

        {/* 6. Dokument */}
        {project.documents.length > 0 && (
          <>
            <section className="py-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">Dokument</h2>
              <div className="space-y-2">
                {project.documents.map((doc, i) => (
                  <a
                    key={i}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-foreground underline"
                  >
                    {getDocumentIcon(doc.name)}
                    <span>{doc.name}</span>
                  </a>
                ))}
              </div>
            </section>
            <Separator />
          </>
        )}

        {/* 7. Kontakt */}
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

        {/* 8. Uppdateringar */}
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

        {/* 9. Frågor */}
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
