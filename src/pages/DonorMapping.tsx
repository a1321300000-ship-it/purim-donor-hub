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

// Simple geocoding cache using Nominatim
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
    // Fallback: try city only
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

const TASK_TYPES = ['מת"א', 'י"ד', 'ט"ו'];

export default function DonorMapping() {
  const { data: donors = [] } = useDonors();
  const { data: settings } = useSettings();
  const { data: allMembers = [] } = useAllGroupMembers();
  const createGroupsBatch = useCreateGroupsBatch();

  const [taskType, setTaskType] = useState('מת"א');
  const [groupSize, setGroupSize] = useState(10);
  const [geocodedDonors, setGeocodedDonors] = useState<Map<number, [number, number]>>(new Map());
  const [isGeocoding, setIsGeocoding] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  const currentYear = settings?.current_year || 'תשפ"ה';

  // Filter: active donors not yet assigned to a group for this task type
  const assignedDonorIds = useMemo(() => new Set(allMembers.map((m) => m.donor_id)), [allMembers]);
  
  const activeDonors = useMemo(
    () => donors.filter((d) => !d.archived_at && !assignedDonorIds.has(d.id)),
    [donors, assignedDonorIds]
  );

  // Geocode donors
  useEffect(() => {
    if (activeDonors.length === 0) return;
    let cancelled = false;
    setIsGeocoding(true);
    
    const geocodeAll = async () => {
      const newMap = new Map<number, [number, number]>();
      for (const donor of activeDonors) {
        if (cancelled) break;
        if (!donor.city) continue;
        const coords = await geocodeAddress(donor.city, donor.address, donor.house_number);
        if (coords) newMap.set(donor.id, coords);
        // Rate limiting for Nominatim
        await new Promise((r) => setTimeout(r, 200));
      }
      if (!cancelled) {
        setGeocodedDonors(newMap);
        setIsGeocoding(false);
      }
    };
    geocodeAll();
    return () => { cancelled = true; };
  }, [activeDonors.length]);

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
    const donorsWithCoords = activeDonors.filter((d) => geocodedDonors.has(d.id));
    if (donorsWithCoords.length === 0) {
      toast.error("אין תורמים עם כתובות תקינות ליצירת קבוצות");
      return;
    }

    // Simple clustering by proximity
    const remaining = [...donorsWithCoords];
    const groups: { name: string; task_type: string; members: { donor_id: number; sort_order: number }[] }[] = [];
    let groupIdx = 1;

    while (remaining.length > 0) {
      const seed = remaining.shift()!;
      const seedCoords = geocodedDonors.get(seed.id)!;
      const group: Donor[] = [seed];

      // Find nearest donors
      while (group.length < groupSize && remaining.length > 0) {
        let nearestIdx = 0;
        let nearestDist = Infinity;
        for (let i = 0; i < remaining.length; i++) {
          const c = geocodedDonors.get(remaining[i].id);
          if (!c) continue;
          const dist = Math.sqrt((c[0] - seedCoords[0]) ** 2 + (c[1] - seedCoords[1]) ** 2);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestIdx = i;
          }
        }
        group.push(remaining.splice(nearestIdx, 1)[0]);
      }

      const streets = [...new Set(group.map((d) => d.address).filter(Boolean))].slice(0, 2).join(", ");
      groups.push({
        name: `קבוצה ${groupIdx} - ${streets || "ללא רחוב"} - ${taskType}`,
        task_type: taskType,
        members: group.map((d, i) => ({ donor_id: d.id, sort_order: i })),
      });
      groupIdx++;
    }

    // Also add donors without coords
    const donorsWithoutCoords = activeDonors.filter((d) => !geocodedDonors.has(d.id));
    for (let i = 0; i < donorsWithoutCoords.length; i += groupSize) {
      const chunk = donorsWithoutCoords.slice(i, i + groupSize);
      const streets = [...new Set(chunk.map((d) => d.address).filter(Boolean))].slice(0, 2).join(", ");
      groups.push({
        name: `קבוצה ${groupIdx} - ${streets || "ללא כתובת"} - ${taskType}`,
        task_type: taskType,
        members: chunk.map((d, j) => ({ donor_id: d.id, sort_order: j })),
      });
      groupIdx++;
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
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
      <div ref={mapRef} className="border rounded-lg" style={{ height: "60vh" }} />
    </div>
  );
}
