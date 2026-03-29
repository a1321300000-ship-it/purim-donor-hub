import { useState, useEffect, useRef } from "react";

interface Option {
  label: string;
  value: string;
}

let citiesCache: string[] | null = null;
let streetsCache: Record<string, string[]> | null = null;

async function loadCities(): Promise<string[]> {
  if (citiesCache) return citiesCache;
  const res = await fetch("/data/cities.json");
  citiesCache = await res.json();
  return citiesCache!;
}

async function loadStreets(): Promise<Record<string, string[]>> {
  if (streetsCache) return streetsCache;
  const res = await fetch("/data/streets.json");
  streetsCache = await res.json();
  return streetsCache!;
}

export function useCities(search: string) {
  const [cities, setCities] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!search || search.length < 1) {
      setCities([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadCities().then((all) => {
      if (cancelled) return;
      const filtered = all
        .filter((c) => c.includes(search))
        .slice(0, 30)
        .map((c) => ({ label: c, value: c }));
      setCities(filtered);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [search]);

  return { cities, loading };
}

export function useStreets(city: string, search: string) {
  const [streets, setStreets] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city) {
      setStreets([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadStreets().then((all) => {
      if (cancelled) return;
      const cityStreets = all[city] || [];
      const filtered = cityStreets
        .filter((s) => !search || s.includes(search))
        .slice(0, 50)
        .map((s) => ({ label: s, value: s }));
      setStreets(filtered);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [city, search]);

  return { streets, loading };
}
