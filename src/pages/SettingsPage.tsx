import { useState, useEffect } from "react";
import { getCurrentYear, setCurrentYear as saveYear } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const HEBREW_YEARS = ["תשפ״ב", "תשפ״ג", "תשפ״ד", "תשפ״ה", "תשפ״ו", "תשפ״ז"];

export default function SettingsPage() {
  const [year, setYear] = useState("");

  useEffect(() => {
    setYear(getCurrentYear());
  }, []);

  const handleSave = () => {
    saveYear(year);
    toast.success(`השנה הנוכחית עודכנה ל-${year}`);
  };

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>הגדרות מערכת</CardTitle>
          <CardDescription>
            הגדרת השנה העברית הנוכחית תעדכן את כותרת העמודה בטבלת התורמים
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">שנה עברית נוכחית</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HEBREW_YEARS.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave}>שמור</Button>
        </CardContent>
      </Card>
    </div>
  );
}
