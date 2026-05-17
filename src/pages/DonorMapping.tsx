import { useState, useEffect, useRef, useMemo } from "react";
import { useDonors } from "@/hooks/useDonors";
import { useSettings } from "@/hooks/useSettings";
import { useAllGroupMembers, useCreateGroupsBatch } from "@/hooks/useGroups";
import { Donor } from "@/lib/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const geoCache: Record<string, [number, number] | null> = {};

async function geocodeAddress(city: string, address: string, houseNumber: string): Promise<[number, number] | null> {
  const key = `${city} ${address} ${houseNumber}`.trim();
  if (key in geoCache) return geoCache[key];

  try {
    const q = encodeURIComponent(`${address} ${houseNumber}, ${city}, ישראל`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1&countrycodes=il`);
    const data = await res.json();
    if (data.length > 0) {
      const result: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      geoCache[key] = result;
      return result;
    }
    const q2 = encodeURIComponent(`${city}, ישראל`);
    const res2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q2}&limit=1&countrycodes=il`);
    const data2 = await res2.json();
    if (data2.length > 0) {
      const result: [number, number] = [parseFloat(data2[0].lat), parseFloat(data2[0].lon)];
      geoCache[key] = result;
      return result;
    }
  } catch {
    // ignore
  }
  geoCache[key] = null;
  return null;
}

const TASK_TYPES = ['מת"א', 'י"ד', 'ט"ו', 'ליל ט"ו', 'טלפונים'];
const TRANSPORT_TYPES = [
  { value: "רגלי", label: "רגלי" },
  { value: "נסיעה/טנדר", label: "נסיעה/טנדר" },
];
const JERUSALEM = "ירושלים";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function DonorMapping() {
  const { data: donors = [] } = useDonors();
  const { data: settings } = useSettings();
  const { data: allMembers = [] } = useAllGroupMembers();
  const createGroupsBatch = useCreateGroupsBatch();

  const [taskType, setTaskType] = useState("");
  const [transportType, setTransportType] = useState("");
  const [groupSize, setGroupSize] = useState(10);
  const [geocodedDonors, setGeocodedDonors] = useState<Map<number, [number, number]>>(new Map());
  const [isGeocoding, setIsGeocoding] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  const assignedDonorIds = useMemo(() => new Set(allMembers.map((m) => m.donor_id)), [allMembers]);

  const mtaCities = settings?.mta_cities || [];
  const yadCities = settings?.yad_cities || [];

  // Filter donors by mission city rules
  const activeDonors = useMemo(() => {
    if (!taskType) return [];
    return donors.filter((d) => {
      if (d.archived_at) return false;
      if (assignedDonorIds.has(d.id)) return false;
      const city = (d.city || "").trim();
      if (taskType === 'ט"ו') return city === JERUSALEM;
      // All non-Jerusalem missions exclude Jerusalem donors
      if (city === JERUSALEM) return false;
      if (taskType === 'מת"א') return mtaCities.length === 0 ? true : mtaCities.includes(city);
      if (taskType === 'י"ד') return yadCities.length === 0 ? true : yadCities.includes(city);
      // ליל ט"ו: all non-Jerusalem unassigned donors
      return true;
    });
  }, [donors, assignedDonorIds, taskType, mtaCities, yadCities]);

  // Geocode donors
  useEffect(() => {
    if (activeDonors.length === 0) { setGeocodedDonors(new Map()); return; }
    let cancelled = false;
    setIsGeocoding(true);

    const geocodeAll = async () => {
      const newMap = new Map<number, [number, number]>();
      for (const donor of activeDonors) {
        if (cancelled) break;
        if (!donor.city) continue;
        const coords = await geocodeAddress(donor.city, donor.address, donor.house_number);
        if (coords) newMap.set(donor.id, coords);
        await new Promise((r) => setTimeout(r, 200));
      }
      if (!cancelled) {
        setGeocodedDonors(newMap);
        setIsGeocoding(false);
      }
    };
    geocodeAll();
    return () => { cancelled = true; };
  }, [activeDonors.length, taskType]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([31.7683, 35.2137], 8);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    const cluster = (L as any).markerClusterGroup();
    clusterRef.current = cluster;

    geocodedDonors.forEach((coords, donorId) => {
      const donor = activeDonors.find((d) => d.id === donorId);
      if (!donor) return;
      const marker = L.marker(coords);
      marker.bindPopup(
        `<div dir="rtl" style="text-align:right"><b>${donor.full_name}</b><br/>${donor.address} ${donor.house_number}, ${donor.city}<br/>קומה: ${donor.floor || "—"}</div>`
      );
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);

    if (geocodedDonors.size > 0) {
      const bounds = L.latLngBounds(Array.from(geocodedDonors.values()).map((c) => L.latLng(c[0], c[1])));
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [geocodedDonors, activeDonors]);

  const handleCreateGroups = () => {
    if (!transportType) {
      toast.error("יש לבחור סוג שינוע לפני יצירת קבוצות");
      return;
    }

    const donorsWithCoords = activeDonors.filter((d) => geocodedDonors.has(d.id));
    const donorsWithoutCoords = activeDonors.filter((d) => !geocodedDonors.has(d.id));

    if (donorsWithCoords.length === 0 && donorsWithoutCoords.length === 0) {
      toast.error("אין תורמים ליצירת קבוצות");
      return;
    }

    const maxRadius = transportType === "רגלי" ? 800 : 10000;
    const remaining = [...donorsWithCoords];
    const groups: { name: string; task_type: string; transport_type: string; members: { donor_id: number; sort_order: number }[] }[] = [];
    const remoteDonors: Donor[] = [];
    let groupIdx = 1;

    while (remaining.length > 0) {
      const seed = remaining.shift()!;
      const seedCoords = geocodedDonors.get(seed.id)!;
      const seedCity = seed.city;
      const group: Donor[] = [seed];

      const candidates: number[] = [];
      for (let i = 0; i < remaining.length; i++) {
        const c = geocodedDonors.get(remaining[i].id);
        if (!c) continue;
        if (remaining[i].city !== seedCity) continue;
        const dist = haversineDistance(seedCoords[0], seedCoords[1], c[0], c[1]);
        if (dist <= maxRadius) candidates.push(i);
      }

      candidates.sort((a, b) => {
        const ca = geocodedDonors.get(remaining[a].id)!;
        const cb = geocodedDonors.get(remaining[b].id)!;
        const da = haversineDistance(seedCoords[0], seedCoords[1], ca[0], ca[1]);
        const db = haversineDistance(seedCoords[0], seedCoords[1], cb[0], cb[1]);
        return da - db;
      });

      const taken = new Set<number>();
      for (const idx of candidates) {
        if (group.length >= groupSize) break;
        group.push(remaining[idx]);
        taken.add(idx);
      }
      const sortedTaken = [...taken].sort((a, b) => b - a);
      for (const idx of sortedTaken) remaining.splice(idx, 1);

      if (group.length === 1 && remaining.length > 0) {
        const sameCityIdx = remaining.findIndex((d) => d.city === seedCity);
        if (sameCityIdx === -1) {
          remoteDonors.push(seed);
          continue;
        }
      }

      const streets = [...new Set(group.map((d) => d.address).filter(Boolean))].slice(0, 2).join(", ");
      groups.push({
        name: `קבוצה ${groupIdx} - ${streets || "ללא רחוב"} - ${taskType}`,
        task_type: taskType,
        transport_type: transportType,
        members: group.map((d, i) => ({ donor_id: d.id, sort_order: i })),
      });
      groupIdx++;
    }

    if (donorsWithoutCoords.length > 0) {
      for (let i = 0; i < donorsWithoutCoords.length; i += groupSize) {
        const chunk = donorsWithoutCoords.slice(i, i + groupSize);
        groups.push({
          name: `תקלת שיבוץ ${groupIdx} - ${taskType}`,
          task_type: taskType,
          transport_type: transportType,
          members: chunk.map((d, j) => ({ donor_id: d.id, sort_order: j })),
        });
        groupIdx++;
      }
    }

    if (remoteDonors.length > 0) {
      for (let i = 0; i < remoteDonors.length; i += groupSize) {
        const chunk = remoteDonors.slice(i, i + groupSize);
        groups.push({
          name: `ערים מרוחקות / לטיפול ידני ${groupIdx} - ${taskType}`,
          task_type: taskType,
          transport_type: transportType,
          members: chunk.map((d, j) => ({ donor_id: d.id, sort_order: j })),
        });
        groupIdx++;
      }
    }

    createGroupsBatch.mutate(groups, {
      onSuccess: () => toast.success(`נוצרו ${groups.length} קבוצות בהצלחה`),
      onError: () => toast.error("שגיאה ביצירת הקבוצות"),
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>מיפוי תורמים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="space-y-1">
              <Label>סוג משימה</Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger className="w-40"><SelectValue placeholder="בחר משימה..." /></SelectTrigger>
                <SelectContent className="z-[1000]">
                  {TASK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>סוג שינוע</Label>
              <Select value={transportType} onValueChange={setTransportType}>
                <SelectTrigger className="w-36"><SelectValue placeholder="בחר סוג שינוע" /></SelectTrigger>
                <SelectContent className="z-[1000]">
                  {TRANSPORT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>תורמים לקבוצה</Label>
              <Input type="number" className="w-24" value={groupSize} onChange={(e) => setGroupSize(Number(e.target.value) || 10)} min={2} max={50} />
            </div>
            <Button onClick={handleCreateGroups} disabled={createGroupsBatch.isPending}>
              {createGroupsBatch.isPending ? "יוצר..." : "צור קבוצות"}
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            {isGeocoding ? "מאתר כתובות..." : `${geocodedDonors.size} מתוך ${activeDonors.length} תורמים מוצגים על המפה`}
          </div>
        </CardContent>
      </Card>
      <div ref={mapRef} className="border rounded-lg relative z-0" style={{ height: "60vh" }} />
    </div>
  );
}
