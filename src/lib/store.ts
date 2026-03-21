export interface Donor {
  id: string;
  fullName: string;
  address: string;
  phone: string;
  notes: string;
  donations: Record<string, number>;
  currentNotes: string;
}

const DONORS_KEY = "crm_donors";
const YEAR_KEY = "crm_current_year";

const DEFAULT_YEAR = "תשפ״ה";

const SAMPLE_DONORS: Donor[] = [
  {
    id: "1",
    fullName: "משה כהן",
    address: "רחוב הרצל 15, ירושלים",
    phone: "050-1234567",
    notes: "תורם קבוע",
    donations: { 'תשפ״ב': 500, 'תשפ״ג': 750, 'תשפ״ד': 1000 },
    currentNotes: "",
  },
  {
    id: "2",
    fullName: "שרה לוי",
    address: "רחוב ביאליק 8, בני ברק",
    phone: "052-9876543",
    notes: "מעדיפה לתרום במזומן",
    donations: { 'תשפ״ב': 200, 'תשפ״ג': 300, 'תשפ״ד': 300 },
    currentNotes: "",
  },
  {
    id: "3",
    fullName: "יעקב אברהמי",
    address: "רחוב הנשיא 22, פתח תקווה",
    phone: "054-5551234",
    notes: "",
    donations: { 'תשפ״ב': 1000, 'תשפ״ג': 1200, 'תשפ״ד': 1500 },
    currentNotes: "",
  },
  {
    id: "4",
    fullName: "רחל גולדשטיין",
    address: "רחוב סוקולוב 3, רמת גן",
    phone: "058-7778899",
    notes: "לצור קשר בערב בלבד",
    donations: { 'תשפ״ב': 100, 'תשפ״ג': 150, 'תשפ״ד': 200 },
    currentNotes: "",
  },
];

export function getDonors(): Donor[] {
  const data = localStorage.getItem(DONORS_KEY);
  if (!data) {
    localStorage.setItem(DONORS_KEY, JSON.stringify(SAMPLE_DONORS));
    return SAMPLE_DONORS;
  }
  return JSON.parse(data);
}

export function saveDonors(donors: Donor[]) {
  localStorage.setItem(DONORS_KEY, JSON.stringify(donors));
}

export function getCurrentYear(): string {
  return localStorage.getItem(YEAR_KEY) || DEFAULT_YEAR;
}

export function setCurrentYear(year: string) {
  localStorage.setItem(YEAR_KEY, year);
}
