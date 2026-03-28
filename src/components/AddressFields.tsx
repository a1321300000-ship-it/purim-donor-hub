import { useState } from "react";
import { useCities, useStreets } from "@/hooks/useIsraeliAddress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";

interface Props {
  city: string;
  address: string;
  floor: string;
  onCityChange: (v: string) => void;
  onAddressChange: (v: string) => void;
  onFloorChange: (v: string) => void;
}

export function AddressFields({ city, address, floor, onCityChange, onAddressChange, onFloorChange }: Props) {
  const [citySearch, setCitySearch] = useState("");
  const [streetSearch, setStreetSearch] = useState("");
  const [cityOpen, setCityOpen] = useState(false);
  const [streetOpen, setStreetOpen] = useState(false);
  const { cities, loading: citiesLoading } = useCities(citySearch || city);
  const { streets, loading: streetsLoading } = useStreets(city, streetSearch);

  return (
    <>
      <div className="space-y-2">
        <Label>עיר</Label>
        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
              {city || "בחר עיר..."}
              <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="חפש עיר..." value={citySearch} onValueChange={setCitySearch} />
              <CommandList>
                <CommandEmpty>{citiesLoading ? "טוען..." : "לא נמצאו תוצאות"}</CommandEmpty>
                <CommandGroup>
                  {cities.map((c) => (
                    <CommandItem key={c.value} value={c.value} onSelect={() => { onCityChange(c.value); onAddressChange(""); setCityOpen(false); setCitySearch(""); }}>
                      {c.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>כתובת (רחוב)</Label>
        <Popover open={streetOpen} onOpenChange={setStreetOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full justify-between font-normal" disabled={!city}>
              {address || "בחר רחוב..."}
              <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="חפש רחוב..." value={streetSearch} onValueChange={setStreetSearch} />
              <CommandList>
                <CommandEmpty>{streetsLoading ? "טוען..." : "לא נמצאו תוצאות"}</CommandEmpty>
                <CommandGroup>
                  {streets.map((s) => (
                    <CommandItem key={s.value} value={s.value} onSelect={() => { onAddressChange(s.value); setStreetOpen(false); setStreetSearch(""); }}>
                      {s.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>קומה</Label>
        <Input value={floor} onChange={(e) => onFloorChange(e.target.value)} placeholder="קומה" />
      </div>
    </>
  );
}
