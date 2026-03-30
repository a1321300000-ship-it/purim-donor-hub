import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAddDonor } from "@/hooks/useDonors";
import { useSettings } from "@/hooks/useSettings";
import { TITLE_OPTIONS } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddressFields } from "@/components/AddressFields";
import { toast } from "sonner";

export default function AddDonor() {
  const navigate = useNavigate();
  const addDonor = useAddDonor();
  const { data: settings } = useSettings();
  const yearsList = settings?.years_list || ['תשפ"ג', 'תשפ"ד', 'תשפ"ה'];

  const [form, setForm] = useState({
    title: "",
    full_name: "",
    father_name: "",
    phone: "",
    city: "",
    address: "",
    floor: "",
    is_new: true,
    notes: "",
    donations: {} as Record<string, number>,
    donation_notes: {} as Record<string, string>,
  });

  const set = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setDonation = (year: string, value: string) =>
    setForm((prev) => ({
      ...prev,
      donations: { ...prev.donations, [year]: value === "" ? 0 : Number(value) },
    }));

  const setDonationNote = (year: string, value: string) =>
    setForm((prev) => ({
      ...prev,
      donation_notes: { ...prev.donation_notes, [year]: value },
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>תואר</Label>
                <Select value={form.title} onValueChange={(v) => set("title", v)}>
                  <SelectTrigger><SelectValue placeholder="בחר תואר" /></SelectTrigger>
                  <SelectContent>
                    {TITLE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>שם מלא *</Label>
                <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>שם האב</Label>
                <Input value={form.father_name} onChange={(e) => set("father_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>טלפון</Label>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
            </div>

            <AddressFields
              city={form.city}
              address={form.address}
              floor={form.floor}
              onCityChange={(v) => set("city", v)}
              onAddressChange={(v) => set("address", v)}
              onFloorChange={(v) => set("floor", v)}
            />

            <div className="flex items-center gap-2">
              <Checkbox
                id="is_new"
                checked={form.is_new}
                onCheckedChange={(v) => set("is_new", !!v)}
              />
              <Label htmlFor="is_new">תורם חדש</Label>
            </div>

            <div className="space-y-2">
              <Label>הערות</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="הערות חופשיות..." />
            </div>

            <div className="space-y-3">
              {yearsList.map((y) => (
                <div key={y} className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>תרומות {y}</Label>
                    <Input
                      type="number"
                      value={form.donations[y] || ""}
                      onChange={(e) => setDonation(y, e.target.value)}
                      placeholder="₪0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>הערות {y}</Label>
                    <Input
                      value={form.donation_notes[y] || ""}
                      onChange={(e) => setDonationNote(y, e.target.value)}
                      placeholder="הערה..."
                    />
                  </div>
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
