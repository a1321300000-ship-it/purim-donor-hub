import { useState, useEffect, useCallback } from "react";
import { getDonors, saveDonors, getCurrentYear, Donor } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

const PAST_YEARS = ["תשפ״ב", "תשפ״ג", "תשפ״ד"];

export default function DonorManagement() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [currentYear, setCurrentYear] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDonor, setNewDonor] = useState({ fullName: "", address: "", phone: "" });

  useEffect(() => {
    setDonors(getDonors());
    setCurrentYear(getCurrentYear());
  }, []);

  const save = useCallback((updated: Donor[]) => {
    setDonors(updated);
    saveDonors(updated);
  }, []);

  const updateDonorField = (id: string, field: string, value: string | number) => {
    const updated = donors.map((d) =>
      d.id === id ? { ...d, [field]: value } : d
    );
    save(updated);
  };

  const updateDonation = (id: string, amount: string) => {
    const num = amount === "" ? 0 : Number(amount);
    const updated = donors.map((d) =>
      d.id === id
        ? { ...d, donations: { ...d.donations, [currentYear]: num } }
        : d
    );
    save(updated);
  };

  const addDonor = () => {
    if (!newDonor.fullName.trim()) return;
    const donor: Donor = {
      id: Date.now().toString(),
      fullName: newDonor.fullName,
      address: newDonor.address,
      phone: newDonor.phone,
      notes: "",
      donations: {},
      currentNotes: "",
    };
    save([...donors, donor]);
    setNewDonor({ fullName: "", address: "", phone: "" });
    setDialogOpen(false);
    toast.success("התורם נוסף בהצלחה");
  };

  const deleteDonor = (id: string) => {
    save(donors.filter((d) => d.id !== id));
    toast.success("התורם נמחק");
  };

  const filtered = donors.filter(
    (d) =>
      d.fullName.includes(search) ||
      d.address.includes(search) ||
      d.phone.includes(search)
  );

  const totalCurrent = filtered.reduce(
    (sum, d) => sum + (d.donations[currentYear] || 0),
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש תורם..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              הוסף תורם
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>הוספת תורם חדש</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>שם מלא</Label>
                <Input
                  value={newDonor.fullName}
                  onChange={(e) => setNewDonor({ ...newDonor, fullName: e.target.value })}
                />
              </div>
              <div>
                <Label>כתובת</Label>
                <Input
                  value={newDonor.address}
                  onChange={(e) => setNewDonor({ ...newDonor, address: e.target.value })}
                />
              </div>
              <div>
                <Label>טלפון</Label>
                <Input
                  value={newDonor.phone}
                  onChange={(e) => setNewDonor({ ...newDonor, phone: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={addDonor}>הוסף</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-semibold">שם מלא</TableHead>
              <TableHead className="text-right font-semibold">כתובת</TableHead>
              <TableHead className="text-right font-semibold">טלפון</TableHead>
              <TableHead className="text-right font-semibold">הערות</TableHead>
              {PAST_YEARS.map((y) => (
                <TableHead key={y} className="text-center font-semibold min-w-[90px]">
                  {y}
                </TableHead>
              ))}
              <TableHead className="text-center font-semibold min-w-[110px] bg-accent/50">
                {currentYear || "שנה נוכחית"}
              </TableHead>
              <TableHead className="text-right font-semibold min-w-[140px] bg-accent/50">
                הערות {currentYear}
              </TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((donor) => (
              <TableRow key={donor.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{donor.fullName}</TableCell>
                <TableCell className="text-muted-foreground">{donor.address}</TableCell>
                <TableCell dir="ltr" className="text-left">{donor.phone}</TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-[150px] truncate">
                  {donor.notes}
                </TableCell>
                {PAST_YEARS.map((y) => (
                  <TableCell key={y} className="text-center tabular-nums">
                    {donor.donations[y] ? `₪${donor.donations[y].toLocaleString()}` : "—"}
                  </TableCell>
                ))}
                <TableCell className="bg-accent/20">
                  <Input
                    type="number"
                    className="h-8 w-24 text-center mx-auto"
                    value={donor.donations[currentYear] || ""}
                    onChange={(e) => updateDonation(donor.id, e.target.value)}
                    placeholder="₪0"
                  />
                </TableCell>
                <TableCell className="bg-accent/20">
                  <Input
                    className="h-8 w-full"
                    value={donor.currentNotes}
                    onChange={(e) => updateDonorField(donor.id, "currentNotes", e.target.value)}
                    placeholder="הערות..."
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteDonor(donor.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  לא נמצאו תורמים
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>סה״כ תורמים: {filtered.length}</span>
        <span>|</span>
        <span className="font-semibold text-foreground">
          סה״כ תרומות {currentYear}: ₪{totalCurrent.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
