import { useState, useMemo } from "react";
import {
  useGroups, useGroupMembers, useGroupBachurAssignments,
  useDeleteGroup, useUpdateGroup, useUpdateMemberOrder,
  useRemoveGroupMember, useAssignBachur, useUnassignBachur,
  DonorGroup,
} from "@/hooks/useGroups";
import { useDonors } from "@/hooks/useDonors";
import { useBachurim } from "@/hooks/useBachurim";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical, Trash2, UserPlus, X, FileText } from "lucide-react";
import { toast } from "sonner";

export default function GroupManagement() {
  const { data: groups = [], isLoading } = useGroups();
  const { data: donors = [] } = useDonors();
  const { data: bachurim = [] } = useBachurim();
  const deleteGroup = useDeleteGroup();
  const updateGroup = useUpdateGroup();
  const updateOrder = useUpdateMemberOrder();
  const removeMember = useRemoveGroupMember();
  const assignBachur = useAssignBachur();
  const unassignBachur = useUnassignBachur();

  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [deleteGroupId, setDeleteGroupId] = useState<number | null>(null);
  const [assignDialogGroupId, setAssignDialogGroupId] = useState<number | null>(null);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const { data: members = [] } = useGroupMembers(selectedGroupId ?? undefined);
  const { data: assignments = [] } = useGroupBachurAssignments(selectedGroupId ?? undefined);

  const donorMap = useMemo(() => new Map(donors.map((d) => [d.id, d])), [donors]);
  const bachurMap = useMemo(() => new Map(bachurim.map((b) => [b.id, b])), [bachurim]);

  const sortedMembers = useMemo(() => [...members].sort((a, b) => a.sort_order - b.sort_order), [members]);

  const assignedBachurIds = useMemo(() => new Set(assignments.map((a) => a.bachur_id)), [assignments]);
  const availableBachurim = useMemo(() => bachurim.filter((b) => !assignedBachurIds.has(b.id)), [bachurim, assignedBachurIds]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = [...sortedMembers];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    const updates = reordered.map((m, i) => ({ id: m.id, sort_order: i }));
    updateOrder.mutate(updates);
  };

  const handleDeleteGroup = () => {
    if (deleteGroupId === null) return;
    deleteGroup.mutate(deleteGroupId, {
      onSuccess: () => {
        toast.success("הקבוצה נמחקה");
        setDeleteGroupId(null);
        if (selectedGroupId === deleteGroupId) setSelectedGroupId(null);
      },
    });
  };

  const handleAssignBachur = (bachurId: number) => {
    if (!assignDialogGroupId) return;
    assignBachur.mutate(
      { group_id: assignDialogGroupId, bachur_id: bachurId },
      { onSuccess: () => toast.success("הבחור שויך לקבוצה") }
    );
  };

  const generatePDF = async (groupIds: number[]) => {
    // Dynamic import to avoid bundling jspdf at load
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "landscape", putOnlyUsedFonts: true });
    // Note: Hebrew support requires special font; using basic Latin fallback
    // For production, embed a Hebrew font
    let first = true;

    for (const gId of groupIds) {
      const group = groups.find((g) => g.id === gId);
      if (!group) continue;
      if (!first) doc.addPage();
      first = false;

      // Use RTL text placement
      const pageW = doc.internal.pageSize.getWidth();
      doc.setFontSize(16);
      doc.text(group.name, pageW - 10, 15, { align: "right" });

      // Bachur names
      const gAssignments = assignments.filter((a) => a.group_id === gId);
      const bachurNames = gAssignments.map((a) => bachurMap.get(a.bachur_id)?.full_name || "").filter(Boolean).join(", ");
      if (bachurNames) {
        doc.setFontSize(10);
        doc.text(`בחורים: ${bachurNames}`, pageW - 10, 23, { align: "right" });
      }

      // Table headers
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

      // Table rows
      const gMembers = members.filter((m) => m.group_id === gId).sort((a, b) => a.sort_order - b.sort_order);
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

      // Summary at bottom
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
        <Button variant="outline" onClick={() => generatePDF(groups.map((g) => g.id))} disabled={groups.length === 0}>
          <FileText className="h-4 w-4 ml-1" /> הדפסה מרוכזת
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Groups list */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-base">קבוצות ({groups.length})</CardTitle></CardHeader>
          <CardContent className="space-y-1 max-h-[60vh] overflow-y-auto">
            {groups.map((g) => (
              <div
                key={g.id}
                className={`flex items-center justify-between p-2 rounded cursor-pointer text-sm ${selectedGroupId === g.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"}`}
                onClick={() => setSelectedGroupId(g.id)}
              >
                <span className="truncate flex-1">{g.name}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); generatePDF([g.id]); }}>
                    <FileText className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteGroupId(g.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            {groups.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">אין קבוצות. צור קבוצות מדף המיפוי.</p>}
          </CardContent>
        </Card>

        {/* Group detail */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{selectedGroup ? selectedGroup.name : "בחר קבוצה"}</CardTitle>
              {selectedGroup && (
                <Button variant="outline" size="sm" onClick={() => setAssignDialogGroupId(selectedGroup.id)}>
                  <UserPlus className="h-4 w-4 ml-1" /> שייך בחור
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedGroup ? (
              <p className="text-sm text-muted-foreground text-center py-8">בחר קבוצה מהרשימה</p>
            ) : (
              <div className="space-y-3">
                {/* Assigned bachurim */}
                {assignments.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="font-medium">בחורים:</span>
                    {assignments.map((a) => {
                      const b = bachurMap.get(a.bachur_id);
                      return (
                        <span key={a.id} className="inline-flex items-center gap-1 bg-primary/10 rounded-full px-2 py-0.5 text-xs">
                          {b?.full_name || `#${a.bachur_id}`}
                          <button onClick={() => unassignBachur.mutate(a.id)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Donor members with drag & drop */}
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="members">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}>
                        <Table className="text-sm">
                          <TableHeader>
                            <TableRow className="bg-primary text-primary-foreground">
                              <TableHead className="w-8 px-1" />
                              <TableHead className="text-right px-2 text-primary-foreground">#</TableHead>
                              <TableHead className="text-right px-2 text-primary-foreground">שם</TableHead>
                              <TableHead className="text-right px-2 text-primary-foreground">כתובת</TableHead>
                              <TableHead className="text-right px-2 text-primary-foreground">קומה</TableHead>
                              <TableHead className="text-right px-2 text-primary-foreground">הערות</TableHead>
                              <TableHead className="w-8 px-1" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedMembers.map((m, idx) => {
                              const donor = donorMap.get(m.donor_id);
                              return (
                                <Draggable key={m.id} draggableId={String(m.id)} index={idx}>
                                  {(prov) => (
                                    <TableRow ref={prov.innerRef} {...prov.draggableProps} className={idx % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                                      <TableCell className="px-1" {...prov.dragHandleProps}><GripVertical className="h-4 w-4 text-muted-foreground" /></TableCell>
                                      <TableCell className="px-2 text-xs text-muted-foreground">{idx + 1}</TableCell>
                                      <TableCell className="px-2 font-medium">{donor?.full_name || "—"}</TableCell>
                                      <TableCell className="px-2 text-xs">{donor ? `${donor.address} ${donor.house_number}, ${donor.city}` : "—"}</TableCell>
                                      <TableCell className="px-2 text-xs">{donor?.floor || "—"}</TableCell>
                                      <TableCell className="px-2 text-xs max-w-[100px] truncate">{donor?.notes || "—"}</TableCell>
                                      <TableCell className="px-1">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeMember.mutate(m.id)}>
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </TableBody>
                        </Table>
                        {sortedMembers.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">אין תורמים בקבוצה זו</p>
                        )}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete group confirm */}
      <AlertDialog open={deleteGroupId !== null} onOpenChange={(o) => !o && setDeleteGroupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>הקבוצה תימחק לצמיתות כולל כל השיוכים שלה.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign bachur dialog */}
      <Dialog open={assignDialogGroupId !== null} onOpenChange={(o) => !o && setAssignDialogGroupId(null)}>
        <DialogContent className="max-w-sm max-h-[70vh] overflow-y-auto">
          <DialogHeader><DialogTitle>שייך בחור לקבוצה</DialogTitle></DialogHeader>
          <div className="space-y-1">
            {availableBachurim.map((b) => (
              <Button key={b.id} variant="ghost" className="w-full justify-start text-sm" onClick={() => handleAssignBachur(b.id)}>
                {b.full_name} - {b.yeshiva}
              </Button>
            ))}
            {availableBachurim.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">כל הבחורים כבר שויכו</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
