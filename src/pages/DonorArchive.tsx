import { useMemo } from "react";
import { useDonors, useUpdateDonor } from "@/hooks/useDonors";
import { useSettings } from "@/hooks/useSettings";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArchiveRestore } from "lucide-react";
import { toast } from "sonner";

export default function DonorArchive() {
  const { data: donors = [], isLoading } = useDonors();
  const { data: settings } = useSettings();
  const updateDonor = useUpdateDonor();

  const yearsList = settings?.years_list || ['תשפ"ג', 'תשפ"ד', 'תשפ"ה'];
  const currentYear = settings?.current_year || yearsList[yearsList.length - 1];

  const archived = useMemo(() => donors.filter((d) => d.archived_at), [donors]);

  const handleRestore = (id: number) => {
    updateDonor.mutate(
      { id, updates: { archived_at: null } },
      { onSuccess: () => toast.success("התורם שוחזר בהצלחה") }
    );
  };

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">טוען נתונים...</div>;

  return (
    <div className="space-y-3">
      <div className="border rounded-lg overflow-auto bg-card">
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="bg-primary text-primary-foreground">
              <TableHead className="text-right font-semibold px-2 text-primary-foreground">ID</TableHead>
              <TableHead className="text-right font-semibold px-2 text-primary-foreground">שם מלא</TableHead>
              <TableHead className="text-right font-semibold px-2 text-primary-foreground">שם האב</TableHead>
              <TableHead className="text-right font-semibold px-2 text-primary-foreground">עיר</TableHead>
              <TableHead className="text-right font-semibold px-2 text-primary-foreground">רחוב</TableHead>
              <TableHead className="text-center font-semibold px-2 text-primary-foreground">תרומות {currentYear}</TableHead>
              <TableHead className="text-right font-semibold px-2 text-primary-foreground">הערות</TableHead>
              <TableHead className="w-10 px-1" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {archived.map((donor, idx) => (
              <TableRow key={donor.id} className={idx % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                <TableCell className="font-mono text-muted-foreground px-2 text-xs">{donor.id}</TableCell>
                <TableCell className="px-2 font-medium">{donor.full_name}</TableCell>
                <TableCell className="px-2">{donor.father_name}</TableCell>
                <TableCell className="px-2">{donor.city}</TableCell>
                <TableCell className="px-2">{donor.address}</TableCell>
                <TableCell className="text-center px-2">
                  {donor.donations[currentYear] ? `₪${donor.donations[currentYear].toLocaleString()}` : "—"}
                </TableCell>
                <TableCell className="px-2 max-w-[120px] truncate text-xs">{donor.notes || "—"}</TableCell>
                <TableCell className="px-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRestore(donor.id)} title="שחזור">
                    <ArchiveRestore className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {archived.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  אין תורמים בארכיון
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="text-sm text-muted-foreground">סה״כ: {archived.length} תורמים בארכיון</div>
    </div>
  );
}
