import { useState, useMemo } from "react";
import {
  useGroups, useAllGroupMembers, useGroupBachurAssignments,
  useDeleteGroup, useUpdateGroup, DonorGroup,
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
import { Trash2, FileText, Pencil, Search } from "lucide-react";
import { toast } from "sonner";

const TASK_TYPES = ['מת"א', 'י"ד', 'ט"ו'];
const TRANSPORT_TYPES = ["רגלי", "נסיעה/טנדר"];

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

  // Derive city per group (from first member)
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
      { onSuccess: () => { toast.success("הקבוצה עודכנה"); setEditGroup(null); } }
    );
  };

  const generatePDF = async (groupIds: number[]) => {
    const { default: jsPDF } = await import("jspdf");
    let heeboBase64: string | null = null;
    try {
      const fontUrl = "https://cdn.jsdelivr.net/gh/nicholasgasior/gfonts-base64/fonts/heebo/Heebo-Regular.ttf.base64.txt";
      heeboBase64 = await (await fetch(fontUrl)).text();
    } catch {}
    const doc = new jsPDF({ orientation: "landscape", putOnlyUsedFonts: true });
    if (heeboBase64) {
      doc.addFileToVFS("Heebo-Regular.ttf", heeboBase64);
      doc.addFont("Heebo-Regular.ttf", "Heebo", "normal");
      doc.setFont("Heebo");
    }
    let first = true;
    for (const gId of groupIds) {
      const group = groups.find((g) => g.id === gId);
      if (!group) continue;
      if (!first) doc.addPage();
      first = false;
      if (heeboBase64) doc.setFont("Heebo");
      const pageW = doc.internal.pageSize.getWidth();
      doc.setFontSize(16);
      doc.text(group.name, pageW - 10, 15, { align: "right" });

      const bNames = allAssignmentsData
        .filter((a) => a.group_id === gId)
        .map((a) => bachurMap.get(a.bachur_id)?.full_name)
        .filter(Boolean)
        .join(", ");
      if (bNames) {
        doc.setFontSize(10);
        doc.text(`בחורים: ${bNames}`, pageW - 10, 23, { align: "right" });
      }

      const startY = 32;
      const colWidths = [30, 50, 60, 25, 50, 50];
      const headers = ["סכום תרומה", "הערות", "קומה/דירה", "מס׳ בית", "כתובת מלאה", "שם תורם"];
      let x = pageW - 10;
      doc.setFontSize(9);
      doc.setDrawColor(0);
      headers.forEach((h, i) => {
        doc.rect(x - colWidths[i], startY, colWidths[i], 8);
        doc.text(h, x - 2, startY + 5, { align: "right" });
        x -= colWidths[i];
      });

      const gMembers = allMembers.filter((m) => m.group_id === gId).sort((a, b) => a.sort_order - b.sort_order);
      gMembers.forEach((m, rowIdx) => {
        const donor = donorMap.get(m.donor_id);
        if (!donor) return;
        const y = startY + 8 + rowIdx * 8;
        const vals = ["", donor.notes || "", donor.floor || "", donor.house_number || "", `${donor.address}, ${donor.city}`, donor.full_name];
        let rx = pageW - 10;
        vals.forEach((v, i) => {
          doc.rect(rx - colWidths[i], y, colWidths[i], 8);
          doc.text(String(v).substring(0, 20), rx - 2, y + 5, { align: "right" });
          rx -= colWidths[i];
        });
      });

      const bottomY = doc.internal.pageSize.getHeight() - 20;
      doc.setFontSize(10);
      doc.text('סה"כ מזומן: _______   סה"כ צ\'קים: _______   סה"כ לא ענו: _______', pageW - 10, bottomY, { align: "right" });
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

      {/* Edit modal — logistics only, no bachur names */}
      <Dialog open={!!editGroup} onOpenChange={(o) => !o && setEditGroup(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>עריכת קבוצה</DialogTitle></DialogHeader>
          {editGroup && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>שם קבוצה</Label>
                <Input value={editGroup.name} onChange={(e) => setEditGroup({ ...editGroup, name: e.target.value })} />
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
                <Label>עיר</Label>
                <Input value={groupCityMap.get(editGroup.id) || "—"} disabled className="text-muted-foreground" />
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
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditGroup(null)}>ביטול</Button>
            <Button onClick={handleSaveEdit} disabled={updateGroup.isPending}>שמור</Button>
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
