import { useState, useMemo } from "react";
import { useBachurim, useUpdateBachur, useDeleteBachur } from "@/hooks/useBachurim";
import { useSelectOptions } from "@/hooks/useSelectOptions";
import { Bachur } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

export default function BachurimList() {
  const { data: bachurim = [], isLoading } = useBachurim();
  const updateBachur = useUpdateBachur();
  const deleteBachurMut = useDeleteBachur();
  const { data: yeshivot = [] } = useSelectOptions("yeshiva");
  const { data: shiurim = [] } = useSelectOptions("shiur");

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [editBachur, setEditBachur] = useState<Bachur | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const updateFilter = (key: string, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const handleDelete = () => {
    if (deleteId === null) return;
    deleteBachurMut.mutate(deleteId, {
      onSuccess: () => { toast.success("הבחור נמחק"); setDeleteId(null); },
    });
  };

  const saveEdit = () => {
    if (!editBachur) return;
    updateBachur.mutate(
      { id: editBachur.id, updates: { full_name: editBachur.full_name, father_name: editBachur.father_name, yeshiva: editBachur.yeshiva, shiur: editBachur.shiur, notes: editBachur.notes } },
      { onSuccess: () => { setEditBachur(null); toast.success("הבחור עודכן"); } }
    );
  };

  const columnFields = ["full_name", "father_name", "yeshiva", "shiur", "notes"] as const;
  const columnLabels: Record<string, string> = {
    full_name: "שם מלא", father_name: "שם האב",
    yeshiva: "ישיבה", shiur: "שיעור", notes: "הערות",
  };

  const filtered = useMemo(() => {
    return bachurim.filter((b) => {
      for (const key of columnFields) {
        if (filters[key] && !(b as any)[key]?.includes(filters[key])) return false;
      }
      return true;
    });
  }, [bachurim, filters]);

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">טוען נתונים...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary text-primary-foreground">
              <TableHead className="text-right font-semibold w-12 text-primary-foreground">מזהה</TableHead>
              {columnFields.map((key) => (
                <TableHead key={key} className="text-right font-semibold text-primary-foreground">
                  {columnLabels[key]}
                </TableHead>
              ))}
              <TableHead className="w-10" />
            </TableRow>
            <TableRow className="bg-muted/30">
              <TableHead />
              {columnFields.map((key) => (
                <TableHead key={key}>
                  <div className="relative">
                    <Search className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input className="h-7 text-xs pr-7" value={filters[key] || ""} onChange={(e) => updateFilter(key, e.target.value)} />
                  </div>
                </TableHead>
              ))}
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((b, idx) => (
              <TableRow key={b.id} className={idx % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                <TableCell className="font-mono text-muted-foreground">{b.id}</TableCell>
                <TableCell className="font-medium">{b.full_name}</TableCell>
                <TableCell>{b.father_name}</TableCell>
                <TableCell>{b.yeshiva}</TableCell>
                <TableCell>{b.shiur}</TableCell>
                <TableCell className="text-sm max-w-[180px] truncate">{b.notes || "—"}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditBachur({ ...b })}>
                        <Pencil className="h-4 w-4 ml-2" /> עריכה
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(b.id)}>
                        <Trash2 className="h-4 w-4 ml-2" /> מחיקה
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={columnFields.length + 2} className="text-center py-8 text-muted-foreground">
                  לא נמצאו בחורים
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">סה״כ בחורים: {filtered.length}</div>

      {/* Delete */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח שברצונך למחוק?</AlertDialogTitle>
            <AlertDialogDescription>פעולה זו אינה ניתנת לביטול.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit - only Full Name, Father's Name, Yeshiva, Shiur, Notes */}
      <Dialog open={!!editBachur} onOpenChange={(open) => !open && setEditBachur(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>עריכת בחור #{editBachur?.id}</DialogTitle>
          </DialogHeader>
          {editBachur && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>שם מלא</Label>
                  <Input value={editBachur.full_name} onChange={(e) => setEditBachur({ ...editBachur, full_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>שם האב</Label>
                  <Input value={editBachur.father_name} onChange={(e) => setEditBachur({ ...editBachur, father_name: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>ישיבה</Label>
                  <Select value={editBachur.yeshiva} onValueChange={(v) => setEditBachur({ ...editBachur, yeshiva: v })}>
                    <SelectTrigger><SelectValue placeholder="בחר ישיבה" /></SelectTrigger>
                    <SelectContent>
                      {yeshivot.map((o) => <SelectItem key={o.id} value={o.value}>{o.value}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>שיעור</Label>
                  <Select value={editBachur.shiur} onValueChange={(v) => setEditBachur({ ...editBachur, shiur: v })}>
                    <SelectTrigger><SelectValue placeholder="בחר שיעור" /></SelectTrigger>
                    <SelectContent>
                      {shiurim.map((o) => <SelectItem key={o.id} value={o.value}>{o.value}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>הערות</Label>
                <Textarea value={editBachur.notes} onChange={(e) => setEditBachur({ ...editBachur, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={saveEdit} disabled={updateBachur.isPending}>
                  {updateBachur.isPending ? "שומר..." : "שמור"}
                </Button>
                <Button variant="outline" onClick={() => setEditBachur(null)}>ביטול</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
