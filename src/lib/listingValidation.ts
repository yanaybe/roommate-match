// Field validation for the post-apartment wizard. Validators return an
// i18n error key (resolved via t()) or null when valid.

export type ListingField =
  | "title"
  | "price"
  | "size"
  | "floor"
  | "address"
  | "neighborhood"
  | "city"
  | "availableDate";

const LEGACY_AVAILABILITY = new Set(["Immediately", "Next week", "Next month", "In 2 months", "Flexible"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const isWholeNumber = (v: string) => /^-?\d+$/.test(v.trim());

// Parse an ISO yyyy-mm-dd as a local date; null if the calendar rejects it
// (e.g. 2026-02-31 rolls over in Date, so round-trip check it).
function parseIsoDate(v: string): Date | null {
  if (!ISO_DATE.test(v)) return null;
  const [y, m, d] = v.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

export function validateListingField(field: ListingField, value: string): string | null {
  const v = value.trim();
  switch (field) {
    case "title":
      if (!v) return "errTitleRequired";
      if (v.length < 5) return "errTitleShort";
      if (v.length > 100) return "errTitleLong";
      return null;
    case "price": {
      if (!v) return "errPriceRequired";
      if (!isWholeNumber(v)) return "errPriceInvalid";
      const n = parseInt(v, 10);
      if (n < 500 || n > 50000) return "errPriceRange";
      return null;
    }
    case "size": {
      if (!v) return "errSizeRequired";
      if (!isWholeNumber(v)) return "errSizeInvalid";
      const n = parseInt(v, 10);
      if (n < 5 || n > 500) return "errSizeRange";
      return null;
    }
    case "floor": {
      if (!v) return null;
      if (!isWholeNumber(v)) return "errFloorInvalid";
      const n = parseInt(v, 10);
      if (n < -2 || n > 50) return "errFloorRange";
      return null;
    }
    case "address":
      if (!v) return "errAddressRequired";
      if (v.length < 5) return "errAddressShort";
      return null;
    case "neighborhood":
      return v ? null : "errNeighborhoodRequired";
    case "city":
      return v ? null : "errCityRequired";
    case "availableDate": {
      if (LEGACY_AVAILABILITY.has(v)) return null;
      const date = parseIsoDate(v);
      if (!date) return "errDateInvalid";
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) return "errDatePast";
      const max = new Date(today);
      max.setMonth(max.getMonth() + 12);
      if (date > max) return "errDateFar";
      return null;
    }
  }
}

const STEP_FIELDS: Record<string, ListingField[]> = {
  location: ["address", "neighborhood", "city"],
  details: ["title", "price", "size", "floor", "availableDate"],
};

export function validateStep(
  stepKey: string,
  form: Partial<Record<ListingField, string>>,
): Partial<Record<ListingField, string>> {
  const errors: Partial<Record<ListingField, string>> = {};
  for (const field of STEP_FIELDS[stepKey] ?? []) {
    const err = validateListingField(field, form[field] ?? "");
    if (err) errors[field] = err;
  }
  return errors;
}

// ISO dates render localized; legacy values ("Immediately", …) pass through
// so existing listings keep displaying as stored.
export function formatAvailableDate(value: string, locale: string): string {
  const date = parseIsoDate(value.trim());
  if (!date) return value;
  return date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

// Static, informational only — shown under the price field.
export const CITY_PRICE_HINTS: Record<string, { room: [number, number]; entire: [number, number] }> = {
  "Tel Aviv": { room: [2500, 6000], entire: [5500, 15000] },
  "Jerusalem": { room: [1800, 4000], entire: [4000, 9000] },
  "Haifa": { room: [1300, 3000], entire: [3000, 7000] },
  "Beer Sheva": { room: [1000, 2500], entire: [2500, 5500] },
  "Netanya": { room: [1800, 3800], entire: [4000, 9000] },
  "Herzliya": { room: [2200, 5000], entire: [5500, 13000] },
  "Ramat Gan": { room: [2200, 4800], entire: [4800, 11000] },
  "Rishon LeZion": { room: [1800, 3800], entire: [4200, 9000] },
  "Petah Tikva": { room: [1700, 3600], entire: [4000, 8500] },
  "Ashdod": { room: [1500, 3200], entire: [3500, 7500] },
};
