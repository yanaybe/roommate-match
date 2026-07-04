import { describe, it, expect } from "vitest";
import {
  validateListingField,
  validateStep,
  formatAvailableDate,
  CITY_PRICE_HINTS,
} from "@/lib/listingValidation";

const isoDaysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

describe("validateListingField", () => {
  it("title: required, 5-100 chars", () => {
    expect(validateListingField("title", "")).toBe("errTitleRequired");
    expect(validateListingField("title", "   ")).toBe("errTitleRequired");
    expect(validateListingField("title", "abc")).toBe("errTitleShort");
    expect(validateListingField("title", "a".repeat(101))).toBe("errTitleLong");
    expect(validateListingField("title", "Sunny flat")).toBeNull();
  });

  it("price: required whole number 500-50000", () => {
    expect(validateListingField("price", "")).toBe("errPriceRequired");
    expect(validateListingField("price", "abc")).toBe("errPriceInvalid");
    expect(validateListingField("price", "12.5")).toBe("errPriceInvalid");
    expect(validateListingField("price", "0")).toBe("errPriceRange");
    expect(validateListingField("price", "-100")).toBe("errPriceRange");
    expect(validateListingField("price", "499")).toBe("errPriceRange");
    expect(validateListingField("price", "50001")).toBe("errPriceRange");
    expect(validateListingField("price", "3500")).toBeNull();
  });

  it("size: required whole number 5-500", () => {
    expect(validateListingField("size", "")).toBe("errSizeRequired");
    expect(validateListingField("size", "big")).toBe("errSizeInvalid");
    expect(validateListingField("size", "4")).toBe("errSizeRange");
    expect(validateListingField("size", "501")).toBe("errSizeRange");
    expect(validateListingField("size", "85")).toBeNull();
  });

  it("floor: optional, -2 to 50", () => {
    expect(validateListingField("floor", "")).toBeNull();
    expect(validateListingField("floor", "x")).toBe("errFloorInvalid");
    expect(validateListingField("floor", "-3")).toBe("errFloorRange");
    expect(validateListingField("floor", "51")).toBe("errFloorRange");
    expect(validateListingField("floor", "-1")).toBeNull();
    expect(validateListingField("floor", "3")).toBeNull();
  });

  it("address: required, min 5 chars", () => {
    expect(validateListingField("address", "")).toBe("errAddressRequired");
    expect(validateListingField("address", "ab 1")).toBe("errAddressShort");
    expect(validateListingField("address", "Rothschild 12")).toBeNull();
  });

  it("neighborhood and city: required", () => {
    expect(validateListingField("neighborhood", "")).toBe("errNeighborhoodRequired");
    expect(validateListingField("neighborhood", "Florentin")).toBeNull();
    expect(validateListingField("city", "")).toBe("errCityRequired");
    expect(validateListingField("city", "Tel Aviv")).toBeNull();
  });

  it("availableDate: legacy options always valid", () => {
    for (const v of ["Immediately", "Next week", "Next month", "In 2 months", "Flexible"]) {
      expect(validateListingField("availableDate", v)).toBeNull();
    }
  });

  it("availableDate: ISO dates bounded to today..+12 months", () => {
    expect(validateListingField("availableDate", isoDaysFromNow(-1))).toBe("errDatePast");
    expect(validateListingField("availableDate", isoDaysFromNow(400))).toBe("errDateFar");
    expect(validateListingField("availableDate", "2026-02-31")).toBe("errDateInvalid");
    expect(validateListingField("availableDate", isoDaysFromNow(0))).toBeNull();
    expect(validateListingField("availableDate", isoDaysFromNow(30))).toBeNull();
  });
});

describe("validateStep", () => {
  const validForm = {
    title: "Sunny flat in Florentin",
    price: "3500",
    size: "85",
    floor: "2",
    address: "Rothschild 12",
    neighborhood: "Florentin",
    city: "Tel Aviv",
    availableDate: "Immediately",
  };

  it("location step checks address/neighborhood/city", () => {
    expect(validateStep("location", validForm)).toEqual({});
    const errs = validateStep("location", { ...validForm, address: "", city: "" });
    expect(errs).toEqual({ address: "errAddressRequired", city: "errCityRequired" });
  });

  it("details step checks title/price/size/floor/availableDate", () => {
    expect(validateStep("details", validForm)).toEqual({});
    const errs = validateStep("details", { ...validForm, price: "0", title: "ab" });
    expect(errs).toEqual({ price: "errPriceRange", title: "errTitleShort" });
  });

  it("other steps have no field validation", () => {
    expect(validateStep("photos", validForm)).toEqual({});
    expect(validateStep("amenities", validForm)).toEqual({});
  });
});

describe("formatAvailableDate", () => {
  it("passes legacy values through unchanged", () => {
    expect(formatAvailableDate("Immediately", "en")).toBe("Immediately");
    expect(formatAvailableDate("Flexible", "he")).toBe("Flexible");
  });

  it("formats ISO dates for the locale", () => {
    const out = formatAvailableDate("2026-08-01", "en");
    expect(out).toMatch(/Aug/);
    expect(out).toMatch(/2026/);
  });

  it("returns invalid strings unchanged", () => {
    expect(formatAvailableDate("2026-99-99", "en")).toBe("2026-99-99");
  });
});

describe("CITY_PRICE_HINTS", () => {
  it("covers all 10 supported cities with room and entire ranges", () => {
    const cities = ["Tel Aviv", "Jerusalem", "Haifa", "Beer Sheva", "Netanya", "Herzliya", "Ramat Gan", "Rishon LeZion", "Petah Tikva", "Ashdod"];
    for (const c of cities) {
      const hint = CITY_PRICE_HINTS[c];
      expect(hint).toBeDefined();
      expect(hint.room[0]).toBeLessThan(hint.room[1]);
      expect(hint.entire[0]).toBeLessThan(hint.entire[1]);
    }
  });
});
