import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAddBachur } from "@/hooks/useBachurim";
import { useSelectOptions } from "@/hooks/useSelectOptions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function AddBachur() {
  const navigate = useNavigate();
  const addBachur = useAddBachur();
  const { data: yeshivot = [] } = useSelectOptions("yeshiva");
  const { data: shiurim = [] } = useSelectOptions("shiur");

  const [form, setForm] = useState({
    title: "", full_name: "", father_name: "", phone: "",
    city: "", address: "", floor: "", is_new: true, notes: "",
    yeshiva: "", shiur: "",
  });

  const set = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error("יש להזין שם מלא");
      return;
    }
    addBachur.mutate(form, {
      onSuccess: () => {
        toast.success("הבחור נוסף בהצלחה");
        navigate("/bachurim");
      },
      onError: () => toast.error("שגיאה בהוספת בחור"),
    });
  };

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>הוספת בחור חדש</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>שם מלא *</Label>
                <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>שם האב</Label>
                <Input value={form.father_name} onChange={(e) => set("father_name", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>ישיבה</Label>
                <Select value={form.yeshiva} onValueChange={(v) => set("yeshiva", v)}>
                  <SelectTrigger><SelectValue placeholder="בחר ישיבה" /></SelectTrigger>
                  <SelectContent>
                    {yeshivot.map((o) => <SelectItem key={o.id} value={o.value}>{o.value}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>שיעור</Label>
                <Select value={form.shiur} onValueChange={(v) => set("shiur", v)}>
                  <SelectTrigger><SelectValue placeholder="בחר שיעור" /></SelectTrigger>
                  <SelectContent>
                    {shiurim.map((o) => <SelectItem key={o.id} value={o.value}>{o.value}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>הערות</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={addBachur.isPending}>
                {addBachur.isPending ? "שומר..." : "הוסף בחור"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/bachurim")}>ביטול</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
