import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Contact {
  role?: string;
  name?: string;
  phone?: string;
}

export interface ReadinessProject {
  title?: string | null;
  address?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  contacts?: Contact[] | null;
  practical_info?: string | null;
  timeline?: string | null;
  access_info?: string | null;
  documents?: unknown[] | null;
  image_count?: number;
}

const LABELS = {
  title: "Projektnamn",
  address: "Adress",
  start_date: "Startdatum",
  end_date: "Slutdatum",
  contact_person: "Kontaktperson",
  phone: "Telefonnummer",
  practical_info: "Praktisk information",
  timeline: "Tidsplan",
  access_info: "Tillträdesinformation",
  images: "Bilder",
  documents: "Dokument",
} as const;

function nonEmpty(v?: string | null) {
  return !!(v && v.trim().length > 0);
}

export function computeReadiness(p: ReadinessProject) {
  const firstContact = p.contacts?.[0];
  const checks: Array<[keyof typeof LABELS, boolean]> = [
    ["title", nonEmpty(p.title)],
    ["address", nonEmpty(p.address)],
    ["start_date", nonEmpty(p.start_date)],
    ["end_date", nonEmpty(p.end_date)],
    ["contact_person", nonEmpty(firstContact?.name)],
    ["phone", nonEmpty(firstContact?.phone)],
    ["practical_info", nonEmpty(p.practical_info)],
    ["timeline", nonEmpty(p.timeline)],
    ["access_info", nonEmpty(p.access_info)],
    ["images", (p.image_count ?? 0) > 0],
    ["documents", Array.isArray(p.documents) && p.documents.length > 0],
  ];
  const completed = checks.filter(([, v]) => v).length;
  const percent = Math.round((completed / checks.length) * 100);
  const missing = checks.filter(([, v]) => !v).map(([k]) => LABELS[k]);
  return { percent, missing };
}

function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  return diff;
}

export default function ProjectReadiness({ project }: { project: ReadinessProject }) {
  const { percent, missing } = computeReadiness(project);

  const tone =
    percent >= 80
      ? { dot: "bg-green-500", text: "text-green-700 dark:text-green-400", bar: "[&>div]:bg-green-500" }
      : percent >= 50
        ? { dot: "bg-yellow-500", text: "text-yellow-700 dark:text-yellow-500", bar: "[&>div]:bg-yellow-500" }
        : { dot: "bg-red-500", text: "text-red-700 dark:text-red-400", bar: "[&>div]:bg-red-500" };

  const days = daysUntil(project.start_date);
  let summary = `Projektet är ${percent}% redo`;
  if (days !== null) {
    if (days > 1) summary += ` för start om ${days} dagar.`;
    else if (days === 1) summary += ` för start om 1 dag.`;
    else if (days === 0) summary += ` för start idag.`;
    else summary += ` (start för ${Math.abs(days)} dagar sedan).`;
  } else {
    summary += ".";
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", tone.dot)} aria-hidden />
          <p className={cn("truncate text-sm font-medium", tone.text)}>{summary}</p>
        </div>
        <span className={cn("text-sm font-semibold tabular-nums", tone.text)}>{percent}%</span>
      </div>

      <Progress value={percent} className={cn("h-2", tone.bar)} />

      {missing.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs text-muted-foreground">Saknas:</p>
          <ul className="flex flex-wrap gap-1.5">
            {missing.map((m) => (
              <li
                key={m}
                className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
