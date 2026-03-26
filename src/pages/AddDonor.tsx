import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDonors, saveDonors, getNextId, Donor, DONATION_YEARS } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function AddDonor() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
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
    if (!form.fullName.trim()) {
      toast.error("יש להזין שם מלא");
      return;
    }
    const donor: Donor = {
      id: getNextId(),
      fullName: form.fullName,
      phone: form.phone,
      email: form.email,
      notes: form.notes,
      donations: form.donations,
    };
    const donors = getDonors();
    saveDonors([...donors, donor]);
    toast.success("התורם נוסף בהצלחה");
    navigate("/");
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
              <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>טלפון</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>דוא״ל</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>הערות</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="הערות חופשיות..." />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {DONATION_YEARS.map((y) => (
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
              <Button type="submit">הוסף תורם</Button>
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
