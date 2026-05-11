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
      { id: editBachur.id, updates: { first_name: editBachur.first_name, last_name: editBachur.last_name, father_name: editBachur.father_name, yeshiva: editBachur.yeshiva, shiur: editBachur.shiur, notes: editBachur.notes } },
      { onSuccess: () => { setEditBachur(null); toast.success("הבחור עודכן"); } }
    );
  };

  const columnFields = ["first_name", "last_name", "father_name", "yeshiva", "shiur", "notes"] as const;
  const columnLabels: Record<string, string> = {
    first_name: "שם פרטי", last_name: "שם משפחה", father_name: "שם האב", yeshiva: "ישיבה", shiur: "שיעור", notes: "הערות",
  };

  const filtered = useMemo(() => {
    return bachurim.filter((b) => {
      for (const key of columnFields) {
        if (filters[key] && !(b as any)[key]?.includes(filters[key])) return false;
      }
      return true;
    });
  }, [bachurim, filters]);

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">טוען נתונים...</div>;

  return (
    <div className="space-y-3">
      <div className="border rounded-lg overflow-auto bg-card">
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="bg-primary text-primary-foreground">
              <TableHead className="text-right font-semibold w-10 px-2 text-primary-foreground">ID</TableHead>
              {columnFields.map((key) => (
                <TableHead key={key} className="text-right font-semibold px-2 text-primary-foreground">{columnLabels[key]}</TableHead>
              ))}
              <TableHead className="w-8 px-1" />
            </TableRow>
            <TableRow className="bg-muted/30">
              <TableHead className="px-2" />
              {columnFields.map((key) => (
                <TableHead key={key} className="px-2">
                  <div className="relative">
                    <Search className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input className="h-6 text-xs pr-6" value={filters[key] || ""} onChange={(e) => updateFilter(key, e.target.value)} />
                  </div>
                </TableHead>
              ))}
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((b, idx) => (
              <TableRow key={b.id} className={idx % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                <TableCell className="font-mono text-muted-foreground px-2 text-xs">{b.id}</TableCell>
                <TableCell className="px-2 font-medium">{b.first_name}</TableCell>
                <TableCell className="px-2">{b.last_name}</TableCell>
                <TableCell className="px-2">{b.father_name}</TableCell>
                <TableCell className="px-2">{b.yeshiva}</TableCell>
                <TableCell className="px-2">{b.shiur}</TableCell>
                <TableCell className="px-2 max-w-[180px] truncate text-xs">{b.notes || "—"}</TableCell>
                <TableCell className="px-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditBachur({ ...b })}><Pencil className="h-4 w-4 ml-2" /> עריכה</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(b.id)}><Trash2 className="h-4 w-4 ml-2" /> מחיקה</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={columnFields.length + 2} className="text-center py-8 text-muted-foreground">לא נמצאו בחורים</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        סה״כ: {filtered.length} בחורים
      </div>

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

      {/* Edit */}
      <Dialog open={!!editBachur} onOpenChange={(open) => !open && setEditBachur(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>עריכת בחור #{editBachur?.id}</DialogTitle></DialogHeader>
          {editBachur && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>שם פרטי</Label><Input value={editBachur.first_name} onChange={(e) => setEditBachur({ ...editBachur, first_name: e.target.value })} /></div>
                <div className="space-y-2"><Label>שם משפחה</Label><Input value={editBachur.last_name} onChange={(e) => setEditBachur({ ...editBachur, last_name: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>שם האב</Label><Input value={editBachur.father_name} onChange={(e) => setEditBachur({ ...editBachur, father_name: e.target.value })} /></div>
                <div className="space-y-2"><Label>עיר</Label><Input value={editBachur.city || ""} onChange={(e) => setEditBachur({ ...editBachur, city: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>ישיבה</Label>
                  <Select value={editBachur.yeshiva} onValueChange={(v) => setEditBachur({ ...editBachur, yeshiva: v })}>
                    <SelectTrigger><SelectValue placeholder="בחר ישיבה" /></SelectTrigger>
                    <SelectContent>{yeshivot.map((o) => <SelectItem key={o.id} value={o.value}>{o.value}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>שיעור</Label>
                  <Select value={editBachur.shiur} onValueChange={(v) => setEditBachur({ ...editBachur, shiur: v })}>
                    <SelectTrigger><SelectValue placeholder="בחר שיעור" /></SelectTrigger>
                    <SelectContent>{shiurim.map((o) => <SelectItem key={o.id} value={o.value}>{o.value}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>הערות</Label><Textarea value={editBachur.notes} onChange={(e) => setEditBachur({ ...editBachur, notes: e.target.value })} /></div>
              <div className="flex gap-2 pt-2">
                <Button onClick={saveEdit} disabled={updateBachur.isPending}>{updateBachur.isPending ? "שומר..." : "שמור"}</Button>
                <Button variant="outline" onClick={() => setEditBachur(null)}>ביטול</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
