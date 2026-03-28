import { useState, useEffect } from "react";

const DATA_GOV_BASE = "https://data.gov.il/api/3/action/datastore_search";
const CITIES_RESOURCE = "d490196b-bd83-4240-bc1a-563d7e2f1831";
const STREETS_RESOURCE = "a7296d5b-f6f1-4366-b930-bc351616edcc";

interface CityOption {
  label: string;
  value: string;
}

interface StreetOption {
  label: string;
  value: string;
}

export function useCities(search: string) {
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!search || search.length < 2) {
      setCities([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const url = `${DATA_GOV_BASE}?resource_id=${CITIES_RESOURCE}&q=${encodeURIComponent(search)}&limit=30`;
    
    fetch(url, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const records = data?.result?.records || [];
        const unique = new Set<string>();
        const opts: CityOption[] = [];
        for (const r of records) {
          const name = (r["שם_ישוב"] || "").trim();
          if (name && !unique.has(name)) {
            unique.add(name);
            opts.push({ label: name, value: name });
          }
        }
        setCities(opts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [search]);

  return { cities, loading };
}

export function useStreets(city: string, search: string) {
  const [streets, setStreets] = useState<StreetOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city) {
      setStreets([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const filters = JSON.stringify({ "שם_ישוב": city });
    let url = `${DATA_GOV_BASE}?resource_id=${STREETS_RESOURCE}&filters=${encodeURIComponent(filters)}&limit=100`;
    if (search && search.length >= 1) {
      url += `&q=${encodeURIComponent(search)}`;
    }

    fetch(url, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const records = data?.result?.records || [];
        const unique = new Set<string>();
        const opts: StreetOption[] = [];
        for (const r of records) {
          const name = (r["שם_רחוב"] || "").trim();
          if (name && !unique.has(name)) {
            unique.add(name);
            opts.push({ label: name, value: name });
          }
        }
        setStreets(opts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [city, search]);

  return { streets, loading };
}
