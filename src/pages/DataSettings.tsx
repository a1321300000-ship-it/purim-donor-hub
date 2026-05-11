import { useState, useRef, useEffect } from "react";
import { useSettings, useSaveSetting } from "@/hooks/useSettings";
import { useDonors, useAddDonorsBatch, useDeleteDonorsBatch, useDeleteAllDonors, useResetDonorSequence } from "@/hooks/useDonors";
import { useBachurim, useAddBachurimBatch, useDeleteBachurimBatch, useResetBachurSequence } from "@/hooks/useBachurim";
import { useSelectOptions } from "@/hooks/useSelectOptions";
import { useGroups, useDeleteAllGroups, useResetGroupSequence } from "@/hooks/useGroups";
import { getDonorFields, getBachurFields, Donor, Bachur } from "@/lib/store";
import { ListManager } from "@/components/ListManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Upload, Download, Settings, Trash2, RotateCcw, Shield, Eye, EyeOff, MapPin } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type ColumnMapping = Record<string, string>;

function generateAllHebrewYears(): string[] {
  return [
    'תשס"ב', 'תשס"ג', 'תשס"ד', 'תשס"ה', 'תשס"ו', 'תשס"ז', 'תשס"ח', 'תשס"ט',
    'תש"ע', 'תשע"א', 'תשע"ב', 'תשע"ג', 'תשע"ד', 'תשע"ה', 'תשע"ו', 'תשע"ז', 'תשע"ח', 'תשע"ט',
    'תש"פ', 'תשפ"א', 'תשפ"ב', 'תשפ"ג', 'תשפ"ד', 'תשפ"ה', 'תשפ"ו', 'תשפ"ז', 'תשפ"ח', 'תשפ"ט',
    'תש"צ', 'תשצ"א', 'תשצ"ב', 'תשצ"ג', 'תשצ"ד', 'תשצ"ה', 'תשצ"ו', 'תשצ"ז', 'תשצ"ח', 'תשצ"ט',
    'ת"ת', 'תת"א', 'תת"ב', 'תת"ג', 'תת"ד', 'תת"ה',
  ];
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
      } catch (err) { reject(err); }
    };
    if (isCSV) reader.readAsText(file); else reader.readAsArrayBuffer(file);
  });
}

// All donor fields including hidden ones
const ALL_DONOR_FIELDS = [
  { key: "id", label: "מזהה" },
  { key: "title", label: "תואר" },
  { key: "first_name", label: "שם פרטי" },
  { key: "last_name", label: "שם משפחה" },
  { key: "father_name", label: "שם האב" },
  { key: "phone", label: "טלפון" },
  { key: "city", label: "עיר" },
  { key: "address", label: "רחוב" },
  { key: "house_number", label: "מספר בית" },
  { key: "floor", label: "קומה" },
  { key: "is_new", label: "תורם חדש" },
  { key: "notes", label: "הערות" },
];

// All bachur fields - ONLY these fields
const ALL_BACHUR_FIELDS = [
  { key: "id", label: "מזהה" },
  { key: "first_name", label: "שם פרטי" },
  { key: "last_name", label: "שם משפחה" },
  { key: "father_name", label: "שם האב" },
  { key: "yeshiva", label: "ישיבה" },
  { key: "shiur", label: "שיעור" },
  { key: "notes", label: "הערות" },
];

export default function DataSettings() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: donors = [] } = useDonors();
  const { data: bachurim = [] } = useBachurim();
  const { data: titleOptions = [] } = useSelectOptions("title");
  const { data: yeshivot = [] } = useSelectOptions("yeshiva");
  const saveSetting = useSaveSetting();
  const addDonorsBatch = useAddDonorsBatch();
  const addBachurimBatch = useAddBachurimBatch();
  const deleteDonorsBatch = useDeleteDonorsBatch();
  const deleteAllDonorsMut = useDeleteAllDonors();
  const deleteBachurimBatch = useDeleteBachurimBatch();
  const resetDonorSeq = useResetDonorSequence();
  const resetBachurSeq = useResetBachurSequence();
  const { data: groupsData = [] } = useGroups();
  const deleteAllGroups = useDeleteAllGroups();
  const resetGroupSeq = useResetGroupSequence();
  const yearsList = settings?.years_list || ['תשפ"ג', 'תשפ"ד', 'תשפ"ה'];
  const currentYear = settings?.current_year || 'תשפ"ה';
  const yearCount = settings?.year_count || 3;

  const donorExportFields = [
    ...ALL_DONOR_FIELDS,
    ...yearsList.map((y) => ({ key: y, label: `תרומות ${y}` })),
    ...yearsList.map((y) => ({ key: `note_${y}`, label: `הערות ${y}` })),
  ];
  const bachurExportFields = ALL_BACHUR_FIELDS;

  const DONOR_FIELDS = [
    ...getDonorFields(yearsList),
    ...yearsList.map((y) => ({ key: `donation_note_${y}`, label: `הערות ${y}` })),
  ];
  const BACHUR_FIELDS = getBachurFields();

  const [importTarget, setImportTarget] = useState("donors");
  const [exportTarget, setExportTarget] = useState("donors");
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [fileData, setFileData] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [exportFields, setExportFields] = useState<string[]>(donorExportFields.map((f) => f.key));
  const [exportFormat, setExportFormat] = useState<"xlsx" | "csv">("xlsx");
  const [filterCity, setFilterCity] = useState("");
  const [filterTitle, setFilterTitle] = useState("");
  const [filterYeshiva, setFilterYeshiva] = useState("");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Confirm dialogs
  const [deleteAllDonorsOpen, setDeleteAllDonorsOpen] = useState(false);
  const [resetDonorSeqOpen, setResetDonorSeqOpen] = useState(false);
  const [deleteAllBachurimOpen, setDeleteAllBachurimOpen] = useState(false);
  const [resetBachurSeqOpen, setResetBachurSeqOpen] = useState(false);
  const [deleteAllGroupsOpen, setDeleteAllGroupsOpen] = useState(false);
  const [resetGroupSeqOpen, setResetGroupSeqOpen] = useState(false);

  // Access PIN management
  const currentPin = settings?.access_pin || "9999";
  const [pinInput, setPinInput] = useState("");
  const [showPin, setShowPin] = useState(false);
  useEffect(() => { setPinInput(typeof currentPin === "string" ? currentPin : "9999"); }, [currentPin]);

  const handleSavePin = async () => {
    const clean = pinInput.replace(/\D/g, "");
    if (clean.length < 4) { toast.error("הקוד חייב להכיל לפחות 4 ספרות"); return; }
    await saveSetting.mutateAsync({ key: "access_pin", value: clean });
    toast.success("קוד הגישה עודכן");
  };

  const activeFields = exportTarget === "donors" ? donorExportFields : bachurExportFields;
  const importFields = importTarget === "donors" ? DONOR_FIELDS : BACHUR_FIELDS;

  useEffect(() => {
    setExportFields(activeFields.map((f) => f.key));
    setFilterCity(""); setFilterTitle(""); setFilterYeshiva(""); setFilterMinAmount("");
  }, [exportTarget, yearsList.join(",")]);

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

  // Delete all donors
  const handleDeleteAllDonors = () => {
    deleteAllDonorsMut.mutate(undefined, {
      onSuccess: () => { toast.success("כל התורמים נמחקו"); setDeleteAllDonorsOpen(false); },
      onError: () => toast.error("שגיאה במחיקת התורמים"),
    });
  };

  const handleResetDonorSeq = () => {
    resetDonorSeq.mutate(undefined, {
      onSuccess: () => { toast.success("מונה ID תורמים אופס ל-1"); setResetDonorSeqOpen(false); },
      onError: () => toast.error("שגיאה באיפוס המונה"),
    });
  };

  // Delete all bachurim
  const handleDeleteAllBachurim = () => {
    const ids = bachurim.map((b) => b.id);
    if (ids.length === 0) { toast.info("אין בחורים למחיקה"); setDeleteAllBachurimOpen(false); return; }
    deleteBachurimBatch.mutate(ids, {
      onSuccess: () => { toast.success(`${ids.length} בחורים נמחקו`); setDeleteAllBachurimOpen(false); },
      onError: () => toast.error("שגיאה במחיקת הבחורים"),
    });
  };

  const handleResetBachurSeq = () => {
    resetBachurSeq.mutate(undefined, {
      onSuccess: () => { toast.success("מונה ID בחורים אופס ל-1"); setResetBachurSeqOpen(false); },
      onError: () => toast.error("שגיאה באיפוס המונה"),
    });
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
        const match = importFields.find((f) => f.label === col || f.key === col);
        if (match) autoMap[col] = match.key;
      });
      setMapping(autoMap);
      toast.info(`נטענו ${rows.length} שורות עם ${columns.length} עמודות`);
    } catch { toast.error("שגיאה בקריאת הקובץ"); }
    e.target.value = "";
  };

  const handleImport = () => {
    if (fileData.length === 0) return;
    if (importTarget === "donors") {
      const newDonors: Omit<Donor, "id" | "created_at" | "updated_at" | "full_name">[] = fileData.map((row) => {
        const d: Omit<Donor, "id" | "created_at" | "updated_at" | "full_name"> = {
          title: "", first_name: "", last_name: "", father_name: "", phone: "", city: "", address: "", house_number: "", floor: "", is_new: true, notes: "", donations: {}, donation_notes: {},
        };
        Object.entries(mapping).forEach(([fileCol, fieldKey]) => {
          const val = row[fileCol] || "";
          if (yearsList.includes(fieldKey)) {
            d.donations[fieldKey] = Number(val) || 0;
          } else if (fieldKey.startsWith("donation_note_")) {
            const year = fieldKey.replace("donation_note_", "");
            d.donation_notes[year] = val;
          } else if (fieldKey === "is_new") {
            d.is_new = val === "true" || val === "1" || val === "כן" || val.toLowerCase() === "yes" || val === "✓" || val === "✔";
          } else if (fieldKey !== "id" && fieldKey !== "full_name" && fieldKey in d) {
            (d as any)[fieldKey] = val;
          }
        });
        return d;
      });
      addDonorsBatch.mutate(newDonors, {
        onSuccess: () => { clearImport(); toast.success(`${newDonors.length} תורמים יובאו בהצלחה`); },
        onError: () => toast.error("שגיאה ביבוא הנתונים"),
      });
    } else {
      const newBachurim: Omit<Bachur, "id" | "created_at" | "updated_at" | "full_name">[] = fileData.map((row) => {
        const b: Omit<Bachur, "id" | "created_at" | "updated_at" | "full_name"> = {
          title: "", first_name: "", last_name: "", father_name: "", city: "", address: "", floor: "", is_new: true, notes: "", yeshiva: "", shiur: "",
        };
        Object.entries(mapping).forEach(([fileCol, fieldKey]) => {
          const val = row[fileCol] || "";
          if (fieldKey === "is_new") {
            b.is_new = val === "true" || val === "1" || val === "כן" || val.toLowerCase() === "yes" || val === "✓" || val === "✔";
          } else if (fieldKey !== "id" && fieldKey !== "full_name" && fieldKey in b) {
            (b as any)[fieldKey] = val;
          }
        });
        return b;
      });
      addBachurimBatch.mutate(newBachurim, {
        onSuccess: () => { clearImport(); toast.success(`${newBachurim.length} בחורים יובאו בהצלחה`); },
        onError: () => toast.error("שגיאה ביבוא הנתונים"),
      });
    }
  };

  const clearImport = () => { setFileData([]); setFileColumns([]); setMapping({}); };

  const handleExport = () => {
    const headers = activeFields.filter((f) => exportFields.includes(f.key));
    let sourceData: any[] = exportTarget === "donors" ? donors : bachurim;

    if (exportTarget === "donors") {
      if (filterCity) sourceData = sourceData.filter((d: Donor) => d.city === filterCity);
      if (filterTitle) sourceData = sourceData.filter((d: Donor) => d.title === filterTitle);
      if (filterMinAmount) {
        const min = Number(filterMinAmount);
        sourceData = sourceData.filter((d: Donor) => (d.donations[currentYear] || 0) >= min);
      }
    } else {
      if (filterYeshiva) sourceData = sourceData.filter((b: Bachur) => b.yeshiva === filterYeshiva);
    }

    const rows = sourceData.map((item) => {
      const row: Record<string, string | number | boolean> = {};
      headers.forEach((h) => {
        if (exportTarget === "donors" && yearsList.includes(h.key)) {
          row[h.label] = (item as Donor).donations[h.key] || 0;
        } else if (exportTarget === "donors" && h.key.startsWith("note_")) {
          const year = h.key.replace("note_", "");
          row[h.label] = (item as Donor).donation_notes?.[year] || "";
        } else {
          row[h.label] = (item as any)[h.key] ?? "";
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
        ...sourceData.map((item) =>
          headers.map((h) => {
            if (exportTarget === "donors" && yearsList.includes(h.key)) return (item as Donor).donations[h.key] || 0;
            if (exportTarget === "donors" && h.key.startsWith("note_")) {
              const year = h.key.replace("note_", "");
              return `"${(item as Donor).donation_notes?.[year] || ""}"`;
            }
            return `"${(item as any)[h.key] ?? ""}"`;
          }).join(",")
        ),
      ];
      const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${fileName}.csv`; a.click();
      URL.revokeObjectURL(url);
    }
    toast.success(`יוצאו ${sourceData.length} רשומות בהצלחה`);
  };

  const toggleExportField = (key: string) => {
    setExportFields((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const uniqueCities = [...new Set(donors.map((d) => d.city).filter(Boolean))].sort();

  if (settingsLoading) return <div className="text-center py-8 text-muted-foreground">טוען...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Year Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />הגדרות שנים</CardTitle>
          <CardDescription>בחירת השנה הנוכחית וכמות השנים המוצגות</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>שנה נוכחית</Label>
              <Select value={currentYear} onValueChange={handleYearChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{HEBREW_YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>כמות שנים להצגה</Label>
              <Select value={String(yearCount)} onValueChange={(v) => handleYearCountChange(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[2, 3, 4, 5, 6].map((n) => <SelectItem key={n} value={String(n)}>{n} שנים</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            שנים מוצגות: <span className="font-medium text-foreground">{yearsList.join("  ←  ")}</span>
          </div>
        </CardContent>
      </Card>

      {/* System Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />אבטחת מערכת</CardTitle>
          <CardDescription>עדכון קוד הגישה למערכת</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label>קוד גישה נוכחי</Label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 12))}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSavePin(); } }}
                className="font-mono tracking-widest pl-10"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPin((s) => !s)}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="הצג/הסתר קוד"
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button onClick={handleSavePin} disabled={saveSetting.isPending}>שמור</Button>
          </div>
          <p className="text-xs text-muted-foreground">לפחות 4 ספרות. הקוד יישאר קבוע עד לשינוי ידני.</p>
        </CardContent>
      </Card>

      <MissionCitiesCard />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5" />ניהול תורמים</CardTitle>
          <CardDescription>מחיקת כל הנתונים ואיפוס מונה ID של תורמים</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="destructive" size="sm" onClick={() => setDeleteAllDonorsOpen(true)}>
              <Trash2 className="h-4 w-4 ml-1" /> מחיקת כל התורמים
            </Button>
            <Button variant="outline" size="sm" onClick={() => setResetDonorSeqOpen(true)}>
              <RotateCcw className="h-4 w-4 ml-1" /> איפוס מונה ID
            </Button>
          </div>
          <p className="text-xs text-destructive font-medium">⚠️ זהירות: פעולות אלו אינן הפיכות. נתונים שנמחקו לא ניתנים לשחזור.</p>
        </CardContent>
      </Card>

      {/* Bachur Management Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5" />ניהול בחורים</CardTitle>
          <CardDescription>מחיקת כל הנתונים ואיפוס מונה ID של בחורים</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="destructive" size="sm" onClick={() => setDeleteAllBachurimOpen(true)}>
              <Trash2 className="h-4 w-4 ml-1" /> מחיקת כל הבחורים
            </Button>
            <Button variant="outline" size="sm" onClick={() => setResetBachurSeqOpen(true)}>
              <RotateCcw className="h-4 w-4 ml-1" /> איפוס מונה ID
            </Button>
          </div>
          <p className="text-xs text-destructive font-medium">⚠️ זהירות: פעולות אלו אינן הפיכות. נתונים שנמחקו לא ניתנים לשחזור.</p>
        </CardContent>
      </Card>

      {/* Group Management Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5" />ניהול קבוצות</CardTitle>
          <CardDescription>מחיקת כל הקבוצות ואיפוס מונה ID של קבוצות</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="destructive" size="sm" onClick={() => setDeleteAllGroupsOpen(true)}>
              <Trash2 className="h-4 w-4 ml-1" /> מחיקת כל הקבוצות
            </Button>
            <Button variant="outline" size="sm" onClick={() => setResetGroupSeqOpen(true)}>
              <RotateCcw className="h-4 w-4 ml-1" /> איפוס מונה ID
            </Button>
          </div>
          <p className="text-xs text-destructive font-medium">⚠️ זהירות: פעולות אלו אינן הפיכות. נתונים שנמחקו לא ניתנים לשחזור.</p>
        </CardContent>
      </Card>

      {/* List Manager */}
      <ListManager />

      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />יבוא נתונים</CardTitle>
          <CardDescription>העלאת קובץ Excel או CSV עם מיפוי עמודות לשדות המערכת</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>יעד יבוא</Label>
            <Select value={importTarget} onValueChange={(v) => { setImportTarget(v); clearImport(); }}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="donors">תורמים</SelectItem>
                <SelectItem value="bachurim">בחורים</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 ml-2" />בחר קובץ (Excel / CSV)
          </Button>
          {fileColumns.length > 0 && (
            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              <h4 className="font-medium text-sm">מיפוי עמודות</h4>
              {fileColumns.map((col) => (
                <div key={col} className="flex items-center gap-3">
                  <span className="text-sm w-32 truncate font-mono">{col}</span>
                  <span className="text-muted-foreground">←</span>
                  <Select value={mapping[col] || "_skip"} onValueChange={(v) => setMapping((prev) => ({ ...prev, [col]: v === "_skip" ? "" : v }))}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_skip">דלג</SelectItem>
                      {importFields.filter((f) => f.key !== "id").map((f) => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <Button onClick={handleImport} disabled={addDonorsBatch.isPending || addBachurimBatch.isPending}>
                {(addDonorsBatch.isPending || addBachurimBatch.isPending) ? "מייבא..." : `ייבא ${fileData.length} שורות`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" />יצוא נתונים</CardTitle>
          <CardDescription>בחירת שדות, סינון ויצוא לקובץ Excel או CSV</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>יעד יצוא</Label>
            <Select value={exportTarget} onValueChange={setExportTarget}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="donors">רשימת תורמים</SelectItem>
                <SelectItem value="bachurim">רשימת בחורים</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Smart Filters */}
          <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
            <h4 className="font-medium text-sm">סינון ייצוא (אופציונלי)</h4>
            <div className="grid grid-cols-2 gap-3">
              {exportTarget === "donors" && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">עיר</Label>
                    <Select value={filterCity || "_all"} onValueChange={(v) => setFilterCity(v === "_all" ? "" : v)}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">הכל</SelectItem>
                        {uniqueCities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">תואר</Label>
                    <Select value={filterTitle || "_all"} onValueChange={(v) => setFilterTitle(v === "_all" ? "" : v)}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">הכל</SelectItem>
                        {titleOptions.map((t) => <SelectItem key={t.id} value={t.value}>{t.value}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">סכום תרומה מינימלי ({currentYear})</Label>
                    <Input type="number" className="h-8" placeholder="למשל: 400" value={filterMinAmount} onChange={(e) => setFilterMinAmount(e.target.value)} />
                  </div>
                </>
              )}
              {exportTarget === "bachurim" && (
                <div className="space-y-1">
                  <Label className="text-xs">ישיבה</Label>
                  <Select value={filterYeshiva || "_all"} onValueChange={(v) => setFilterYeshiva(v === "_all" ? "" : v)}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">הכל</SelectItem>
                      {yeshivot.map((y) => <SelectItem key={y.id} value={y.value}>{y.value}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {activeFields.map((f) => (
              <label key={f.key} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={exportFields.includes(f.key)} onCheckedChange={() => toggleExportField(f.key)} />
                {f.label}
              </label>
            ))}
          </div>
          <div className="space-y-2">
            <Label>פורמט יצוא</Label>
            <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as "xlsx" | "csv")}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleExport}><Download className="h-4 w-4 ml-2" />ייצא לקובץ</Button>
        </CardContent>
      </Card>

      {/* Confirm Dialogs */}
      <AlertDialog open={deleteAllDonorsOpen} onOpenChange={setDeleteAllDonorsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח שברצונך לבצע פעולה זו?</AlertDialogTitle>
            <AlertDialogDescription>כל התורמים ({donors.length}) יימחקו לצמיתות. לא ניתן לבטל זאת.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllDonors} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">מחק הכל</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetDonorSeqOpen} onOpenChange={setResetDonorSeqOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח שברצונך לבצע פעולה זו?</AlertDialogTitle>
            <AlertDialogDescription>מונה ה-ID של תורמים יאופס ל-1. פעולה זו מיועדת לשימוש לפני השקת המערכת בלבד.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetDonorSeq}>אפס</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAllBachurimOpen} onOpenChange={setDeleteAllBachurimOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח שברצונך לבצע פעולה זו?</AlertDialogTitle>
            <AlertDialogDescription>כל הבחורים ({bachurim.length}) יימחקו לצמיתות. לא ניתן לבטל זאת.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllBachurim} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">מחק הכל</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetBachurSeqOpen} onOpenChange={setResetBachurSeqOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח שברצונך לבצע פעולה זו?</AlertDialogTitle>
            <AlertDialogDescription>מונה ה-ID של בחורים יאופס ל-1. פעולה זו מיועדת לשימוש לפני השקת המערכת בלבד.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetBachurSeq}>אפס</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAllGroupsOpen} onOpenChange={setDeleteAllGroupsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח שברצונך לבצע פעולה זו?</AlertDialogTitle>
            <AlertDialogDescription>כל הקבוצות ({groupsData.length}) יימחקו לצמיתות כולל כל השיוכים. לא ניתן לבטל זאת.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              deleteAllGroups.mutate(undefined, {
                onSuccess: () => { toast.success("כל הקבוצות נמחקו"); setDeleteAllGroupsOpen(false); },
                onError: () => toast.error("שגיאה במחיקת הקבוצות"),
              });
            }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">מחק הכל</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetGroupSeqOpen} onOpenChange={setResetGroupSeqOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח שברצונך לבצע פעולה זו?</AlertDialogTitle>
            <AlertDialogDescription>מונה ה-ID של קבוצות יאופס ל-1. פעולה זו מיועדת לשימוש לפני השקת המערכת בלבד.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              resetGroupSeq.mutate(undefined, {
                onSuccess: () => { toast.success("מונה ID קבוצות אופס ל-1"); setResetGroupSeqOpen(false); },
                onError: () => toast.error("שגיאה באיפוס המונה"),
              });
            }}>אפס</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MissionCitiesCard() {
  const { data: settings } = useSettings();
  const saveSetting = useSaveSetting();
  const [mta, setMta] = useState("");
  const [yad, setYad] = useState("");

  useEffect(() => {
    setMta((settings?.mta_cities || []).join("\n"));
    setYad((settings?.yad_cities || []).join("\n"));
  }, [settings?.mta_cities, settings?.yad_cities]);

  const parse = (txt: string) =>
    txt.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);

  const handleSave = async () => {
    await saveSetting.mutateAsync({ key: "mta_cities", value: parse(mta) });
    await saveSetting.mutateAsync({ key: "yad_cities", value: parse(yad) });
    toast.success("ערי המשימות נשמרו");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />ערי המשימות</CardTitle>
        <CardDescription>
          הגדר אילו ערים שייכות למשימת מת"א ואילו לי"ד. הזן עיר אחת בכל שורה (או מופרדות בפסיק).
          ירושלים משויכת אוטומטית למשימת ט"ו בלבד.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>ערי מת"א</Label>
            <Textarea rows={6} value={mta} onChange={(e) => setMta(e.target.value)} placeholder="עיר בכל שורה" dir="rtl" />
          </div>
          <div className="space-y-1">
            <Label>ערי י"ד</Label>
            <Textarea rows={6} value={yad} onChange={(e) => setYad(e.target.value)} placeholder="עיר בכל שורה" dir="rtl" />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saveSetting.isPending}>שמור ערים</Button>
        <p className="text-xs text-muted-foreground">אם רשימה ריקה — כל הערים (מלבד ירושלים) זמינות למשימה זו.</p>
      </CardContent>
    </Card>
  );
}
