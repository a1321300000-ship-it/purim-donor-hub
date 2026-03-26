export interface Donor {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  notes: string;
  donations: Record<string, number>;
}

const DONORS_KEY = "crm_donors";
const NEXT_ID_KEY = "crm_next_id";

const SAMPLE_DONORS: Donor[] = [
  {
    id: 1,
    fullName: "משה כהן",
    phone: "050-1234567",
    email: "moshe@example.com",
    notes: "תורם קבוע",
    donations: { "2023": 500, "2024": 750, "2025": 1000 },
  },
  {
    id: 2,
    fullName: "שרה לוי",
    phone: "052-9876543",
    email: "sara@example.com",
    notes: "מעדיפה לתרום במזומן",
    donations: { "2023": 200, "2024": 300, "2025": 300 },
  },
  {
    id: 3,
    fullName: "יעקב אברהמי",
    phone: "054-5551234",
    email: "",
    notes: "",
    donations: { "2023": 1000, "2024": 1200, "2025": 1500 },
  },
  {
    id: 4,
    fullName: "רחל גולדשטיין",
    phone: "058-7778899",
    email: "rachel.g@example.com",
    notes: "לצור קשר בערב בלבד",
    donations: { "2023": 100, "2024": 150, "2025": 200 },
  },
];

export function getDonors(): Donor[] {
  const data = localStorage.getItem(DONORS_KEY);
  if (!data) {
    localStorage.setItem(DONORS_KEY, JSON.stringify(SAMPLE_DONORS));
    localStorage.setItem(NEXT_ID_KEY, "5");
    return SAMPLE_DONORS;
  }
  return JSON.parse(data);
}

export function saveDonors(donors: Donor[]) {
  localStorage.setItem(DONORS_KEY, JSON.stringify(donors));
}

export function getNextId(): number {
  const raw = localStorage.getItem(NEXT_ID_KEY);
  const id = raw ? parseInt(raw, 10) : 1;
  localStorage.setItem(NEXT_ID_KEY, String(id + 1));
  return id;
}

export const DONATION_YEARS = ["2023", "2024", "2025"] as const;

export const DONOR_FIELDS: { key: keyof Donor | string; label: string }[] = [
  { key: "id", label: "מזהה" },
  { key: "fullName", label: "שם מלא" },
  { key: "phone", label: "טלפון" },
  { key: "email", label: 'דוא"ל' },
  { key: "notes", label: "הערות" },
  { key: "2023", label: "תרומות 2023" },
  { key: "2024", label: "תרומות 2024" },
  { key: "2025", label: "תרומות 2025" },
];
