import { useState, useRef, useEffect } from "react";
import { useSettings, useSaveSetting } from "@/hooks/useSettings";
import { useDonors, useAddDonorsBatch } from "@/hooks/useDonors";
import { getDonorFields, Donor } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Upload, Download, Settings } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type ColumnMapping = Record<string, string>;

// Generate Hebrew years from תשס"ב to 30 years ahead
function generateAllHebrewYears(): string[] {
  const base = [
    'תשס"ב', 'תשס"ג', 'תשס"ד', 'תשס"ה', 'תשס"ו', 'תשס"ז', 'תשס"ח', 'תשס"ט',
    'תש"ע', 'תשע"א', 'תשע"ב', 'תשע"ג', 'תשע"ד', 'תשע"ה', 'תשע"ו', 'תשע"ז', 'תשע"ח', 'תשע"ט',
    'תש"פ', 'תשפ"א', 'תשפ"ב', 'תשפ"ג', 'תשפ"ד', 'תשפ"ה', 'תשפ"ו', 'תשפ"ז', 'תשפ"ח', 'תשפ"ט',
    'תש"צ', 'תשצ"א', 'תשצ"ב', 'תשצ"ג', 'תשצ"ד', 'תשצ"ה', 'תשצ"ו', 'תשצ"ז', 'תשצ"ח', 'תשצ"ט',
    'ת"ת', 'תת"א', 'תת"ב', 'תת"ג', 'תת"ד', 'תת"ה',
  ];
  return base;
}

const HEBREW_YEARS = generateAllHebrewYears();

function generateYearsList(currentYear: string, count: number): string[] {
  const idx = HEBREW_YEARS.indexOf(currentYear);
  if (idx === -1) return [currentYear];
  const start = Math.max(0, idx - count + 1);
  return HEBREW_YEARS.slice(start, idx + 1);
}

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
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: donors = [] } = useDonors();
  const saveSetting = useSaveSetting();
  const addBatch = useAddDonorsBatch();

  const yearsList = settings?.years_list || ['תשפ"ג', 'תשפ"ד', 'תשפ"ה'];
  const currentYear = settings?.current_year || 'תשפ"ה';
  const yearCount = settings?.year_count || 3;
  const DONOR_FIELDS = getDonorFields(yearsList);

  const [importTarget, setImportTarget] = useState("donors");
  const [exportTarget, setExportTarget] = useState("donors");
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [fileData, setFileData] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [exportFields, setExportFields] = useState<string[]>(DONOR_FIELDS.map((f) => f.key));
  const [exportFormat, setExportFormat] = useState<"xlsx" | "csv">("xlsx");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setExportFields(DONOR_FIELDS.map((f) => f.key));
  }, [yearsList.join(",")]);

  const handleYearChange = async (newYear: string) => {
    const newList = generateYearsList(newYear, yearCount);
    await saveSetting.mutateAsync({ key: "current_year", value: newYear });
    await saveSetting.mutateAsync({ key: "years_list", value: newList });
    toast.success(`השנה הנוכחית עודכנה ל-${newYear}`);
  };

  const handleYearCountChange = async (newCount: number) => {
    const newList = generateYearsList(currentYear, newCount);
    await saveSetting.mutateAsync({ key: "year_count", value: newCount });
    await saveSetting.mutateAsync({ key: "years_list", value: newList });
    toast.success(`מציג ${newCount} שנים`);
  };

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
    const newDonors: Omit<Donor, "id" | "created_at" | "updated_at">[] = fileData.map((row) => {
      const d: Omit<Donor, "id" | "created_at" | "updated_at"> = {
        title: "", full_name: "", father_name: "", phone: "", city: "", address: "", floor: "", is_new: true, notes: "", donations: {}, donation_notes: {},
      };
      Object.entries(mapping).forEach(([fileCol, fieldKey]) => {
        const val = row[fileCol] || "";
        if (yearsList.includes(fieldKey)) {
          d.donations[fieldKey] = Number(val) || 0;
        } else if (fieldKey === "is_new") {
          d.is_new = val === "true" || val === "1" || val === "כן";
        } else if (fieldKey !== "id" && fieldKey in d) {
          (d as any)[fieldKey] = val;
        }
      });
      return d;
    });
    addBatch.mutate(newDonors, {
      onSuccess: () => {
        setFileData([]);
        setFileColumns([]);
        setMapping({});
        toast.success(`${newDonors.length} תורמים יובאו בהצלחה`);
      },
      onError: () => toast.error("שגיאה ביבוא הנתונים"),
    });
  };

  const handleExport = () => {
    const headers = DONOR_FIELDS.filter((f) => exportFields.includes(f.key));
    const rows = donors.map((d) => {
      const row: Record<string, string | number | boolean> = {};
      headers.forEach((h) => {
        if (yearsList.includes(h.key)) {
          row[h.label] = d.donations[h.key] || 0;
        } else {
          row[h.label] = (d as any)[h.key] ?? "";
        }
      });
      return row;
    });

    const sheetName = exportTarget === "donors" ? "תורמים" : "בחורים";
    const fileName = exportTarget === "donors" ? "donors_export" : "bachurim_export";

    if (exportFormat === "xlsx") {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    } else {
      const csvRows = [
        headers.map((h) => h.label).join(","),
        ...donors.map((d) =>
          headers.map((h) => {
            if (yearsList.includes(h.key)) return d.donations[h.key] || 0;
            return `"${(d as any)[h.key] ?? ""}"`;
          }).join(",")
        ),
      ];
      const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.csv`;
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

  if (settingsLoading) return <div className="text-center py-8 text-muted-foreground">טוען...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Year Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            הגדרות שנים
          </CardTitle>
          <CardDescription>בחירת השנה הנוכחית וכמות השנים המוצגות</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>שנה נוכחית</Label>
              <Select value={currentYear} onValueChange={handleYearChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HEBREW_YEARS.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>כמות שנים להצגה</Label>
              <Select value={String(yearCount)} onValueChange={(v) => handleYearCountChange(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} שנים</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            שנים מוצגות: <span className="font-medium text-foreground">{yearsList.join("  ←  ")}</span>
          </div>
        </CardContent>
      </Card>

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
                <SelectItem value="bachurim" disabled>בחורים (בקרוב)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
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
                    onValueChange={(v) => setMapping((prev) => ({ ...prev, [col]: v === "_skip" ? "" : v }))}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_skip">דלג</SelectItem>
                      {DONOR_FIELDS.filter((f) => f.key !== "id").map((f) => (
                        <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <Button onClick={handleImport} disabled={addBatch.isPending}>
                {addBatch.isPending ? "מייבא..." : `ייבא ${fileData.length} שורות`}
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
          <div className="space-y-2">
            <Label>יעד יצוא</Label>
            <Select value={exportTarget} onValueChange={setExportTarget}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="donors">רשימת תורמים</SelectItem>
                <SelectItem value="bachurim">רשימת בחורים</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
