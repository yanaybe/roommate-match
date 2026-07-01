import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import PhotoUpload from "@/components/PhotoUpload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { isSafeImageUrl } from "@/lib/security";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPhotos: string[];
  onSaved: (photos: string[]) => void;
}

export default function PhotoManagementSheet({ open, onOpenChange, initialPhotos, onSaved }: Props) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    for (const url of photos) {
      if (!isSafeImageUrl(url)) {
        toast.error("One or more photo URLs are invalid");
        return;
      }
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        photos,
        avatar_url: photos[0] ?? null,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save photos");
      return;
    }
    toast.success("Photos updated");
    onSaved(photos);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
          <SheetTitle className="text-lg font-extrabold">Manage Photos</SheetTitle>
          <p className="text-xs text-muted-foreground">
            Drag arrows to reorder · First photo is your profile picture
          </p>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <PhotoUpload photos={photos} onChange={setPhotos} maxPhotos={6} />
        </div>
        <div className="px-5 py-4 border-t border-border shrink-0">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl gradient-primary text-primary-foreground font-bold"
          >
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save Photos"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
