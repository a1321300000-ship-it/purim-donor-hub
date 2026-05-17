import { useState, useMemo, useRef, useEffect } from "react";
import { useBachurim } from "@/hooks/useBachurim";
import { useGroups, useGroupBachurAssignments, useAssignBachur, useUnassignBachur } from "@/hooks/useGroups";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Search, Users, ChevronDown, X, Check } from "lucide-react";
import { toast } from "sonner";

const TASK_TYPES = ['מת"א', 'י"ד', 'ט"ו', 'ליל ט"ו', 'טלפונים'];
const PAGE_SIZE = 60;
type StatusFilter = "all" | "available" | "assigned";

export default function BachurimAssign() {
  const { data: bachurim = [] } = useBachurim();
  const { data: groups = [] } = useGroups();
  const { data: assignments = [] } = useGroupBachurAssignments();
  const assignBachur = useAssignBachur();
  const unassignBachur = useUnassignBachur();

  const [mission, setMission] = useState<string>("");
  const [bachurSearch, setBachurSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const scrollRef = useRef<HTMLDivElement>(null);

  const missionGroups = useMemo(() => groups.filter((g) => g.task_type === mission), [groups, mission]);
  const missionGroupIds = useMemo(() => new Set(missionGroups.map((g) => g.id)), [missionGroups]);

  const missionAssignments = useMemo(
    () => assignments.filter((a) => missionGroupIds.has(a.group_id)),
    [assignments, missionGroupIds]
  );

  // Map: bachur_id -> assignment record (within selected mission)
  const assignmentByBachur = useMemo(() => {
    const m = new Map<number, { id: number; group_id: number }>();
    missionAssignments.forEach((a) => m.set(a.bachur_id, { id: a.id, group_id: a.group_id }));
    return m;
  }, [missionAssignments]);

  const groupNameMap = useMemo(() => new Map(missionGroups.map((g) => [g.id, g.name])), [missionGroups]);

  const filteredBachurim = useMemo(() => {
    const q = bachurSearch.trim();
    return bachurim
      .filter((b) => {
        const assigned = assignmentByBachur.has(b.id);
        if (statusFilter === "available" && assigned) return false;
        if (statusFilter === "assigned" && !assigned) return false;
        return true;
      })
      .filter((b) => !q || b.first_name?.includes(q) || b.last_name?.includes(q) || b.full_name?.includes(q));
  }, [bachurim, assignmentByBachur, statusFilter, bachurSearch]);

  // Reset visible count on filter change
  useEffect(() => { setVisibleCount(PAGE_SIZE); if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [bachurSearch, statusFilter, mission]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
      setVisibleCount((v) => Math.min(v + PAGE_SIZE, filteredBachurim.length));
    }
  };

  const visibleList = filteredBachurim.slice(0, visibleCount);

  const stats = useMemo(() => {
    const total = bachurim.length;
    const assigned = bachurim.filter((b) => assignmentByBachur.has(b.id)).length;
    return { total, assigned, available: total - assigned };
  }, [bachurim, assignmentByBachur]);

  const handleAssign = (bachurId: number, groupId: number) => {
    const existing = assignmentByBachur.get(bachurId);
    if (existing) {
      // Move: unassign first, then assign
      unassignBachur.mutate(existing.id, {
        onSuccess: () => {
          assignBachur.mutate({ bachur_id: bachurId, group_id: groupId }, {
            onSuccess: () => toast.success("הועבר לקבוצה"),
            onError: () => toast.error("שגיאה בשיוך"),
          });
        },
        onError: () => toast.error("שגיאה בהעברה"),
      });
    } else {
      assignBachur.mutate({ bachur_id: bachurId, group_id: groupId }, {
        onSuccess: () => toast.success("שויך"),
        onError: () => toast.error("שגיאה בשיוך"),
      });
    }
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
        <Card>
          <CardHeader className="pb-2 sticky top-0 z-10 bg-card border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> בחורים — {mission}
              <span className="text-xs font-normal text-muted-foreground mr-2">
                ({stats.available} פנויים · {stats.assigned} משובצים · {stats.total} סה"כ)
              </span>
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap pt-2">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="h-3.5 w-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pr-7 h-8 text-sm"
                  placeholder="חיפוש לפי שם..."
                  value={bachurSearch}
                  onChange={(e) => setBachurSearch(e.target.value)}
                />
              </div>
              <ToggleGroup type="single" value={statusFilter} onValueChange={(v) => v && setStatusFilter(v as StatusFilter)} className="border rounded-md">
                <ToggleGroupItem value="all" className="h-8 text-xs px-3">הכל</ToggleGroupItem>
                <ToggleGroupItem value="available" className="h-8 text-xs px-3">פנויים בלבד</ToggleGroupItem>
                <ToggleGroupItem value="assigned" className="h-8 text-xs px-3">משובצים בלבד</ToggleGroupItem>
              </ToggleGroup>
              <span className="text-xs text-muted-foreground">מציג {visibleList.length} / {filteredBachurim.length}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="max-h-[70vh] overflow-y-auto"
            >
              {visibleList.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">אין בחורים התואמים סינון זה</p>
              ) : (
                <ul className="divide-y">
                  {visibleList.map((b) => {
                    const a = assignmentByBachur.get(b.id);
                    const groupName = a ? groupNameMap.get(a.group_id) : null;
                    return (
                      <li key={b.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted/40">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{b.full_name || "—"}</div>
                          {b.yeshiva && <div className="text-xs text-muted-foreground truncate">{b.yeshiva}</div>}
                        </div>
                        {a && groupName && (
                          <span className="inline-flex items-center gap-1 bg-primary/10 rounded-full px-2 py-0.5 text-xs">
                            {groupName}
                            <button onClick={() => handleUnassign(a.id)} className="hover:text-destructive" title="הסר">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                              {a ? "החלף קבוצה" : "שבץ ל..."}
                              <ChevronDown className="h-3 w-3 mr-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto w-56">
                            <DropdownMenuLabel className="text-xs">בחר קבוצה ({missionGroups.length})</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {missionGroups.length === 0 && (
                              <div className="text-xs text-muted-foreground px-2 py-1">אין קבוצות במשימה זו</div>
                            )}
                            {missionGroups.map((g) => {
                              const isCurrent = a?.group_id === g.id;
                              return (
                                <DropdownMenuItem
                                  key={g.id}
                                  disabled={isCurrent || assignBachur.isPending}
                                  onClick={() => handleAssign(b.id, g.id)}
                                  className="text-xs"
                                >
                                  {isCurrent && <Check className="h-3 w-3 ml-1" />}
                                  <span className="truncate">{g.name}</span>
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
