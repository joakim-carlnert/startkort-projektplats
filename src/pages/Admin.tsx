import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, LogOut, Link as LinkIcon } from "lucide-react";

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
  public_slug: string | null;
  is_public: boolean;
}

const emptyForm = {
  title: "",
  company: "",
  address: "",
  directions: "",
  practical_info: "",
  contacts: [] as Contact[],
};

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<typeof emptyForm & { id?: string }>(emptyForm);
  const [savedLink, setSavedLink] = useState<string | null>(null);

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
    if (data) {
      setProjects(
        data.map((p: any) => ({ ...p, contacts: (p.contacts as unknown as Contact[]) ?? [] }))
      );
    }
  }

  useEffect(() => {
    if (user) fetchProjects();
  }, [user]);

  function editProject(project: Project) {
    setForm({ ...project });
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
      contacts: JSON.parse(JSON.stringify(form.contacts)),
    };

    if (form.id) {
      await supabase.from("projects").update(payload).eq("id", form.id);
      setSavedLink(`${window.location.origin}/project/${form.id}`);
    } else {
      const { data } = await supabase.from("projects").insert(payload).select().single();
      if (data) {
        setSavedLink(`${window.location.origin}/project/${data.id}`);
      }
    }

    setForm({ ...emptyForm, contacts: [] });
    fetchProjects();
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
          <div key={p.id} className="mb-3 border-b border-border pb-3">
            <div className="flex items-center justify-between">
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
          </div>
        ))}
      </div>
    </div>
  );
}
