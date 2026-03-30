import { useState } from "react";
import { useSelectOptions, useAddSelectOption, useDeleteSelectOption } from "@/hooks/useSelectOptions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ListChecks } from "lucide-react";
import { toast } from "sonner";

const MANAGED_LISTS = [
  { name: "yeshiva", label: "ישיבות" },
  { name: "shiur", label: "שיעורים" },
];

export function ListManager() {
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const addOption = useAddSelectOption();
  const deleteOption = useDeleteSelectOption();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="h-5 w-5" />
          ניהול רשימות בחירה
        </CardTitle>
        <CardDescription>הוספה ומחיקה של ערכים ברשימות הנפתחות (לא כולל ערים)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {MANAGED_LISTS.map((list) => (
          <ListSection
            key={list.name}
            listName={list.name}
            label={list.label}
            newValue={newValues[list.name] || ""}
            onNewValueChange={(v) => setNewValues((prev) => ({ ...prev, [list.name]: v }))}
            onAdd={() => {
              const val = (newValues[list.name] || "").trim();
              if (!val) return;
              addOption.mutate({ listName: list.name, value: val }, {
                onSuccess: () => {
                  setNewValues((prev) => ({ ...prev, [list.name]: "" }));
                  toast.success(`"${val}" נוסף בהצלחה`);
                },
                onError: () => toast.error("שגיאה בהוספה"),
              });
            }}
            onDelete={(id, val) => {
              deleteOption.mutate(id, {
                onSuccess: () => toast.success(`"${val}" נמחק`),
              });
            }}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function ListSection({ listName, label, newValue, onNewValueChange, onAdd, onDelete }: {
  listName: string;
  label: string;
  newValue: string;
  onNewValueChange: (v: string) => void;
  onAdd: () => void;
  onDelete: (id: string, val: string) => void;
}) {
  const { data: options = [], isLoading } = useSelectOptions(listName);

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">{label}</h4>
      <div className="flex flex-wrap gap-2">
        {isLoading ? (
          <span className="text-xs text-muted-foreground">טוען...</span>
        ) : (
          options.map((o) => (
            <Badge key={o.id} variant="secondary" className="gap-1 text-sm">
              {o.value}
              <button onClick={() => onDelete(o.id, o.value)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={newValue}
          onChange={(e) => onNewValueChange(e.target.value)}
          placeholder={`הוסף ${label.slice(0, -2)}...`}
          className="max-w-[200px]"
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onAdd())}
        />
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
