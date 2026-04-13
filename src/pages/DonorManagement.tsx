import { useState, useMemo } from "react";
import { useDonors, useUpdateDonor, useDeleteDonor } from "@/hooks/useDonors";
import { useSettings } from "@/hooks/useSettings";
import { useSelectOptions } from "@/hooks/useSelectOptions";
import { Donor } from "@/lib/store";
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
import { MoreHorizontal, Pencil, Archive, Trash2, History, Sparkles, Search } from "lucide-react";
import { toast } from "sonner";

export default function DonorManagement() {
  const { data: donors = [], isLoading } = useDonors();
  const { data: settings } = useSettings();
  const { data: titleOptions = [] } = useSelectOptions("title");
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
          title: editDonor.title, full_name: editDonor.full_name, father_name: editDonor.father_name,
          phone: editDonor.phone, city: editDonor.city, address: editDonor.address,
          house_number: editDonor.house_number, floor: editDonor.floor, is_new: editDonor.is_new,
          notes: editDonor.notes, donations: editDonor.donations, donation_notes: editDonor.donation_notes,
        },
      },
      { onSuccess: () => { setEditDonor(null); toast.success("התורם עודכן"); } }
    );
  };

  const columnFields = ["title", "full_name", "father_name", "city", "address", "house_number", "floor"] as const;
  const columnLabels: Record<string, string> = {
    title: "תואר", full_name: "שם מלא", father_name: "שם האב",
    city: "עיר", address: "רחוב", house_number: "מס׳ בית", floor: "קומה", notes: "הערות",
  };

  const filtered = useMemo(() => {
    return donors.filter((d) => {
      if (d.archived_at) return false;
      for (const key of columnFields) {
        if (filters[key] && !(d as any)[key]?.includes(filters[key])) return false;
      }
      if (filters.notes && !d.notes.includes(filters.notes)) return false;
      if (filters[currentYear] && !(d.donations[currentYear]?.toString() || "0").includes(filters[currentYear])) return false;
      return true;
    });
  }, [donors, filters, currentYear]);

  const currentYearTotal = useMemo(
    () => filtered.reduce((sum, d) => sum + (d.donations[currentYear] || 0), 0),
    [filtered, currentYear]
  );

  const historyDonor = historyId !== null ? donors.find((d) => d.id === historyId) : null;
  const historyYearsWithData = historyDonor
    ? yearsList.filter((y) => historyDonor.donations[y] && historyDonor.donations[y] > 0)
    : [];

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
              <TableHead className="text-right font-semibold px-2 text-primary-foreground">הערות</TableHead>
              <TableHead className="text-center font-semibold px-2 text-primary-foreground whitespace-nowrap">תרומות {currentYear}</TableHead>
              <TableHead className="text-right font-semibold px-2 text-primary-foreground whitespace-nowrap">הערות {currentYear}</TableHead>
              <TableHead className="w-8 px-1" />
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
              <TableHead className="px-2">
                <div className="relative">
                  <Search className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input className="h-6 text-xs pr-6" value={filters.notes || ""} onChange={(e) => updateFilter("notes", e.target.value)} />
                </div>
              </TableHead>
              <TableHead className="px-2">
                <div className="relative">
                  <Search className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input className="h-6 text-xs pr-6 w-16 mx-auto" value={filters[currentYear] || ""} onChange={(e) => updateFilter(currentYear, e.target.value)} />
                </div>
              </TableHead>
              <TableHead />
              <TableHead />
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((donor, idx) => (
              <TableRow key={donor.id} className={idx % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                <TableCell className="font-mono text-muted-foreground px-2 text-xs">{donor.id}</TableCell>
                <TableCell className="px-2">{donor.title}</TableCell>
                <TableCell className="px-2 font-medium whitespace-nowrap">
                  <span className="flex items-center gap-1">
                    {donor.is_new && <Sparkles className="h-3.5 w-3.5 text-gold shrink-0" />}
                    {donor.full_name}
                  </span>
                </TableCell>
                <TableCell className="px-2">{donor.father_name}</TableCell>
                <TableCell className="px-2">{donor.city}</TableCell>
                <TableCell className="px-2">{donor.address}</TableCell>
                <TableCell className="px-2">{donor.house_number}</TableCell>
                <TableCell className="px-2">{donor.floor}</TableCell>
                <TableCell className="px-2 max-w-[120px] truncate text-xs">{donor.notes || "—"}</TableCell>
                <TableCell className="text-center px-2">
                  {donor.donations[currentYear] ? `₪${donor.donations[currentYear].toLocaleString()}` : "—"}
                </TableCell>
                <TableCell className="px-2 max-w-[100px] truncate text-xs">{donor.donation_notes?.[currentYear] || "—"}</TableCell>
                <TableCell className="px-1">
                  {previousYears.length > 0 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setHistoryId(donor.id)} title="היסטוריה">
                      <History className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </TableCell>
                <TableCell className="px-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditDonor({ ...donor, donations: { ...donor.donations }, donation_notes: { ...donor.donation_notes } })}>
                        <Pencil className="h-4 w-4 ml-2" /> עריכה
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        updateDonor.mutate({ id: donor.id, updates: { archived_at: new Date().toISOString() } }, {
                          onSuccess: () => toast.success("התורם הועבר לארכיון"),
                        });
                      }}><Archive className="h-4 w-4 ml-2" /> העברה לארכיון</DropdownMenuItem>
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
                <TableCell colSpan={columnFields.length + 5} className="text-center py-8 text-muted-foreground">
                  לא נמצאו תורמים
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>סה״כ: {filtered.length} תורמים</span>
        <span>| סה״כ {currentYear}: <span className="font-semibold text-foreground">₪{currentYearTotal.toLocaleString()}</span></span>
      </div>

      {/* History Dialog */}
      <Dialog open={!!historyDonor} onOpenChange={(open) => !open && setHistoryId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>היסטוריית תרומות - {historyDonor?.full_name}</DialogTitle></DialogHeader>
          {historyDonor && (
            <div className="space-y-3">
              {historyYearsWithData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">אין תרומות קודמות</p>
              ) : historyYearsWithData.map((y) => (
                <div key={y} className="border rounded-lg p-3 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-primary">{y}</span>
                    <span className="font-medium">₪{historyDonor.donations[y]?.toLocaleString()}</span>
                  </div>
                  {historyDonor.donation_notes?.[y] && (
                    <p className="text-sm text-muted-foreground">{historyDonor.donation_notes[y]}</p>
                  )}
                </div>
              ))}
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editDonor} onOpenChange={(open) => !open && setEditDonor(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto z-50">
          <DialogHeader><DialogTitle>עריכת תורם #{editDonor?.id}</DialogTitle></DialogHeader>
          {editDonor && (
            <div className="space-y-4" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); } }}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>תואר</Label>
                  <Select value={editDonor.title} onValueChange={(v) => setEditDonor({ ...editDonor, title: v })}>
                    <SelectTrigger><SelectValue placeholder="בחר תואר" /></SelectTrigger>
                    <SelectContent className="z-[200]">
                      {titleOptions.map((t) => <SelectItem key={t.id} value={t.value}>{t.value}</SelectItem>)}
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
                city={editDonor.city} address={editDonor.address} floor={editDonor.floor}
                onCityChange={(v) => setEditDonor({ ...editDonor, city: v, address: "" })}
                onAddressChange={(v) => setEditDonor({ ...editDonor, address: v })}
                onFloorChange={(v) => setEditDonor({ ...editDonor, floor: v })}
              />
              <div className="space-y-2">
                <Label>מספר בית</Label>
                <Input value={editDonor.house_number} onChange={(e) => setEditDonor({ ...editDonor, house_number: e.target.value })} placeholder="מספר בית" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="edit_is_new" checked={editDonor.is_new} onCheckedChange={(v) => setEditDonor({ ...editDonor, is_new: !!v })} />
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
                      <Input type="number" value={editDonor.donations[y] || ""} onChange={(e) => setEditDonor({
                        ...editDonor, donations: { ...editDonor.donations, [y]: e.target.value === "" ? 0 : Number(e.target.value) },
                      })} placeholder="₪0" />
                    </div>
                    <div className="space-y-1">
                      <Label>הערות {y}</Label>
                      <Input value={editDonor.donation_notes?.[y] || ""} onChange={(e) => setEditDonor({
                        ...editDonor, donation_notes: { ...editDonor.donation_notes, [y]: e.target.value },
                      })} placeholder="הערה..." />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={saveEdit} disabled={updateDonor.isPending}>{updateDonor.isPending ? "שומר..." : "שמור"}</Button>
                <Button variant="outline" onClick={() => setEditDonor(null)}>ביטול</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
