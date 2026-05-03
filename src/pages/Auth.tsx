import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Delete, Lock } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const { signIn } = useAuth();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = async (code: string) => {
    if (code.length === 0) return;
    setLoading(true);
    const ok = await signIn(code);
    setLoading(false);
    if (!ok) {
      toast.error("קוד שגוי");
      setPin("");
      inputRef.current?.focus();
    }
  };

  const onKey = (digit: string) => {
    if (digit === "del") { setPin((p) => p.slice(0, -1)); return; }
    if (digit === "ok") { submit(pin); return; }
    setPin((p) => (p.length >= 12 ? p : p + digit));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(pin);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">מגבית פורים</CardTitle>
          <CardDescription>הזן את קוד הגישה</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 12))}
              className="w-full text-center text-3xl tracking-[0.5em] font-mono h-14 rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              dir="ltr"
            />
            <div className="grid grid-cols-3 gap-2">
              {["1","2","3","4","5","6","7","8","9"].map((d) => (
                <Button key={d} type="button" variant="outline" className="h-14 text-xl" onClick={() => onKey(d)}>{d}</Button>
              ))}
              <Button type="button" variant="outline" className="h-14 text-xl" onClick={() => onKey("del")}>
                <Delete className="h-5 w-5" />
              </Button>
              <Button type="button" variant="outline" className="h-14 text-xl" onClick={() => onKey("0")}>0</Button>
              <Button type="submit" className="h-14 text-base" disabled={loading || pin.length === 0}>
                {loading ? "..." : "כניסה"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
