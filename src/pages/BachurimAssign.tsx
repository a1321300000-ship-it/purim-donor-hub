import { useState, useMemo } from "react";
import { useBachurim } from "@/hooks/useBachurim";
import { useGroups, useGroupBachurAssignments, useAssignBachur, useUnassignBachur } from "@/hooks/useGroups";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, X, Users } from "lucide-react";
import { toast } from "sonner";

const TASK_TYPES = ['מת"א', 'י"ד', 'ט"ו', 'ליל ט"ו', 'טלפונים'];

export default function BachurimAssign() {
  const { data: bachurim = [] } = useBachurim();
  const { data: groups = [] } = useGroups();
  const { data: assignments = [] } = useGroupBachurAssignments();
  const assignBachur = useAssignBachur();
  const unassignBachur = useUnassignBachur();

  const [mission, setMission] = useState<string>("");
  const [bachurSearch, setBachurSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");

  // Groups in selected mission
  const missionGroups = useMemo(() => groups.filter((g) => g.task_type === mission), [groups, mission]);
  const missionGroupIds = useMemo(() => new Set(missionGroups.map((g) => g.id)), [missionGroups]);

  // Assignments for selected mission only
  const missionAssignments = useMemo(
    () => assignments.filter((a) => missionGroupIds.has(a.group_id)),
    [assignments, missionGroupIds]
  );

  // Bachurim already assigned WITHIN this mission
  const assignedInMission = useMemo(
    () => new Set(missionAssignments.map((a) => a.bachur_id)),
    [missionAssignments]
  );

  const availableBachurim = useMemo(() => {
    const q = bachurSearch.trim();
    return bachurim
      .filter((b) => !assignedInMission.has(b.id))
      .filter((b) => !q || b.first_name.includes(q) || b.last_name.includes(q) || b.full_name.includes(q));
  }, [bachurim, assignedInMission, bachurSearch]);

  const filteredGroups = useMemo(() => {
    const q = groupSearch.trim();
    return q ? missionGroups.filter((g) => g.name.includes(q) || g.task_type.includes(q)) : missionGroups;
  }, [missionGroups, groupSearch]);

  const bachurMap = useMemo(() => new Map(bachurim.map((b) => [b.id, b])), [bachurim]);

  const assignmentsByGroup = useMemo(() => {
    const map = new Map<number, typeof missionAssignments>();
    missionAssignments.forEach((a) => {
      const arr = map.get(a.group_id) || [];
      arr.push(a);
      map.set(a.group_id, arr);
    });
    return map;
  }, [missionAssignments]);

  const handleAssign = (groupId: number, bachurId: number) => {
    assignBachur.mutate(
      { group_id: groupId, bachur_id: bachurId },
      { onSuccess: () => toast.success("שויך"), onError: () => toast.error("שגיאה בשיוך") }
    );
  };

  const handleUnassign = (assignmentId: number) => {
    unassignBachur.mutate(assignmentId, {
      onSuccess: () => toast.success("הוסר"),
      onError: () => toast.error("שגיאה בהסרה"),
    });
  };

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="pt-4 flex items-end gap-3 flex-wrap">
          <div className="space-y-1">
            <Label>משימה</Label>
            <Select value={mission} onValueChange={setMission}>
              <SelectTrigger className="w-40"><SelectValue placeholder="בחר משימה..." /></SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs text-muted-foreground pb-2">
            {missionGroups.length} קבוצות במשימה זו · בחורים יכולים להיות משובצים במשימות שונות במקביל
          </div>
        </CardContent>
      </Card>

      {!mission ? (
        <div className="text-center py-16 text-muted-foreground border rounded-lg bg-muted/20">
          בחר משימה כדי להציג קבוצות ובחורים זמינים
        </div>
      ) : (
        {/* Available bachurim */}
        <Card className="h-fit lg:sticky lg:top-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> פנויים ב-{mission} ({availableBachurim.length})
            </CardTitle>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pr-7 h-8 text-sm"
                placeholder="חיפוש לפי שם..."
                value={bachurSearch}
                onChange={(e) => setBachurSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="max-h-[70vh] overflow-y-auto p-2">
            {availableBachurim.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">אין בחורים פנויים</p>
            ) : (
              <div className="space-y-1">
                {availableBachurim.map((b) => (
                  <div key={b.id} className="text-sm border rounded-md px-2 py-1.5 bg-card">
                    <div className="font-medium">{b.full_name || "—"}</div>
                    {b.yeshiva && <div className="text-xs text-muted-foreground">{b.yeshiva}</div>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Group cards */}
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="h-4 w-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pr-8" placeholder="חיפוש קבוצה..." value={groupSearch} onChange={(e) => setGroupSearch(e.target.value)} />
          </div>

          {filteredGroups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">אין קבוצות במשימה זו.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredGroups.map((g) => {
                const groupAssignments = assignmentsByGroup.get(g.id) || [];
                return (
                  <Card key={g.id} className="flex flex-col">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center justify-between gap-2">
                        <span className="truncate">{g.name}</span>
                        <span className="text-xs font-normal text-muted-foreground shrink-0">{g.task_type} · {g.transport_type || "—"}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex flex-wrap gap-1 min-h-[32px]">
                        {groupAssignments.length === 0 && (
                          <span className="text-xs text-muted-foreground">לא שויכו בחורים</span>
                        )}
                        {groupAssignments.map((a) => {
                          const b = bachurMap.get(a.bachur_id);
                          return (
                            <span key={a.id} className="inline-flex items-center gap-1 bg-primary/10 rounded-full px-2 py-0.5 text-xs">
                              {b?.full_name || `#${a.bachur_id}`}
                              <button
                                onClick={() => handleUnassign(a.id)}
                                className="hover:text-destructive"
                                title="הסר"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                      {availableBachurim.length > 0 && (
                        <div className="border-t pt-2">
                          <div className="text-xs text-muted-foreground mb-1">הוסף בחור:</div>
                          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                            {availableBachurim.map((b) => (
                              <Button
                                key={b.id}
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => handleAssign(g.id, b.id)}
                                disabled={assignBachur.isPending}
                              >
                                <Plus className="h-3 w-3 ml-1" />
                                {b.full_name || `#${b.id}`}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
