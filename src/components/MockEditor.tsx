import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagInput } from "./TagInput";
import type { MockRecord, MockType, Difficulty } from "@/lib/mock-history";

interface Props {
  open: boolean;
  record: MockRecord | null;
  onOpenChange: (v: boolean) => void;
  onSave: (updated: MockRecord) => Promise<void> | void;
}

const TYPES: MockType[] = ["Full", "Sectional", "Revision", "Surprise"];
const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard", "Brutal"];

export function MockEditor({ open, record, onOpenChange, onSave }: Props) {
  const [draft, setDraft] = useState<MockRecord | null>(record);

  useEffect(() => setDraft(record), [record]);

  if (!draft) return null;

  const set = <K extends keyof MockRecord>(k: K, v: MockRecord[K]) =>
    setDraft({ ...draft, [k]: v });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Edit mock</DialogTitle>
          <DialogDescription>
            Update label, date, source, tags or notes. Section scores stay the same.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Label</Label>
            <Input value={draft.label} onChange={(e) => set("label", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Mock date</Label>
              <Input
                type="date"
                value={draft.mockDate}
                onChange={(e) => set("mockDate", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Source / test series</Label>
              <Input
                placeholder="LegalEdge, CL…"
                value={draft.source ?? ""}
                onChange={(e) => set("source", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Type</Label>
              <Select
                value={draft.mockType ?? ""}
                onValueChange={(v) => set("mockType", v as MockType)}
              >
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Difficulty</Label>
              <Select
                value={draft.difficulty ?? ""}
                onValueChange={(v) => set("difficulty", v as Difficulty)}
              >
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Tags</Label>
            <TagInput value={draft.tags} onChange={(v) => set("tags", v)} />
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea
              rows={3}
              placeholder="Reflections, what went wrong, what to fix…"
              value={draft.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              await onSave(draft);
              onOpenChange(false);
            }}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
