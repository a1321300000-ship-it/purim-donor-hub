export interface Donor {
  id: number;
  fullName: string;
  phone: string;
  city: string;
  address: string;
  notes: string;
  donations: Record<string, number>;
}

const DONORS_KEY = "crm_donors";
const NEXT_ID_KEY = "crm_next_id";

export const DONATION_YEARS = ["תשפ\"ג", "תשפ\"ד", "תשפ\"ה"] as const;

export const DONOR_FIELDS: { key: string; label: string }[] = [
  { key: "id", label: "מזהה" },
  { key: "fullName", label: "שם מלא" },
  { key: "phone", label: "טלפון" },
  { key: "city", label: "עיר" },
  { key: "address", label: "כתובת" },
  { key: "notes", label: "הערות" },
  { key: "תשפ\"ג", label: "תרומות תשפ\"ג" },
  { key: "תשפ\"ד", label: "תרומות תשפ\"ד" },
  { key: "תשפ\"ה", label: "תרומות תשפ\"ה" },
];

const SAMPLE_DONORS: Donor[] = [
  {
    id: 1,
    fullName: "משה כהן",
    phone: "050-1234567",
    city: "ירושלים",
    address: "רחוב הרצל 15",
    notes: "תורם קבוע",
    donations: { "תשפ\"ג": 500, "תשפ\"ד": 750, "תשפ\"ה": 1000 },
  },
  {
    id: 2,
    fullName: "שרה לוי",
    phone: "052-9876543",
    city: "בני ברק",
    address: "רחוב רבי עקיבא 42",
    notes: "מעדיפה לתרום במזומן",
    donations: { "תשפ\"ג": 200, "תשפ\"ד": 300, "תשפ\"ה": 300 },
  },
  {
    id: 3,
    fullName: "יעקב אברהמי",
    phone: "054-5551234",
    city: "תל אביב",
    address: "שדרות רוטשילד 8",
    notes: "",
    donations: { "תשפ\"ג": 1000, "תשפ\"ד": 1200, "תשפ\"ה": 1500 },
  },
  {
    id: 4,
    fullName: "רחל גולדשטיין",
    phone: "058-7778899",
    city: "חיפה",
    address: "רחוב הנביאים 3",
    notes: "לצור קשר בערב בלבד",
    donations: { "תשפ\"ג": 100, "תשפ\"ד": 150, "תשפ\"ה": 200 },
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
