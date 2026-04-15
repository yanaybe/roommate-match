import { useState, useRef } from "react";
import { Camera, X, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { validateImageMagicBytes } from "@/lib/security";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface PhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export default function PhotoUpload({ photos, onChange, maxPhotos = 6 }: PhotoUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !user) return;

    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setUploading(true);
    const newPhotos: string[] = [];

    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];

      // Validate MIME type against allowlist (not just the filename extension)
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        toast.error("Only JPEG, PNG, WebP, and GIF images are allowed");
        continue;
      }

      // Enforce file size limit
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File too large — maximum size is 10 MB");
        continue;
      }

      // Validate magic bytes — prevents polyglot files that spoof MIME type
      const isTrulyImage = await validateImageMagicBytes(file);
      if (!isTrulyImage) {
        toast.error("File does not appear to be a valid image");
        continue;
      }

      // Derive extension from MIME type, not filename, to prevent extension spoofing
      const ext = file.type.split("/")[1] || "jpg";
      const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, file, { upsert: true });

      if (error) {
        toast.error("Failed to upload photo");
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(filePath);

      newPhotos.push(urlData.publicUrl);
    }

    onChange([...photos, ...newPhotos]);
    setUploading(false);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemove = async (index: number) => {
    const url = photos[index];
    // Extract file path from URL
    const match = url.match(/profile-photos\/(.+)$/);
    if (match) {
      await supabase.storage.from("profile-photos").remove([match[1]]);
    }
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="text-sm font-semibold text-foreground block mb-2">
        Photos {photos.length > 0 && <span className="text-muted-foreground font-normal">({photos.length}/{maxPhotos})</span>}
      </label>
      <p className="text-xs text-muted-foreground mb-3">
        Add at least 1 photo. First photo is your profile picture.
      </p>

      <div className="grid grid-cols-3 gap-2">
        {/* Existing photos */}
        {photos.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-secondary group">
            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            {i === 0 && (
              <span className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                Main
              </span>
            )}
            <button
              onClick={() => handleRemove(i)}
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-foreground/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5 text-background" />
            </button>
          </div>
        ))}

        {/* Add photo button */}
        {photos.length < maxPhotos && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            ) : (
              <>
                {photos.length === 0 ? (
                  <Camera className="w-6 h-6 text-muted-foreground" />
                ) : (
                  <Plus className="w-6 h-6 text-muted-foreground" />
                )}
                <span className="text-[10px] text-muted-foreground">
                  {photos.length === 0 ? "Add photo" : "Add more"}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
