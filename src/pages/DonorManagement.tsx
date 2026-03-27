import { useState, useMemo } from "react";
import { useDonors, useUpdateDonor, useDeleteDonor } from "@/hooks/useDonors";
import { useSettings } from "@/hooks/useSettings";
import { Donor } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function DonorManagement() {
  const { data: donors = [], isLoading } = useDonors();
  const { data: settings } = useSettings();
  const updateDonor = useUpdateDonor();
  const deleteDonorMut = useDeleteDonor();

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [editDonor, setEditDonor] = useState<Donor | null>(null);

  const yearsList = settings?.years_list || ['תשפ"ג', 'תשפ"ד', 'תשפ"ה'];

  const updateFilter = (key: string, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const handleDelete = (id: number) => {
    deleteDonorMut.mutate(id, {
      onSuccess: () => toast.success("התורם נמחק"),
    });
  };

  const saveEdit = () => {
    if (!editDonor) return;
    updateDonor.mutate(
      {
        id: editDonor.id,
        updates: {
          full_name: editDonor.full_name,
          phone: editDonor.phone,
          city: editDonor.city,
          address: editDonor.address,
          notes: editDonor.notes,
          donations: editDonor.donations,
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

  const filtered = useMemo(() => {
    return donors.filter((d) => {
      const f = filters;
      if (f.full_name && !d.full_name.includes(f.full_name)) return false;
      if (f.phone && !d.phone.includes(f.phone)) return false;
      if (f.city && !d.city.includes(f.city)) return false;
      if (f.address && !d.address.includes(f.address)) return false;
      if (f.notes && !d.notes.includes(f.notes)) return false;
      for (const y of yearsList) {
        if (f[y] && !(d.donations[y]?.toString() || "0").includes(f[y])) return false;
      }
      return true;
    });
  }, [donors, filters, yearsList]);

  const totals = useMemo(() => {
    return yearsList.reduce((acc, y) => {
      acc[y] = filtered.reduce((sum, d) => sum + (d.donations[y] || 0), 0);
      return acc;
    }, {} as Record<string, number>);
  }, [filtered, yearsList]);

  const columnFields = ["full_name", "phone", "city", "address", "notes"] as const;
  const columnLabels: Record<string, string> = {
    full_name: "שם מלא", phone: "טלפון", city: "עיר", address: "כתובת", notes: "הערות",
  };

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">טוען נתונים...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-semibold w-16">מזהה</TableHead>
              {columnFields.map((key) => (
                <TableHead key={key} className="text-right font-semibold">
                  {columnLabels[key]}
                </TableHead>
              ))}
              {yearsList.map((y) => (
                <TableHead key={y} className="text-center font-semibold min-w-[100px]">
                  תרומות {y}
                </TableHead>
              ))}
              <TableHead className="w-10" />
            </TableRow>
            <TableRow className="bg-muted/20">
              <TableHead />
              {columnFields.map((key) => (
                <TableHead key={key}>
                  <Input
                    className="h-7 text-xs"
                    placeholder="סנן..."
                    value={filters[key] || ""}
                    onChange={(e) => updateFilter(key, e.target.value)}
                  />
                </TableHead>
              ))}
              {yearsList.map((y) => (
                <TableHead key={y}>
                  <Input
                    className="h-7 text-xs w-20 mx-auto"
                    placeholder="סנן..."
                    value={filters[y] || ""}
                    onChange={(e) => updateFilter(y, e.target.value)}
                  />
                </TableHead>
              ))}
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((donor) => (
              <TableRow
                key={donor.id}
                className="hover:bg-muted/30 cursor-pointer"
                onClick={() => setEditDonor({ ...donor, donations: { ...donor.donations } })}
              >
                <TableCell className="font-mono text-muted-foreground">{donor.id}</TableCell>
                <TableCell className="font-medium">{donor.full_name}</TableCell>
                <TableCell dir="ltr" className="text-left">{donor.phone}</TableCell>
                <TableCell>{donor.city}</TableCell>
                <TableCell>{donor.address}</TableCell>
                <TableCell className="text-sm max-w-[180px] truncate">{donor.notes || "—"}</TableCell>
                {yearsList.map((y) => (
                  <TableCell key={y} className="text-center">
                    {donor.donations[y] ? `₪${donor.donations[y].toLocaleString()}` : "—"}
                  </TableCell>
                ))}
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); handleDelete(donor.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7 + yearsList.length} className="text-center py-8 text-muted-foreground">
                  לא נמצאו תורמים
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
        <span>סה״כ תורמים: {filtered.length}</span>
        {yearsList.map((y) => (
          <span key={y}>
            | סה״כ {y}: <span className="font-semibold text-foreground">₪{totals[y]?.toLocaleString()}</span>
          </span>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editDonor} onOpenChange={(open) => !open && setEditDonor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>עריכת תורם #{editDonor?.id}</DialogTitle>
          </DialogHeader>
          {editDonor && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>שם מלא</Label>
                <Input value={editDonor.full_name} onChange={(e) => setEditDonor({ ...editDonor, full_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>טלפון</Label>
                  <Input value={editDonor.phone} onChange={(e) => setEditDonor({ ...editDonor, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>עיר</Label>
                  <Input value={editDonor.city} onChange={(e) => setEditDonor({ ...editDonor, city: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>כתובת</Label>
                <Input value={editDonor.address} onChange={(e) => setEditDonor({ ...editDonor, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>הערות</Label>
                <Textarea value={editDonor.notes} onChange={(e) => setEditDonor({ ...editDonor, notes: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {yearsList.map((y) => (
                  <div key={y} className="space-y-1">
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
