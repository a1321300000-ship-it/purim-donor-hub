import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAddDonor } from "@/hooks/useDonors";
import { useSettings } from "@/hooks/useSettings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function AddDonor() {
  const navigate = useNavigate();
  const addDonor = useAddDonor();
  const { data: settings } = useSettings();
  const yearsList = settings?.years_list || ['תשפ"ג', 'תשפ"ד', 'תשפ"ה'];

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    city: "",
    address: "",
    notes: "",
    donations: {} as Record<string, number>,
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setDonation = (year: string, value: string) =>
    setForm((prev) => ({
      ...prev,
      donations: { ...prev.donations, [year]: value === "" ? 0 : Number(value) },
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error("יש להזין שם מלא");
      return;
    }
    addDonor.mutate(form, {
      onSuccess: () => {
        toast.success("התורם נוסף בהצלחה");
        navigate("/");
      },
      onError: () => toast.error("שגיאה בהוספת תורם"),
    });
  };

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>הוספת תורם חדש</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>שם מלא *</Label>
              <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>טלפון</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>עיר</Label>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>כתובת</Label>
                <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>הערות</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="הערות חופשיות..." />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {yearsList.map((y) => (
                <div key={y} className="space-y-1">
                  <Label>תרומות {y}</Label>
                  <Input
                    type="number"
                    value={form.donations[y] || ""}
                    onChange={(e) => setDonation(y, e.target.value)}
                    placeholder="₪0"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={addDonor.isPending}>
                {addDonor.isPending ? "שומר..." : "הוסף תורם"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/")}>
                ביטול
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
