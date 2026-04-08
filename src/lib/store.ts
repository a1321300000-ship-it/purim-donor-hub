import { supabase } from "@/integrations/supabase/client";

export interface Donor {
  id: number;
  title: string;
  full_name: string;
  father_name: string;
  phone: string;
  city: string;
  address: string;
  floor: string;
  is_new: boolean;
  notes: string;
  donations: Record<string, number>;
  donation_notes: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export interface Bachur {
  id: number;
  title: string;
  full_name: string;
  father_name: string;
  phone: string;
  city: string;
  address: string;
  floor: string;
  is_new: boolean;
  notes: string;
  yeshiva: string;
  shiur: string;
  created_at?: string;
  updated_at?: string;
}

export interface SelectOption {
  id: string;
  list_name: string;
  value: string;
  sort_order: number;
}

export interface AppSettings {
  current_year: string;
  year_count: number;
  years_list: string[];
}

export const TITLE_OPTIONS = ["הרב", "הרה\"ג", "מר", "גב'", "ד\"ר", "פרופ'"];

// ---- Settings ----

export async function getSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from("settings")
    .select("key, value");

  if (error || !data || data.length === 0) {
    return {
      current_year: 'תשפ"ה',
      year_count: 3,
      years_list: ['תשפ"ג', 'תשפ"ד', 'תשפ"ה'],
    };
  }

  const map: Record<string, any> = {};
  data.forEach((row) => (map[row.key] = row.value));

  return {
    current_year: (map.current_year as string) || 'תשפ"ה',
    year_count: (map.year_count as number) || 3,
    years_list: (map.years_list as string[]) || ['תשפ"ג', 'תשפ"ד', 'תשפ"ה'],
  };
}

export async function saveSetting(key: string, value: any) {
  const { error } = await supabase
    .from("settings")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) throw error;
}

// ---- Select Options ----

export async function getSelectOptions(listName: string): Promise<SelectOption[]> {
  const { data, error } = await supabase
    .from("select_options")
    .select("*")
    .eq("list_name", listName)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data || []) as unknown as SelectOption[];
}

export async function addSelectOption(listName: string, value: string): Promise<void> {
  const { data: existing } = await supabase
    .from("select_options")
    .select("sort_order")
    .eq("list_name", listName)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = (existing && existing.length > 0 ? (existing[0] as any).sort_order : 0) + 1;
  const { error } = await supabase
    .from("select_options")
    .insert({ list_name: listName, value, sort_order: nextOrder } as any);
  if (error) throw error;
}

export async function deleteSelectOption(id: string): Promise<void> {
  const { error } = await supabase.from("select_options").delete().eq("id", id);
  if (error) throw error;
}

// ---- Donors ----

export async function getDonors(): Promise<Donor[]> {
  const { data, error } = await supabase
    .from("donors")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw error;
  return (data || []).map((d) => ({
    ...d,
    title: (d as any).title || "",
    father_name: (d as any).father_name || "",
    floor: (d as any).floor || "",
    is_new: (d as any).is_new ?? true,
    donations: (d.donations as Record<string, number>) || {},
    donation_notes: ((d as any).donation_notes as Record<string, string>) || {},
  }));
}

export async function addDonor(donor: Omit<Donor, "id" | "created_at" | "updated_at">): Promise<Donor> {
  const { data, error } = await supabase
    .from("donors")
    .insert({
      title: donor.title,
      full_name: donor.full_name,
      father_name: donor.father_name,
      phone: donor.phone,
      city: donor.city,
      address: donor.address,
      floor: donor.floor,
      is_new: donor.is_new,
      notes: donor.notes,
      donations: donor.donations as any,
      donation_notes: donor.donation_notes as any,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    donations: (data.donations as Record<string, number>) || {},
    donation_notes: ((data as any).donation_notes as Record<string, string>) || {},
  } as Donor;
}

export async function updateDonor(id: number, updates: Partial<Omit<Donor, "id">>): Promise<void> {
  const fields = ["title", "full_name", "father_name", "phone", "city", "address", "house_number", "floor", "is_new", "notes", "donations", "donation_notes"] as const;
  const payload: any = {};
  fields.forEach((f) => {
    if ((updates as any)[f] !== undefined) payload[f] = (updates as any)[f];
  });

  const { error } = await supabase.from("donors").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteDonor(id: number): Promise<void> {
  const { error } = await supabase.from("donors").delete().eq("id", id);
  if (error) throw error;
}

export async function addDonorsBatch(donors: Omit<Donor, "id" | "created_at" | "updated_at">[]): Promise<void> {
  const { error } = await supabase.from("donors").insert(
    donors.map((d) => ({
      title: d.title || "",
      full_name: d.full_name,
      father_name: d.father_name || "",
      phone: d.phone,
      city: d.city,
      address: d.address,
      floor: d.floor || "",
      is_new: d.is_new ?? true,
      notes: d.notes,
      donations: d.donations as any,
      donation_notes: (d.donation_notes || {}) as any,
    }))
  );
  if (error) throw error;
}

// ---- Bachurim ----

export async function getBachurim(): Promise<Bachur[]> {
  const { data, error } = await supabase
    .from("bachurim")
    .select("*")
    .order("id", { ascending: true });
  if (error) throw error;
  return (data || []).map((d) => ({
    ...d,
    yeshiva: (d as any).yeshiva || "",
    shiur: (d as any).shiur || "",
  })) as Bachur[];
}

export async function addBachur(bachur: Omit<Bachur, "id" | "created_at" | "updated_at">): Promise<Bachur> {
  const { data, error } = await supabase
    .from("bachurim")
    .insert({
      title: bachur.title,
      full_name: bachur.full_name,
      father_name: bachur.father_name,
      phone: bachur.phone,
      city: bachur.city,
      address: bachur.address,
      floor: bachur.floor,
      is_new: bachur.is_new,
      notes: bachur.notes,
      yeshiva: bachur.yeshiva,
      shiur: bachur.shiur,
    } as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Bachur;
}

export async function updateBachur(id: number, updates: Partial<Omit<Bachur, "id">>): Promise<void> {
  const fields = ["full_name", "father_name", "notes", "yeshiva", "shiur"] as const;
  const payload: any = {};
  fields.forEach((f) => {
    if ((updates as any)[f] !== undefined) payload[f] = (updates as any)[f];
  });
  const { error } = await supabase.from("bachurim").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteBachur(id: number): Promise<void> {
  const { error } = await supabase.from("bachurim").delete().eq("id", id);
  if (error) throw error;
}

export async function addBachurimBatch(bachurim: Omit<Bachur, "id" | "created_at" | "updated_at">[]): Promise<void> {
  const { error } = await supabase.from("bachurim").insert(
    bachurim.map((b) => ({
      title: b.title || "",
      full_name: b.full_name,
      father_name: b.father_name || "",
      phone: b.phone || "",
      city: b.city || "",
      address: b.address || "",
      floor: b.floor || "",
      is_new: b.is_new ?? true,
      notes: b.notes || "",
      yeshiva: b.yeshiva || "",
      shiur: b.shiur || "",
    } as any))
  );
  if (error) throw error;
}

// Helper: generate DONOR_FIELDS dynamically based on years
export function getDonorFields(yearsList: string[]) {
  return [
    { key: "id", label: "מזהה" },
    { key: "title", label: "תואר" },
    { key: "full_name", label: "שם מלא" },
    { key: "father_name", label: "שם האב" },
    { key: "phone", label: "טלפון" },
    { key: "city", label: "עיר" },
    { key: "address", label: "כתובת" },
    { key: "floor", label: "קומה" },
    { key: "is_new", label: "חדש" },
    { key: "notes", label: "הערות" },
    ...yearsList.map((y) => ({ key: y, label: `תרומות ${y}` })),
  ];
}

export function getBachurFields() {
  return [
    { key: "id", label: "מזהה" },
    { key: "title", label: "תואר" },
    { key: "full_name", label: "שם מלא" },
    { key: "father_name", label: "שם האב" },
    { key: "phone", label: "טלפון" },
    { key: "city", label: "עיר" },
    { key: "address", label: "כתובת" },
    { key: "floor", label: "קומה" },
    { key: "yeshiva", label: "ישיבה" },
    { key: "shiur", label: "שיעור" },
    { key: "notes", label: "הערות" },
  ];
}
