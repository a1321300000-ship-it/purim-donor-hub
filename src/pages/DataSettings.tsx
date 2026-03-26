import { useState, useRef } from "react";
import { getDonors, saveDonors, getNextId, Donor, DONOR_FIELDS, DONATION_YEARS } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Upload, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type ColumnMapping = Record<string, string>;

function parseFile(file: File): Promise<{ columns: string[]; rows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const isCSV = file.name.endsWith(".csv") || file.name.endsWith(".txt");

    reader.onload = (ev) => {
      try {
        if (isCSV) {
          const text = ev.target?.result as string;
          const lines = text.split("\n").filter((l) => l.trim());
          if (lines.length < 2) { resolve({ columns: [], rows: [] }); return; }
          const columns = lines[0].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
          const rows = lines.slice(1).map((line) => {
            const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
            const row: Record<string, string> = {};
            columns.forEach((col, i) => (row[col] = vals[i] || ""));
            return row;
          });
          resolve({ columns, rows });
        } else {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
          const columns = json.length > 0 ? Object.keys(json[0]) : [];
          const rows = json.map((r) => {
            const row: Record<string, string> = {};
            columns.forEach((c) => (row[c] = String(r[c] ?? "")));
            return row;
          });
          resolve({ columns, rows });
        }
      } catch (err) {
        reject(err);
      }
    };

    if (isCSV) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  });
}

export default function DataSettings() {
  const [importTarget, setImportTarget] = useState("donors");
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [fileData, setFileData] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [exportFields, setExportFields] = useState<string[]>(DONOR_FIELDS.map((f) => f.key));
  const [exportFormat, setExportFormat] = useState<"xlsx" | "csv">("xlsx");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { columns, rows } = await parseFile(file);
      setFileColumns(columns);
      setFileData(rows);
      const autoMap: ColumnMapping = {};
      columns.forEach((col) => {
        const match = DONOR_FIELDS.find((f) => f.label === col || f.key === col);
        if (match) autoMap[col] = match.key;
      });
      setMapping(autoMap);
      toast.info(`נטענו ${rows.length} שורות עם ${columns.length} עמודות`);
    } catch {
      toast.error("שגיאה בקריאת הקובץ");
    }
    e.target.value = "";
  };

  const handleImport = () => {
    if (fileData.length === 0) return;
    const donors = getDonors();
    const newDonors: Donor[] = fileData.map((row) => {
      const d: Donor = { id: getNextId(), fullName: "", phone: "", city: "", address: "", notes: "", donations: {} };
      Object.entries(mapping).forEach(([fileCol, fieldKey]) => {
        const val = row[fileCol] || "";
        if (DONATION_YEARS.includes(fieldKey as typeof DONATION_YEARS[number])) {
          d.donations[fieldKey] = Number(val) || 0;
        } else if (fieldKey !== "id") {
          (d as any)[fieldKey] = val;
        }
      });
      return d;
    });
    saveDonors([...donors, ...newDonors]);
    setFileData([]);
    setFileColumns([]);
    setMapping({});
    toast.success(`${newDonors.length} תורמים יובאו בהצלחה`);
  };

  const handleExport = () => {
    const donors = getDonors();
    const headers = DONOR_FIELDS.filter((f) => exportFields.includes(f.key));

    const rows = donors.map((d) => {
      const row: Record<string, string | number> = {};
      headers.forEach((h) => {
        if (DONATION_YEARS.includes(h.key as typeof DONATION_YEARS[number])) {
          row[h.label] = d.donations[h.key] || 0;
        } else {
          row[h.label] = (d as any)[h.key] ?? "";
        }
      });
      return row;
    });

    if (exportFormat === "xlsx") {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "תורמים");
      XLSX.writeFile(wb, "donors_export.xlsx");
    } else {
      const csvRows = [
        headers.map((h) => h.label).join(","),
        ...donors.map((d) =>
          headers.map((h) => {
            if (DONATION_YEARS.includes(h.key as typeof DONATION_YEARS[number])) return d.donations[h.key] || 0;
            return `"${(d as any)[h.key] ?? ""}"`;
          }).join(",")
        ),
      ];
      const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "donors_export.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
    toast.success("הקובץ יוצא בהצלחה");
  };

  const toggleExportField = (key: string) => {
    setExportFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            יבוא נתונים
          </CardTitle>
          <CardDescription>העלאת קובץ Excel או CSV עם מיפוי עמודות לשדות המערכת</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>יעד יבוא</Label>
            <Select value={importTarget} onValueChange={setImportTarget}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="donors">תורמים</SelectItem>
                <SelectItem value="boys" disabled>בחורים (בקרוב)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,.xlsx,.xls"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 ml-2" />
            בחר קובץ (Excel / CSV)
          </Button>

          {fileColumns.length > 0 && (
            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              <h4 className="font-medium text-sm">מיפוי עמודות</h4>
              {fileColumns.map((col) => (
                <div key={col} className="flex items-center gap-3">
                  <span className="text-sm w-32 truncate font-mono">{col}</span>
                  <span className="text-muted-foreground">←</span>
                  <Select
                    value={mapping[col] || "_skip"}
                    onValueChange={(v) =>
                      setMapping((prev) => ({ ...prev, [col]: v === "_skip" ? "" : v }))
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_skip">דלג</SelectItem>
                      {DONOR_FIELDS.filter((f) => f.key !== "id").map((f) => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <Button onClick={handleImport}>
                ייבא {fileData.length} שורות
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            יצוא נתונים
          </CardTitle>
          <CardDescription>בחירת שדות ויצוא לקובץ Excel או CSV</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {DONOR_FIELDS.map((f) => (
              <label key={f.key} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={exportFields.includes(f.key)}
                  onCheckedChange={() => toggleExportField(f.key)}
                />
                {f.label}
              </label>
            ))}
          </div>
          <div className="space-y-2">
            <Label>פורמט יצוא</Label>
            <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as "xlsx" | "csv")}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 ml-2" />
            ייצא לקובץ
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
