import { useState, useMemo } from "react";
import { useDonors, useUpdateDonor, useDeleteDonor } from "@/hooks/useDonors";
import { useSettings } from "@/hooks/useSettings";
import { Donor, TITLE_OPTIONS } from "@/lib/store";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddressFields } from "@/components/AddressFields";
import { MoreHorizontal, Pencil, Archive, Trash2, History, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function DonorManagement() {
  const { data: donors = [], isLoading } = useDonors();
  const { data: settings } = useSettings();
  const updateDonor = useUpdateDonor();
  const deleteDonorMut = useDeleteDonor();

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [editDonor, setEditDonor] = useState<Donor | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [historyId, setHistoryId] = useState<number | null>(null);

  const yearsList = settings?.years_list || ['תשפ"ג', 'תשפ"ד', 'תשפ"ה'];
  const currentYear = settings?.current_year || yearsList[yearsList.length - 1];
  const previousYears = yearsList.filter((y) => y !== currentYear);

  const updateFilter = (key: string, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const handleDelete = () => {
    if (deleteId === null) return;
    deleteDonorMut.mutate(deleteId, {
      onSuccess: () => { toast.success("התורם נמחק"); setDeleteId(null); },
    });
  };

  const saveEdit = () => {
    if (!editDonor) return;
    updateDonor.mutate(
      {
        id: editDonor.id,
        updates: {
          title: editDonor.title,
          full_name: editDonor.full_name,
          father_name: editDonor.father_name,
          phone: editDonor.phone,
          city: editDonor.city,
          address: editDonor.address,
          floor: editDonor.floor,
          is_new: editDonor.is_new,
          notes: editDonor.notes,
          donations: editDonor.donations,
          donation_notes: editDonor.donation_notes,
        },
      },
      {
        onSuccess: () => {
          setEditDonor(null);
          toast.success("התורם עודכן");
        },
      }
    );
  };

  const columnFields = ["title", "full_name", "father_name", "phone", "city", "address", "floor"] as const;
  const columnLabels: Record<string, string> = {
    title: "תואר", full_name: "שם מלא", father_name: "שם האב", phone: "טלפון",
    city: "עיר", address: "כתובת", floor: "קומה", notes: "הערות",
  };

  const filtered = useMemo(() => {
    return donors.filter((d) => {
      const f = filters;
      for (const key of columnFields) {
        if (f[key] && !(d as any)[key]?.includes(f[key])) return false;
      }
      if (f.notes && !d.notes.includes(f.notes)) return false;
      if (f[currentYear] && !(d.donations[currentYear]?.toString() || "0").includes(f[currentYear])) return false;
      return true;
    });
  }, [donors, filters, columnFields, currentYear]);

  const currentYearTotal = useMemo(
    () => filtered.reduce((sum, d) => sum + (d.donations[currentYear] || 0), 0),
    [filtered, currentYear]
  );

  const historyDonor = historyId !== null ? donors.find((d) => d.id === historyId) : null;
  const historyYearsWithData = historyDonor
    ? yearsList.filter((y) => historyDonor.donations[y] && historyDonor.donations[y] > 0)
    : [];

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
              <TableHead className="text-right font-semibold text-primary-foreground">הערות</TableHead>
              <TableHead className="text-center font-semibold min-w-[100px] text-primary-foreground">
                תרומות {currentYear}
              </TableHead>
              <TableHead className="text-right font-semibold text-primary-foreground min-w-[120px]">
                הערות {currentYear}
              </TableHead>
              <TableHead className="w-10" />
              <TableHead className="w-10" />
            </TableRow>
            <TableRow className="bg-muted/30">
              <TableHead />
              {columnFields.map((key) => (
                <TableHead key={key}>
                  <Input className="h-7 text-xs" placeholder="סנן..." value={filters[key] || ""} onChange={(e) => updateFilter(key, e.target.value)} />
                </TableHead>
              ))}
              <TableHead>
                <Input className="h-7 text-xs" placeholder="סנן..." value={filters.notes || ""} onChange={(e) => updateFilter("notes", e.target.value)} />
              </TableHead>
              <TableHead>
                <Input className="h-7 text-xs w-20 mx-auto" placeholder="סנן..." value={filters[currentYear] || ""} onChange={(e) => updateFilter(currentYear, e.target.value)} />
              </TableHead>
              <TableHead />
              <TableHead />
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((donor, idx) => (
              <TableRow key={donor.id} className={idx % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                <TableCell className="font-mono text-muted-foreground">{donor.id}</TableCell>
                <TableCell>{donor.title}</TableCell>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-1">
                    {donor.is_new && <Sparkles className="h-4 w-4 text-gold shrink-0" />}
                    {donor.full_name}
                  </span>
                </TableCell>
                <TableCell>{donor.father_name}</TableCell>
                <TableCell dir="ltr" className="text-left">{donor.phone}</TableCell>
                <TableCell>{donor.city}</TableCell>
                <TableCell>{donor.address}</TableCell>
                <TableCell>{donor.floor}</TableCell>
                <TableCell className="text-sm max-w-[180px] truncate">{donor.notes || "—"}</TableCell>
                <TableCell className="text-center">
                  {donor.donations[currentYear] ? `₪${donor.donations[currentYear].toLocaleString()}` : "—"}
                </TableCell>
                <TableCell className="text-sm max-w-[140px] truncate">
                  {donor.donation_notes?.[currentYear] || "—"}
                </TableCell>
                <TableCell>
                  {previousYears.length > 0 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setHistoryId(donor.id)} title="היסטוריה">
                      <History className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditDonor({ ...donor, donations: { ...donor.donations }, donation_notes: { ...donor.donation_notes } })}>
                        <Pencil className="h-4 w-4 ml-2" /> עריכה
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        <Archive className="h-4 w-4 ml-2" /> העברה לארכיון
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(donor.id)}>
                        <Trash2 className="h-4 w-4 ml-2" /> מחיקה
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={columnFields.length + 6} className="text-center py-8 text-muted-foreground">
                  לא נמצאו תורמים
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
        <span>סה״כ תורמים: {filtered.length}</span>
        <span>| סה״כ {currentYear}: <span className="font-semibold text-foreground">₪{currentYearTotal.toLocaleString()}</span></span>
      </div>

      {/* History Dialog - shows per-year amount + note */}
      <Dialog open={!!historyDonor} onOpenChange={(open) => !open && setHistoryId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>היסטוריית תרומות - {historyDonor?.full_name}</DialogTitle>
          </DialogHeader>
          {historyDonor && (
            <div className="space-y-3">
              {historyYearsWithData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">אין תרומות קודמות</p>
              ) : (
                historyYearsWithData.map((y) => (
                  <div key={y} className="border rounded-lg p-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-primary">{y}</span>
                      <span className="font-medium">₪{historyDonor.donations[y]?.toLocaleString()}</span>
                    </div>
                    {historyDonor.donation_notes?.[y] && (
                      <p className="text-sm text-muted-foreground">{historyDonor.donation_notes[y]}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח שברצונך למחוק?</AlertDialogTitle>
            <AlertDialogDescription>פעולה זו אינה ניתנת לביטול. התורם יימחק לצמיתות.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog - includes per-year donation notes */}
      <Dialog open={!!editDonor} onOpenChange={(open) => !open && setEditDonor(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>עריכת תורם #{editDonor?.id}</DialogTitle>
          </DialogHeader>
          {editDonor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>תואר</Label>
                  <Select value={editDonor.title} onValueChange={(v) => setEditDonor({ ...editDonor, title: v })}>
                    <SelectTrigger><SelectValue placeholder="בחר תואר" /></SelectTrigger>
                    <SelectContent>
                      {TITLE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>שם מלא</Label>
                  <Input value={editDonor.full_name} onChange={(e) => setEditDonor({ ...editDonor, full_name: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>שם האב</Label>
                  <Input value={editDonor.father_name} onChange={(e) => setEditDonor({ ...editDonor, father_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>טלפון</Label>
                  <Input value={editDonor.phone} onChange={(e) => setEditDonor({ ...editDonor, phone: e.target.value })} />
                </div>
              </div>
              <AddressFields
                city={editDonor.city}
                address={editDonor.address}
                floor={editDonor.floor}
                onCityChange={(v) => setEditDonor({ ...editDonor, city: v, address: "" })}
                onAddressChange={(v) => setEditDonor({ ...editDonor, address: v })}
                onFloorChange={(v) => setEditDonor({ ...editDonor, floor: v })}
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit_is_new"
                  checked={editDonor.is_new}
                  onCheckedChange={(v) => setEditDonor({ ...editDonor, is_new: !!v })}
                />
                <Label htmlFor="edit_is_new">תורם חדש</Label>
              </div>
              <div className="space-y-2">
                <Label>הערות כלליות</Label>
                <Textarea value={editDonor.notes} onChange={(e) => setEditDonor({ ...editDonor, notes: e.target.value })} />
              </div>
              <div className="space-y-3">
                {yearsList.map((y) => (
                  <div key={y} className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>תרומות {y}</Label>
                      <Input
                        type="number"
                        value={editDonor.donations[y] || ""}
                        onChange={(e) => setEditDonor({
                          ...editDonor,
                          donations: { ...editDonor.donations, [y]: e.target.value === "" ? 0 : Number(e.target.value) },
                        })}
                        placeholder="₪0"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>הערות {y}</Label>
                      <Input
                        value={editDonor.donation_notes?.[y] || ""}
                        onChange={(e) => setEditDonor({
                          ...editDonor,
                          donation_notes: { ...editDonor.donation_notes, [y]: e.target.value },
                        })}
                        placeholder="הערה..."
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={saveEdit} disabled={updateDonor.isPending}>
                  {updateDonor.isPending ? "שומר..." : "שמור"}
                </Button>
                <Button variant="outline" onClick={() => setEditDonor(null)}>ביטול</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
