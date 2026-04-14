import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Camera, X, MapPin, Home, Bed, Bath, Ruler, Building, Calendar, Plus, Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";

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
  const { user } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const STEPS = [t("addPhotos"), t("locationSection"), t("apartmentDetails"), t("availableRoom"), t("amenitiesTitle"), t("reviewYourListing")];
  const [submitting, setSubmitting] = useState(false);

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
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
  });

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

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

    if (images.length + files.length > 8) {
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

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return images.length > 0;
      case 1: return form.address && form.city && form.neighborhood;
      case 2: return form.title && form.price && form.size;
      case 3: return form.roomType;
      case 4: return true;
      case 5: return true;
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
      // Geocode address
      const coords = await geocodeAddress(form.address, form.neighborhood, form.city);

      // Upload images
      const imageUrls: string[] = [];
      for (const file of images) {
        const ext = MIME_TO_EXT[file.type] ?? "jpg";
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("apartment-images").upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("apartment-images").getPublicUrl(path);
        imageUrls.push(urlData.publicUrl);
      }

      const { error } = await supabase.from("apartments").insert({
        user_id: user.id,
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
        images: imageUrls,
        coordinates: coords ?? undefined,
      } as any);

      if (error) throw error;
      toast.success("Apartment posted successfully! 🎉");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to post apartment");
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

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate("/create")} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-foreground text-lg">{t("postYourApartment")}</h1>
            <p className="text-xs text-muted-foreground">{t("step")} {step + 1} / {STEPS.length} — {STEPS[step]}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-lg mx-auto px-4 pb-3">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 rounded-full flex-1 transition-colors duration-300 ${i <= step ? "gradient-primary" : "bg-muted"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>

            {/* Step 0: Photos */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">{t("addPhotos")}</h2>
                  <p className="text-muted-foreground text-sm">{t("uploadPhotosDesc")}</p>
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />

                <div className="grid grid-cols-3 gap-3">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(i)} className="absolute top-1.5 right-1.5 p-1 bg-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3.5 h-3.5 text-destructive-foreground" />
                      </button>
                      {i === 0 && <span className="absolute bottom-1.5 ltr:left-1.5 rtl:right-1.5 text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">{t("coverPhoto")}</span>}
                    </div>
                  ))}
                  {images.length < 8 && (
                    <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors">
                      <Camera className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{t("addPhoto")}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 1: Location */}
            {step === 1 && (
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

            {/* Step 2: Details */}
            {step === 2 && (
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

            {/* Step 3: Room */}
            {step === 3 && (
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

            {/* Step 4: Amenities */}
            {step === 4 && (
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

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">{t("reviewYourListing")}</h2>
                  <p className="text-muted-foreground text-sm">{t("makeEverythingGood")}</p>
                </div>

                {/* Preview card */}
                <div className="bg-card rounded-2xl shadow-card overflow-hidden">
                  {imagePreviews.length > 0 && (
                    <img src={imagePreviews[0]} alt="" className="w-full h-48 object-cover" />
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
                      <span className="text-xs px-2.5 py-1 bg-accent rounded-full text-accent-foreground">{form.roomType} Room</span>
                      <span className="text-xs px-2.5 py-1 bg-muted rounded-full text-muted-foreground">📅 {form.availableDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom buttons */}
      <div className="fixed bottom-16 md:bottom-0 ltr:left-0 ltr:md:left-64 rtl:right-0 rtl:md:right-64 ltr:right-0 rtl:left-0 z-30 bg-background/80 backdrop-blur-lg border-t border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="rounded-xl flex-1">
              {t("back")}
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="rounded-xl flex-1 gradient-primary text-primary-foreground">
              {t("continueBtn")} <ArrowRight className="w-4 h-4 ltr:ml-1 rtl:mr-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="rounded-xl flex-1 gradient-primary text-primary-foreground">
              {submitting ? <><Loader2 className="w-4 h-4 ltr:mr-2 rtl:ml-2 animate-spin" /> {t("postingApt")}</> : <>{t("postApartmentBtn")}</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
