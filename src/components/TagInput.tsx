import { useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}

export function TagInput({ value, onChange, placeholder = "Add tag, press Enter…" }: Props) {
  const [draft, setDraft] = useState("");

  const add = (t: string) => {
    const tag = t.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 30);
    if (!tag || value.includes(tag) || value.length >= 8) return;
    onChange([...value, tag]);
    setDraft("");
  };

  const remove = (t: string) => onChange(value.filter((x) => x !== t));

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md border bg-background p-1.5">
      {value.map((t) => (
        <Badge key={t} variant="secondary" className="gap-1 pl-2 pr-1">
          {t}
          <button
            type="button"
            onClick={() => remove(t)}
            className="rounded p-0.5 hover:bg-muted"
            aria-label={`Remove ${t}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => draft && add(draft)}
        placeholder={value.length ? "" : placeholder}
        className="h-7 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
      />
    </div>
  );
}
