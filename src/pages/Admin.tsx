import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, LogOut, Link as LinkIcon, Upload, X, CalendarIcon } from "lucide-react";
import ProjectReadiness from "@/components/ProjectReadiness";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  important_info: string;
  contacts: Contact[];
  created_at: string;
  status_text: string;
  status_updated_at: string | null;
  status_updated_by: string;
  public_slug: string | null;
  is_public: boolean;
  start_date: string | null;
  end_date: string | null;
  timeline: string;
  access_info: string;
  documents: unknown[];
  image_count?: number;
}

const emptyForm = {
  title: "",
  company: "",
  address: "",
  directions: "",
  practical_info: "",
  important_info: "",
  contacts: [] as Contact[],
  start_date: null as string | null,
  end_date: null as string | null,
  timeline: "",
  access_info: "",
  documents: [] as ProjectDocument[],
};

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<typeof emptyForm & { id?: string }>(emptyForm);
  const [savedLink, setSavedLink] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  async function fetchProjects() {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (!data) return;

    const ids = data.map((p: any) => p.id);
    const counts: Record<string, number> = {};
    if (ids.length > 0) {
      const { data: posts } = await supabase
        .from("posts")
        .select("project_id")
        .in("project_id", ids);
      posts?.forEach((row: any) => {
        counts[row.project_id] = (counts[row.project_id] ?? 0) + 1;
      });
    }

    setProjects(
      data.map((p: any) => ({
        ...p,
        contacts: (p.contacts as unknown as Contact[]) ?? [],
        documents: Array.isArray(p.documents) ? p.documents : [],
        image_count: counts[p.id] ?? 0,
      }))
    );
  }

  useEffect(() => {
    if (user) fetchProjects();
  }, [user]);

  function editProject(project: Project) {
    setForm({
      ...project,
      important_info: project.important_info ?? "",
      documents: (project.documents as unknown as ProjectDocument[]) ?? [],
    });
    setSavedLink(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addContact() {
    setForm((f) => ({
      ...f,
      contacts: [...f.contacts, { role: "", name: "", phone: "" }],
    }));
  }

  function removeContact(i: number) {
    setForm((f) => ({
      ...f,
      contacts: f.contacts.filter((_, idx) => idx !== i),
    }));
  }

  function updateContact(i: number, field: keyof Contact, value: string) {
    setForm((f) => ({
      ...f,
      contacts: f.contacts.map((c, idx) =>
        idx === i ? { ...c, [field]: value } : c
      ),
    }));
  }

  async function save() {
    setSavedLink(null);

    const payload = {
      title: form.title,
      company: form.company,
      address: form.address,
      directions: form.directions,
      practical_info: form.practical_info,
      important_info: form.important_info,
      contacts: JSON.parse(JSON.stringify(form.contacts)),
      start_date: form.start_date,
      end_date: form.end_date,
      timeline: form.timeline,
      access_info: form.access_info,
      documents: JSON.parse(JSON.stringify(form.documents)),
    };

    if (form.id) {
      await supabase.from("projects").update(payload).eq("id", form.id);
      setSavedLink(`${window.location.origin}/project/${form.id}`);
    } else {
      const { data } = await supabase.from("projects").insert(payload).select().single();
      if (data) {
        setSavedLink(`${window.location.origin}/project/${(data as any).id}`);
      }
    }

    setForm({ ...emptyForm, contacts: [] });
    fetchProjects();
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    const uploaded: ProjectDocument[] = [];
    for (const file of files) {
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
      const { error } = await supabase.storage.from("project-documents").upload(path, file);
      if (error) {
        toast({ title: "Uppladdning misslyckades", description: error.message });
        continue;
      }
      const { data } = supabase.storage.from("project-documents").getPublicUrl(path);
      uploaded.push({ name: file.name, url: data.publicUrl, path });
    }
    setForm((f) => ({ ...f, documents: [...f.documents, ...uploaded] }));
    setUploading(false);
    e.target.value = "";
  }

  async function removeDocument(idx: number) {
    const doc = form.documents[idx];
    if (doc?.path) {
      await supabase.storage.from("project-documents").remove([doc.path]);
    }
    setForm((f) => ({ ...f, documents: f.documents.filter((_, i) => i !== idx) }));
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Laddar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Admin</h1>
          <button onClick={signOut} className="inline-flex items-center gap-1 text-xs text-muted-foreground underline">
            <LogOut className="h-3 w-3" /> Logga ut
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Projektnamn</label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Företag</label>
            <Input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Adress</label>
            <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Vägbeskrivning</label>
            <Textarea value={form.directions} onChange={(e) => setForm((f) => ({ ...f, directions: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Praktisk information</label>
            <Textarea value={form.practical_info} onChange={(e) => setForm((f) => ({ ...f, practical_info: e.target.value }))} rows={5} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Viktigt</label>
            <Textarea
              value={form.important_info}
              onChange={(e) => setForm((f) => ({ ...f, important_info: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Startdatum</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.start_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.start_date ? format(new Date(form.start_date), "yyyy-MM-dd") : "Välj datum"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.start_date ? new Date(form.start_date) : undefined}
                  onSelect={(d) =>
                    setForm((f) => ({
                      ...f,
                      start_date: d ? format(d, "yyyy-MM-dd") : null,
                    }))
                  }
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Slutdatum</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.end_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.end_date ? format(new Date(form.end_date), "yyyy-MM-dd") : "Välj datum"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.end_date ? new Date(form.end_date) : undefined}
                  onSelect={(d) =>
                    setForm((f) => ({
                      ...f,
                      end_date: d ? format(d, "yyyy-MM-dd") : null,
                    }))
                  }
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Tidsplan</label>
            <Textarea
              value={form.timeline}
              onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}
              rows={4}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Tillträdesinformation</label>
            <Textarea
              value={form.access_info}
              onChange={(e) => setForm((f) => ({ ...f, access_info: e.target.value }))}
              rows={4}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Dokument (PDF eller bilder)</label>
            <div className="space-y-2">
              {form.documents.map((d, i) => (
                <div key={i} className="flex items-center justify-between rounded border border-border bg-muted px-3 py-2 text-sm">
                  <a href={d.url} target="_blank" rel="noreferrer" className="truncate text-foreground underline">
                    {d.name}
                  </a>
                  <Button variant="ghost" size="icon" onClick={() => removeDocument(i)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-border px-3 py-3 text-sm text-muted-foreground hover:bg-muted">
                <Upload className="h-4 w-4" />
                {uploading ? "Laddar upp..." : "Lägg till filer"}
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          <Separator />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm text-muted-foreground">Kontakter</label>
              <Button variant="ghost" size="sm" onClick={addContact}>
                <Plus className="mr-1 h-3 w-3" /> Lägg till
              </Button>
            </div>
            {form.contacts.map((c, i) => (
              <div key={i} className="mb-2 flex gap-2">
                <Input placeholder="Roll" value={c.role} onChange={(e) => updateContact(i, "role", e.target.value)} className="flex-1" />
                <Input placeholder="Namn" value={c.name} onChange={(e) => updateContact(i, "name", e.target.value)} className="flex-1" />
                <Input placeholder="Telefon" value={c.phone} onChange={(e) => updateContact(i, "phone", e.target.value)} className="flex-1" />
                <Button variant="ghost" size="icon" onClick={() => removeContact(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button onClick={save} disabled={!form.title} className="w-full">
            Spara projekt
          </Button>

          {savedLink && (
            <div className="rounded border border-border bg-muted p-3 text-sm">
              <p className="mb-1 text-muted-foreground">Projektlänk:</p>
              <a href={savedLink} className="break-all text-foreground underline">{savedLink}</a>
            </div>
          )}
        </div>

        <Separator className="my-8" />

        <h2 className="mb-4 text-lg font-semibold text-foreground">Projekt</h2>
        {projects.length === 0 && <p className="text-sm text-muted-foreground">Inga projekt ännu.</p>}
        {projects.map((p) => (
          <div key={p.id} className="mb-4 border-b border-border pb-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{p.title}</p>
                <p className="text-sm text-muted-foreground">{p.company}</p>
              </div>
              <div className="flex items-center gap-2">
                {p.public_slug && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const url = `${window.location.origin}/p/${p.public_slug}`;
                      navigator.clipboard.writeText(url);
                      toast({ title: "Publik länk kopierad" });
                    }}
                  >
                    <LinkIcon className="mr-1 h-3 w-3" /> 📎
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => editProject(p)}>Redigera</Button>
              </div>
            </div>
            <ProjectReadiness project={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
