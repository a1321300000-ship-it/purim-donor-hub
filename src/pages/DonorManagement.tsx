import { useState, useEffect, useCallback } from "react";
import { getDonors, saveDonors, Donor, DONATION_YEARS } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export default function DonorManagement() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setDonors(getDonors());
  }, []);

  const save = useCallback((updated: Donor[]) => {
    setDonors(updated);
    saveDonors(updated);
  }, []);

  const updateField = (id: number, field: keyof Donor, value: string) => {
    save(donors.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const updateDonation = (id: number, year: string, amount: string) => {
    const num = amount === "" ? 0 : Number(amount);
    save(
      donors.map((d) =>
        d.id === id ? { ...d, donations: { ...d.donations, [year]: num } } : d
      )
    );
  };

  const deleteDonor = (id: number) => {
    save(donors.filter((d) => d.id !== id));
    toast.success("התורם נמחק");
  };

  const filtered = donors.filter(
    (d) =>
      d.fullName.includes(search) ||
      d.phone.includes(search) ||
      d.email.includes(search)
  );

  const totals = DONATION_YEARS.reduce((acc, y) => {
    acc[y] = filtered.reduce((sum, d) => sum + (d.donations[y] || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש תורם..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-semibold w-16">מזהה</TableHead>
              <TableHead className="text-right font-semibold">שם מלא</TableHead>
              <TableHead className="text-right font-semibold">טלפון</TableHead>
              <TableHead className="text-right font-semibold">דוא״ל</TableHead>
              <TableHead className="text-right font-semibold min-w-[180px]">הערות</TableHead>
              {DONATION_YEARS.map((y) => (
                <TableHead key={y} className="text-center font-semibold min-w-[100px]">
                  תרומות {y}
                </TableHead>
              ))}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((donor) => (
              <TableRow key={donor.id} className="hover:bg-muted/30">
                <TableCell className="font-mono text-muted-foreground">{donor.id}</TableCell>
                <TableCell className="font-medium">{donor.fullName}</TableCell>
                <TableCell dir="ltr" className="text-left">{donor.phone}</TableCell>
                <TableCell dir="ltr" className="text-left text-sm">{donor.email || "—"}</TableCell>
                <TableCell>
                  <Textarea
                    className="h-8 min-h-[32px] w-full text-sm resize-none"
                    value={donor.notes}
                    onChange={(e) => updateField(donor.id, "notes", e.target.value)}
                    placeholder="הערות..."
                  />
                </TableCell>
                {DONATION_YEARS.map((y) => (
                  <TableCell key={y}>
                    <Input
                      type="number"
                      className="h-8 w-24 text-center mx-auto"
                      value={donor.donations[y] || ""}
                      onChange={(e) => updateDonation(donor.id, y, e.target.value)}
                      placeholder="₪0"
                    />
                  </TableCell>
                ))}
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
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  לא נמצאו תורמים
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
        <span>סה״כ תורמים: {filtered.length}</span>
        {DONATION_YEARS.map((y) => (
          <span key={y}>
            | סה״כ {y}: <span className="font-semibold text-foreground">₪{totals[y]?.toLocaleString()}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
