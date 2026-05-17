import { useState, useMemo, useEffect } from "react";
import {
  useGroups, useAllGroupMembers, useGroupBachurAssignments,
  useDeleteGroup, useUpdateGroup, useGroupMembers, useUpdateMemberOrder, useRemoveGroupMember, DonorGroup,
} from "@/hooks/useGroups";
import { useDonors } from "@/hooks/useDonors";
import { useBachurim } from "@/hooks/useBachurim";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, FileText, Pencil, Search, GripVertical, X } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const TASK_TYPES = ['מת"א', 'י"ד', 'ט"ו', 'ליל ט"ו', 'טלפונים'];
const TRANSPORT_TYPES = ["רגלי", "נסיעה/טנדר"];

// Cache the Heebo font as base64 across calls
let heeboBase64Cache: string | null = null;
async function getHeeboBase64(): Promise<string | null> {
  if (heeboBase64Cache) return heeboBase64Cache;
  try {
    const res = await fetch("/fonts/Heebo-Regular.ttf");
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
    }
    heeboBase64Cache = btoa(binary);
    return heeboBase64Cache;
  } catch {
    return null;
  }
}

export default function GroupManagement() {
  const { data: groups = [], isLoading } = useGroups();
  const { data: donors = [] } = useDonors();
  const { data: bachurim = [] } = useBachurim();
  const { data: allMembers = [] } = useAllGroupMembers();
  const { data: allAssignmentsData = [] } = useGroupBachurAssignments();
  const deleteGroup = useDeleteGroup();
  const updateGroup = useUpdateGroup();

  const [searchQuery, setSearchQuery] = useState("");
  const [deleteGroupId, setDeleteGroupId] = useState<number | null>(null);
  const [editGroup, setEditGroup] = useState<DonorGroup | null>(null);

  const donorMap = useMemo(() => new Map(donors.map((d) => [d.id, d])), [donors]);
  const bachurMap = useMemo(() => new Map(bachurim.map((b) => [b.id, b])), [bachurim]);

  const memberCountMap = useMemo(() => {
    const map = new Map<number, number>();
    allMembers.forEach((m) => map.set(m.group_id, (map.get(m.group_id) || 0) + 1));
    return map;
  }, [allMembers]);

  const groupCityMap = useMemo(() => {
    const map = new Map<number, string>();
    const sortedMembers = [...allMembers].sort((a, b) => a.sort_order - b.sort_order);
    for (const m of sortedMembers) {
      if (map.has(m.group_id)) continue;
      const d = donorMap.get(m.donor_id);
      if (d?.city) map.set(m.group_id, d.city);
    }
    return map;
  }, [allMembers, donorMap]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groups;
    return groups.filter((g) => g.name.includes(searchQuery) || g.task_type.includes(searchQuery));
  }, [groups, searchQuery]);

  const handleDeleteGroup = () => {
    if (deleteGroupId === null) return;
    deleteGroup.mutate(deleteGroupId, {
      onSuccess: () => { toast.success("הקבוצה נמחקה"); setDeleteGroupId(null); },
    });
  };

  const handleSaveEdit = () => {
    if (!editGroup) return;
    updateGroup.mutate(
      { id: editGroup.id, updates: { name: editGroup.name, task_type: editGroup.task_type, transport_type: editGroup.transport_type } },
      { onSuccess: () => { toast.success("הקבוצה עודכנה"); } }
    );
  };

  const generatePDF = async (groupIds: number[]) => {
    const { default: jsPDF } = await import("jspdf");
    const autoTableMod: any = await import("jspdf-autotable");
    const autoTable = autoTableMod.default || autoTableMod;
    const heebo = await getHeeboBase64();

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    if (heebo) {
      doc.addFileToVFS("Heebo-Regular.ttf", heebo);
      doc.addFont("Heebo-Regular.ttf", "Heebo", "normal");
      doc.setFont("Heebo");
    }
    doc.setR2L(true);

    let first = true;
    for (const gId of groupIds) {
      const group = groups.find((g) => g.id === gId);
      if (!group) continue;
      if (!first) doc.addPage();
      first = false;

      const pageW = doc.internal.pageSize.getWidth();
      doc.setFontSize(16);
      doc.text(group.name, pageW - 16, 14, { align: "right" });
      doc.setFontSize(10);
      const transport = group.transport_type && group.transport_type.trim() ? group.transport_type : "לא הוגדר";
      doc.text(`משימה: ${group.task_type}   |   שינוע: ${transport}`, pageW - 16, 21, { align: "right" });

      const gMembers = allMembers
        .filter((m) => m.group_id === gId)
        .sort((a, b) => a.sort_order - b.sort_order);

      // jspdf-autotable renders columns left-to-right in array order regardless of setR2L.
      // To get RTL visual order (right-most first), we list them reversed in the array.
      // Visual right→left: #, שם תורם, כתובת, קומה, הערות, מזומן, צ'ק, לא ענה
      // => array (left→right): לא ענה, צ'ק, מזומן, הערות, קומה, כתובת, שם תורם, #
      const head = [["לא ענה", "צ'ק", "מזומן", "הערות", "קומה", "כתובת", "שם תורם", "#"]];
      const body = gMembers.map((m, i) => {
        const d = donorMap.get(m.donor_id);
        if (!d) return ["", "", "", "—", "—", "—", "—", String(i + 1)];
        const addr = `${d.address || ""} ${d.house_number || ""}, ${d.city || ""}`.trim();
        return ["", "", "", d.notes || "", d.floor || "—", addr, d.full_name || "—", String(i + 1)];
      });

      autoTable(doc, {
        head,
        body,
        startY: 26,
        margin: { left: 12, right: 12 },
        tableWidth: "auto",
        styles: {
          font: heebo ? "Heebo" : "helvetica",
          fontSize: 9,
          halign: "right",
          cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
          lineColor: [80, 80, 80],
          lineWidth: 0.2,
          minCellHeight: 12,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [30, 64, 124],
          textColor: 255,
          fontStyle: "normal",
          halign: "right",
          minCellHeight: 10,
        },
        columnStyles: {
          0: { cellWidth: 24, halign: "center", minCellHeight: 14 }, // לא ענה
          1: { cellWidth: 24, halign: "center", minCellHeight: 14 }, // צ'ק
          2: { cellWidth: 24, halign: "center", minCellHeight: 14 }, // מזומן
          3: { cellWidth: 45, halign: "right" },                     // הערות
          4: { cellWidth: 14, halign: "center" },                    // קומה
          5: { cellWidth: 65, halign: "right" },                     // כתובת
          6: { cellWidth: 45, halign: "right" },                     // שם תורם
          7: { cellWidth: 10, halign: "center" },                    // #
        },
      });

      // Optional bachurim list at bottom
      const bNames = allAssignmentsData
        .filter((a) => a.group_id === gId)
        .map((a) => bachurMap.get(a.bachur_id)?.full_name)
        .filter(Boolean)
        .join(", ");
      if (bNames) {
        const finalY = (doc as any).lastAutoTable?.finalY || 26;
        doc.setFontSize(9);
        doc.text(`בחורים משובצים: ${bNames}`, pageW - 14, finalY + 8);
      }
    }
    doc.save("groups_report.pdf");
    toast.success("הדוח הופק בהצלחה");
  };

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">טוען...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="h-4 w-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pr-8" placeholder="חיפוש קבוצה..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => generatePDF(groups.map((g) => g.id))} disabled={groups.length === 0}>
          <FileText className="h-4 w-4 ml-1" /> הדפס את כל הקבוצות
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">קבוצות ({filteredGroups.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-auto">
            <Table className="text-sm">
              <TableHeader>
                <TableRow className="bg-primary text-primary-foreground">
                  <TableHead className="text-right font-semibold px-2 text-primary-foreground">שם קבוצה</TableHead>
                  <TableHead className="text-right font-semibold px-2 text-primary-foreground">סוג משימה</TableHead>
                  <TableHead className="text-right font-semibold px-2 text-primary-foreground">עיר</TableHead>
                  <TableHead className="text-right font-semibold px-2 text-primary-foreground">סוג שינוע</TableHead>
                  <TableHead className="text-center font-semibold px-2 text-primary-foreground">תורמים</TableHead>
                  <TableHead className="w-32 px-1 text-primary-foreground">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.map((g, idx) => (
                  <TableRow key={g.id} className={idx % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                    <TableCell className="px-2 font-medium">{g.name}</TableCell>
                    <TableCell className="px-2">{g.task_type}</TableCell>
                    <TableCell className="px-2">{groupCityMap.get(g.id) || "—"}</TableCell>
                    <TableCell className="px-2">{g.transport_type || "—"}</TableCell>
                    <TableCell className="text-center px-2">{memberCountMap.get(g.id) || 0}</TableCell>
                    <TableCell className="px-1">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditGroup({ ...g })} title="עריכה">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => generatePDF([g.id])} title="הדפסת דוח">
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteGroupId(g.id)} title="מחיקה">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredGroups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">אין קבוצות. צור קבוצות מדף המיפוי.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit modal: logistics + sortable donor list */}
      <Dialog open={!!editGroup} onOpenChange={(o) => !o && setEditGroup(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>עריכת קבוצה</DialogTitle></DialogHeader>
          {editGroup && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>שם קבוצה</Label>
                  <Input value={editGroup.name} onChange={(e) => setEditGroup({ ...editGroup, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>עיר</Label>
                  <Input value={groupCityMap.get(editGroup.id) || "—"} disabled className="text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <Label>סוג משימה</Label>
                  <Select value={editGroup.task_type} onValueChange={(v) => setEditGroup({ ...editGroup, task_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TASK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>סוג שינוע</Label>
                  <Select value={editGroup.transport_type} onValueChange={(v) => setEditGroup({ ...editGroup, transport_type: v })}>
                    <SelectTrigger><SelectValue placeholder="בחר סוג שינוע" /></SelectTrigger>
                    <SelectContent>
                      {TRANSPORT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SortableMembersPanel groupId={editGroup.id} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditGroup(null)}>סגור</Button>
            <Button onClick={handleSaveEdit} disabled={updateGroup.isPending}>שמור פרטים</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteGroupId !== null} onOpenChange={(o) => !o && setDeleteGroupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>הקבוצה תימחק לצמיתות כולל כל השיוכים שלה. לא ניתן לבטל פעולה זו.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ----- Sortable members list ----- */

function SortableMembersPanel({ groupId }: { groupId: number }) {
  const { data: members = [] } = useGroupMembers(groupId);
  const { data: donors = [] } = useDonors();
  const updateOrder = useUpdateMemberOrder();
  const removeMember = useRemoveGroupMember();

  const donorMap = useMemo(() => new Map(donors.map((d) => [d.id, d])), [donors]);
  const [items, setItems] = useState<{ id: number; donor_id: number }[]>([]);

  useEffect(() => {
    setItems([...members].sort((a, b) => a.sort_order - b.sort_order).map((m) => ({ id: m.id, donor_id: m.donor_id })));
  }, [members]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    const newOrder = arrayMove(items, oldIdx, newIdx);
    setItems(newOrder);
    // Auto-save the new order
    const updates = newOrder.map((it, idx) => ({ id: it.id, sort_order: idx }));
    updateOrder.mutate(updates, {
      onSuccess: () => toast.success("הסדר עודכן"),
      onError: () => toast.error("שגיאה בעדכון הסדר"),
    });
  };

  const handleRemove = (id: number) => {
    removeMember.mutate(id, {
      onSuccess: () => toast.success("התורם הוסר מהקבוצה"),
      onError: () => toast.error("שגיאה בהסרה"),
    });
  };

  return (
    <div className="space-y-2 border-t pt-3">
      <Label>תורמים בקבוצה ({items.length}) — גרור לסידור</Label>
      <div className="border rounded-lg max-h-64 overflow-y-auto bg-muted/20 p-1">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">אין תורמים בקבוצה זו</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {items.map((it, idx) => {
                const d = donorMap.get(it.donor_id);
                return (
                  <SortableMemberRow
                    key={it.id}
                    id={it.id}
                    index={idx + 1}
                    label={d ? `${d.full_name} — ${d.address} ${d.house_number}, ${d.city}` : `#${it.donor_id}`}
                    onRemove={() => handleRemove(it.id)}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

function SortableMemberRow({ id, index, label, onRemove }: { id: number; index: number; label: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 bg-card border rounded-md px-2 py-1.5 mb-1 text-sm">
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground" type="button">
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-xs text-muted-foreground w-6 text-center">{index}</span>
      <span className="flex-1 truncate">{label}</span>
      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={onRemove} title="הסר">
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
