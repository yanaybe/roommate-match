import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Camera, X, MapPin, Home, Bed, Bath, Ruler, Building, Calendar, Plus, Check, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { analytics } from "@/lib/analytics";

const DRAFT_KEY = "post_apartment_draft";

const CITIES = ["Tel Aviv", "Jerusalem", "Haifa", "Beer Sheva", "Netanya", "Herzliya", "Ramat Gan", "Rishon LeZion", "Petah Tikva", "Ashdod"];

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export default function PostApartment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);

  const { user } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [listingType, setListingType] = useState<"room" | "entire_place">("room");
  const [submitting, setSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<"locating" | "uploading" | "publishing">("locating");
  const [editLoading, setEditLoading] = useState(false);

  const activeStepKeys = (listingType === "entire_place"
    ? ["listing-type", "photos", "location", "details", "amenities", "review"]
    : ["listing-type", "photos", "location", "details", "room-type", "amenities", "review"]) as string[];

  const STEP_LABELS: Record<string, string> = {
    "listing-type": "Listing Type",
    "photos": t("addPhotos"),
    "location": t("locationSection"),
    "details": t("apartmentDetails"),
    "room-type": t("availableRoom"),
    "amenities": t("amenitiesTitle"),
    "review": t("reviewYourListing"),
  };

  const currentStepKey = activeStepKeys[step] ?? "listing-type";

  // New files selected by the user
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  // Existing URLs retained from the original listing (edit mode only)
  const [keptImages, setKeptImages] = useState<string[]>([]);

  const defaultForm = {
    title: "",
    description: "",
    address: "",
    neighborhood: "",
    city: "Tel Aviv",
    price: "",
    rooms: "3",
    bathrooms: "1",
    size: "",
    floor: "",
    availableDate: "Immediately",
    roomType: "Private",
    roomDescription: "",
    isFurnished: false,
    hasBalcony: false,
    hasParking: false,
    hasElevator: false,
    hasAc: false,
    hasLaundry: false,
    hasWifi: false,
    hasGym: false,
    hasSecurity: false,
    hasRooftop: false,
    hasGarden: false,
    petFriendly: false,
  };

  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as { form: typeof defaultForm; step: number };
    } catch {
      return null;
    }
  };

  const draft = loadDraft();
  const [form, setForm] = useState(draft?.form ?? defaultForm);

  useEffect(() => {
    if (draft?.step && draft.step > 0) setStep(draft.step);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step }));
    } catch {}
  }, [form, step]);

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  // Pre-fill form when editing an existing listing
  useEffect(() => {
    if (!editId || !user) return;
    setEditLoading(true);
    supabase
      .from("apartments")
      .select("*")
      .eq("id", editId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          toast.error("Listing not found or you don't have permission to edit it.");
          navigate("/");
          return;
        }
        setForm({
          title: data.title ?? "",
          description: data.description ?? "",
          address: data.address ?? "",
          neighborhood: data.neighborhood ?? "",
          city: data.city ?? "Tel Aviv",
          price: data.price ? String(data.price) : "",
          rooms: data.rooms ? String(data.rooms) : "3",
          bathrooms: data.bathrooms ? String(data.bathrooms) : "1",
          size: data.size ? String(data.size) : "",
          floor: data.floor ? String(data.floor) : "",
          availableDate: data.available_date ?? "Immediately",
          roomType: data.room_type ?? "Private",
          roomDescription: data.room_description ?? "",
          isFurnished: data.is_furnished ?? false,
          hasBalcony: data.has_balcony ?? false,
          hasParking: data.has_parking ?? false,
          hasElevator: data.has_elevator ?? false,
          hasAc: data.has_ac ?? false,
          hasLaundry: data.has_laundry ?? false,
          hasWifi: data.has_wifi ?? false,
          hasGym: data.has_gym ?? false,
          hasSecurity: data.has_security ?? false,
          hasRooftop: data.has_rooftop ?? false,
          hasGarden: data.has_garden ?? false,
          petFriendly: data.pet_friendly ?? false,
        });
        setListingType(((data as any).listing_type === "entire_place" ? "entire_place" : "room") as "room" | "entire_place");
        setKeptImages(data.images ?? []);
        setEditLoading(false);
      });
  }, [editId, user]);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const invalidType = files.find(f => !ALLOWED_MIME_TYPES.has(f.type));
    if (invalidType) {
      toast.error("Only JPG, PNG, WebP, and GIF images are allowed");
      e.target.value = "";
      return;
    }

    const tooBig = files.find(f => f.size > MAX_FILE_SIZE);
    if (tooBig) {
      toast.error("Each image must be under 10MB");
      e.target.value = "";
      return;
    }

    if (keptImages.length + images.length + files.length > 8) {
      toast.error("Maximum 8 photos allowed");
      e.target.value = "";
      return;
    }
    setImages(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const removeKeptImage = (idx: number) => {
    setKeptImages(prev => prev.filter((_, i) => i !== idx));
  };

  const totalImageCount = keptImages.length + images.length;

  const canProceed = () => {
    switch (currentStepKey) {
      case "listing-type": return true;
      case "photos": return isEditMode ? totalImageCount > 0 : images.length > 0;
      case "location": return !!(form.address && form.city && form.neighborhood);
      case "details": return !!(form.title && form.price && form.size);
      case "room-type": return !!form.roomType;
      case "amenities": return true;
      case "review": return true;
      default: return true;
    }
  };

  const geocodeAddress = async (address: string, neighborhood: string, city: string): Promise<[number, number] | null> => {
    const query = encodeURIComponent(`${address}, ${neighborhood}, ${city}, Israel`);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        { headers: { "User-Agent": "RoomMatch-App/1.0" } }
      );
      const data = await res.json();
      if (data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    } catch {}
    return null;
  };

  const handleSubmit = async () => {
    if (!user) { toast.error("Please sign in first"); return; }
    setSubmitting(true);
    try {
      setSubmitPhase("locating");
      const coords = await geocodeAddress(form.address, form.neighborhood, form.city);
      if (!coords) toast("Could not pinpoint address — listing will use city center coordinates");

      setSubmitPhase("uploading");
      // Upload any new images
      const newImageUrls: string[] = [];
      for (const file of images) {
        const ext = MIME_TO_EXT[file.type] ?? "jpg";
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("apartment-images").upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("apartment-images").getPublicUrl(path);
        newImageUrls.push(urlData.publicUrl);
      }

      setSubmitPhase("publishing");
      const payload = {
        title: form.title,
        description: form.description,
        address: form.address,
        neighborhood: form.neighborhood,
        city: form.city,
        price: parseInt(form.price) || 0,
        rooms: parseInt(form.rooms) || 1,
        bathrooms: parseInt(form.bathrooms) || 1,
        size: parseInt(form.size) || 0,
        floor: form.floor ? parseInt(form.floor) : null,
        available_date: form.availableDate,
        listing_type: listingType,
        room_type: form.roomType,
        room_description: form.roomDescription,
        is_furnished: form.isFurnished,
        has_balcony: form.hasBalcony,
        has_parking: form.hasParking,
        has_elevator: form.hasElevator,
        has_ac: form.hasAc,
        has_laundry: form.hasLaundry,
        has_wifi: form.hasWifi,
        has_gym: form.hasGym,
        has_security: form.hasSecurity,
        has_rooftop: form.hasRooftop,
        has_garden: form.hasGarden,
        pet_friendly: form.petFriendly,
        images: [...keptImages, ...newImageUrls],
        coordinates: coords ?? undefined,
      };

      if (isEditMode && editId) {
        const { error } = await supabase
          .from("apartments")
          .update(payload as any)
          .eq("id", editId)
          .eq("user_id", user.id);
        if (error) throw error;
        toast.success("Listing updated! 🎉");
        navigate(`/apartment/${editId}`);
      } else {
        const { error } = await supabase.from("apartments").insert({
          user_id: user.id,
          ...payload,
        } as any);
        if (error) throw error;
        localStorage.removeItem(DRAFT_KEY);
        analytics.apartmentPost();
        toast.success("Apartment posted successfully! 🎉");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save apartment");
    } finally {
      setSubmitting(false);
    }
  };

  const amenities = [
    { key: "hasBalcony", label: t("amenityBalcony"), icon: "🌅" },
    { key: "hasParking", label: t("amenityParking"), icon: "🅿️" },
    { key: "hasElevator", label: t("amenityElevator"), icon: "🛗" },
    { key: "hasAc", label: t("amenityAC"), icon: "❄️" },
    { key: "hasLaundry", label: t("amenityLaundry"), icon: "🧺" },
    { key: "hasWifi", label: t("amenityWifi"), icon: "📶" },
    { key: "hasGym", label: t("amenityGym"), icon: "💪" },
    { key: "hasSecurity", label: t("amenitySecurity"), icon: "🔒" },
    { key: "hasRooftop", label: t("amenityRooftop"), icon: "🏙️" },
    { key: "hasGarden", label: t("amenityGarden"), icon: "🌿" },
    { key: "petFriendly", label: t("amenityPetFriendly"), icon: "🐾" },
    { key: "isFurnished", label: t("amenityFurnished"), icon: "🛋️" },
  ];

  // Show loading skeleton while fetching existing listing data
  if (editLoading) {
    return (
      <div className="h-dvh flex flex-col bg-background">
        <div className="shrink-0 bg-background/95 backdrop-blur-lg border-b border-border px-4 pt-3 pb-4 flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="flex-1 max-w-lg mx-auto w-full px-4 py-5 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const pageTitle = isEditMode ? "Edit Listing" : t("postYourApartment");
  const submitLabel = isEditMode ? "Save Changes" : t("postApartmentBtn");
  const submittingLabel = isEditMode ? "Saving…" : t("postingApt");

  // First image to show in the review preview
  const previewCoverUrl = keptImages[0] ?? imagePreviews[0] ?? null;

  return (
    <div className="h-dvh flex flex-col bg-background">
      {/* Sticky header + progress */}
      <div className="shrink-0 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 pt-3 pb-2 flex items-center gap-3">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : (isEditMode ? navigate(-1) : navigate("/create"))}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-foreground text-base">{pageTitle}</h1>
            <p className="text-xs text-muted-foreground truncate">{t("step")} {step + 1} / {activeStepKeys.length} — {STEP_LABELS[currentStepKey]}</p>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-4 pb-2">
          <div className="flex gap-1.5">
            {activeStepKeys.map((_, i) => (
              <div key={i} className={`h-1 rounded-full flex-1 transition-colors duration-300 ${i <= step ? "gradient-primary" : "bg-muted"}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
      <div className="max-w-lg mx-auto px-4 py-5">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>

            {/* Step: Listing Type */}
            {currentStepKey === "listing-type" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">What are you listing?</h2>
                  <p className="text-muted-foreground text-sm">Choose the type of listing that best describes what you're offering.</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {([
                    { value: "room" as const, emoji: "🚪", title: "A Room", desc: "List a private or shared room in your apartment" },
                    { value: "entire_place" as const, emoji: "🏠", title: "An Entire Apartment", desc: "List the whole place — ideal for squads and groups" },
                  ]).map(({ value, emoji, title, desc }) => (
                    <button
                      key={value}
                      onClick={() => setListingType(value)}
                      className={`flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                        listingType === value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      <span className="text-3xl shrink-0">{emoji}</span>
                      <div>
                        <p className={`font-bold text-base ${listingType === value ? "text-primary" : "text-foreground"}`}>{title}</p>
                        <p className="text-muted-foreground text-sm">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step: Photos */}
            {currentStepKey === "photos" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">{t("addPhotos")}</h2>
                  <p className="text-muted-foreground text-sm">
                    {isEditMode ? "Remove or add photos for your listing. At least one photo is required." : t("uploadPhotosDesc")}
                  </p>
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />

                <div className="grid grid-cols-3 gap-3">
                  {/* Existing images (edit mode) */}
                  {keptImages.map((src, i) => (
                    <div key={`kept-${i}`} className="relative aspect-square rounded-2xl overflow-hidden group">
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=200";
                        }}
                      />
                      <button
                        onClick={() => removeKeptImage(i)}
                        className="absolute top-1.5 right-1.5 p-1 bg-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5 text-destructive-foreground" />
                      </button>
                      {i === 0 && keptImages.length > 0 && (
                        <span className="absolute bottom-1.5 ltr:left-1.5 rtl:right-1.5 text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                          {t("coverPhoto")}
                        </span>
                      )}
                    </div>
                  ))}

                  {/* New images being added */}
                  {imagePreviews.map((src, i) => (
                    <div key={`new-${i}`} className="relative aspect-square rounded-2xl overflow-hidden group">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeNewImage(i)}
                        className="absolute top-1.5 right-1.5 p-1 bg-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5 text-destructive-foreground" />
                      </button>
                      {keptImages.length === 0 && i === 0 && (
                        <span className="absolute bottom-1.5 ltr:left-1.5 rtl:right-1.5 text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                          {t("coverPhoto")}
                        </span>
                      )}
                      <span className="absolute top-1.5 ltr:left-1.5 rtl:right-1.5 text-[9px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full font-semibold">New</span>
                    </div>
                  ))}

                  {totalImageCount < 8 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <Camera className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{t("addPhoto")}</span>
                    </button>
                  )}
                </div>

                {totalImageCount > 0 && (
                  <p className="text-xs text-muted-foreground text-center">{totalImageCount} / 8 photos</p>
                )}
              </div>
            )}

            {/* Step: Location */}
            {currentStepKey === "location" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">{t("locationSection")}</h2>
                  <p className="text-muted-foreground text-sm">{t("whereApartmentLocated")}</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">{t("city")}</Label>
                    <Select value={form.city} onValueChange={v => update("city", v)}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">{t("neighborhood")}</Label>
                    <Input placeholder={t("neighborhoodPlaceholder")} value={form.neighborhood} onChange={e => update("neighborhood", e.target.value)} className="rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">{t("streetAddress")}</Label>
                    <div className="relative">
                      <MapPin className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder={t("streetNameNumber")} value={form.address} onChange={e => update("address", e.target.value)} className="rounded-xl ltr:pl-10 rtl:pr-10" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Details */}
            {currentStepKey === "details" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">{t("apartmentDetails")}</h2>
                  <p className="text-muted-foreground text-sm">{t("tellAboutApt")}</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">{t("aptTitle")}</Label>
                    <Input placeholder={t("titlePlaceholder")} value={form.title} onChange={e => update("title", e.target.value)} className="rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">{t("aptDescription")}</Label>
                    <Textarea placeholder={t("descPlaceholder")} value={form.description} onChange={e => update("description", e.target.value)} className="rounded-xl min-h-[100px]" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-foreground flex items-center gap-1.5"><span>💰</span> {t("monthlyPrice")}</Label>
                      <Input type="number" placeholder="3,500" value={form.price} onChange={e => update("price", e.target.value)} className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground flex items-center gap-1.5"><Ruler className="w-3.5 h-3.5" /> {t("sizeM2")}</Label>
                      <Input type="number" placeholder="85" value={form.size} onChange={e => update("size", e.target.value)} className="rounded-xl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-foreground flex items-center gap-1.5"><Bed className="w-3.5 h-3.5" /> {t("roomsLbl")}</Label>
                      <Select value={form.rooms} onValueChange={v => update("rooms", v)}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground flex items-center gap-1.5"><Bath className="w-3.5 h-3.5" /> {t("bathsLbl")}</Label>
                      <Select value={form.bathrooms} onValueChange={v => update("bathrooms", v)}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1,2,3].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> {t("floorLbl")}</Label>
                      <Input type="number" placeholder="3" value={form.floor} onChange={e => update("floor", e.target.value)} className="rounded-xl" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Room Type (room listings only) */}
            {currentStepKey === "room-type" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">{t("availableRoom")}</h2>
                  <p className="text-muted-foreground text-sm">{t("detailsAboutRoom")}</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">{t("roomType")}</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Private", "Shared"].map(type => (
                        <button key={type} onClick={() => update("roomType", type)} className={`p-4 rounded-2xl border-2 transition-all text-center ${form.roomType === type ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground/30"}`}>
                          <span className="text-2xl mb-1 block">{type === "Private" ? "🚪" : "👥"}</span>
                          <span className={`font-semibold text-sm ${form.roomType === type ? "text-primary" : "text-foreground"}`}>{type === "Private" ? t("privateRoom") : t("sharedRoom")}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">{t("roomDescLbl")}</Label>
                    <Textarea placeholder={t("roomDescPlaceholder")} value={form.roomDescription} onChange={e => update("roomDescription", e.target.value)} className="rounded-xl min-h-[100px]" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {t("availableFromLbl")}</Label>
                    <Select value={form.availableDate} onValueChange={v => update("availableDate", v)}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Immediately">{t("immediately")}</SelectItem>
                        <SelectItem value="Next week">{t("nextWeekLbl")}</SelectItem>
                        <SelectItem value="Next month">{t("nextMonthLbl")}</SelectItem>
                        <SelectItem value="In 2 months">{t("in2Months")}</SelectItem>
                        <SelectItem value="Flexible">{t("optFlexible")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Amenities */}
            {currentStepKey === "amenities" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">{t("amenitiesTitle")}</h2>
                  <p className="text-muted-foreground text-sm">{t("amenitiesDesc")}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {amenities.map(({ key, label, icon }) => {
                    const active = form[key as keyof typeof form] as boolean;
                    return (
                      <button key={key} onClick={() => update(key, !active)} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${active ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground/30"}`}>
                        <span className="text-xl">{icon}</span>
                        <span className={`font-medium text-sm ${active ? "text-primary" : "text-foreground"}`}>{label}</span>
                        {active && <Check className="w-4 h-4 text-primary ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step: Review */}
            {currentStepKey === "review" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">{t("reviewYourListing")}</h2>
                  <p className="text-muted-foreground text-sm">{t("makeEverythingGood")}</p>
                </div>

                {/* Preview card */}
                <div className="bg-card rounded-2xl shadow-card overflow-hidden">
                  {previewCoverUrl && (
                    <img
                      src={previewCoverUrl}
                      alt=""
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800";
                      }}
                    />
                  )}
                  <div className="p-4 space-y-3">
                    <h3 className="font-bold text-foreground text-lg">{form.title || "Untitled"}</h3>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{form.neighborhood}, {form.city}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-bold text-foreground text-lg">₪{form.price}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                      <span>{form.rooms} rooms</span>
                      <span>{form.bathrooms} bath</span>
                      <span>{form.size}m²</span>
                    </div>

                    {form.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{form.description}</p>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {amenities.filter(a => form[a.key as keyof typeof form]).map(a => (
                        <span key={a.key} className="text-xs px-2.5 py-1 bg-muted rounded-full text-muted-foreground">{a.icon} {a.label}</span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {listingType === "entire_place"
                        ? <span className="text-xs px-2.5 py-1 bg-primary/10 rounded-full text-primary">🏠 Entire Apartment</span>
                        : <span className="text-xs px-2.5 py-1 bg-accent rounded-full text-accent-foreground">{form.roomType} Room</span>
                      }
                      <span className="text-xs px-2.5 py-1 bg-muted rounded-full text-muted-foreground">📅 {form.availableDate}</span>
                      {totalImageCount > 0 && (
                        <span className="text-xs px-2.5 py-1 bg-muted rounded-full text-muted-foreground">📷 {totalImageCount} photos</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
      </div>

      {/* Sticky footer buttons */}
      <div className="shrink-0 bg-background/95 backdrop-blur-lg border-t border-border pb-16 desk:pb-0">
        <div className="max-w-lg mx-auto px-4 py-3 flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="rounded-xl flex-1">
              {t("back")}
            </Button>
          )}
          {step < activeStepKeys.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="rounded-xl flex-1 gradient-primary text-primary-foreground">
              {t("continueBtn")} <ArrowRight className="w-4 h-4 ltr:ml-1 rtl:mr-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="rounded-xl flex-1 gradient-primary text-primary-foreground">
              {submitting
                ? <><Loader2 className="w-4 h-4 ltr:mr-2 rtl:ml-2 animate-spin" /> {submittingLabel}</>
                : submitLabel
              }
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
