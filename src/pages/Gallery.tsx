import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Upload, Trash2, Image, X, Download } from "lucide-react";

const BUCKET = "event-photos";

const fetchPhotos = async () => {
  const { data, error } = await supabase.storage.from(BUCKET).list("", {
    limit: 500,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw error;
  return (data || []).filter((f) => f.name !== ".emptyFolderPlaceholder");
};

const getPublicUrl = (name: string) =>
  supabase.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;

export default function Gallery() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ["event-photos"],
    queryFn: fetchPhotos,
  });

  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.storage.from(BUCKET).remove([name]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-photos"] });
      setSelected(null);
      toast({ title: "Photo deleted" });
    },
  });

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      setUploading(true);
      setProgress(0);
      let done = 0;
      let errors = 0;

      for (const file of files) {
        const ext = file.name.split(".").pop();
        const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(name, file);
        if (error) errors++;
        done++;
        setProgress(Math.round((done / files.length) * 100));
      }

      setUploading(false);
      queryClient.invalidateQueries({ queryKey: ["event-photos"] });
      toast({
        title: `Uploaded ${done - errors} of ${files.length} photos`,
        variant: errors ? "destructive" : "default",
      });
      e.target.value = "";
    },
    [queryClient],
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 pt-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Image className="h-8 w-8 text-primary" /> Event Gallery
            </h1>
            <p className="text-muted-foreground mt-1">
              {photos.length} photo{photos.length !== 1 ? "s" : ""} uploaded
            </p>
          </div>

          <label>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            <Button asChild disabled={uploading} size="lg">
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading…" : "Upload Photos"}
              </span>
            </Button>
          </label>
        </div>

        {/* Progress */}
        {uploading && (
          <div className="space-y-2">
            <Progress value={progress} className="h-3" />
            <p className="text-sm text-muted-foreground text-center">{progress}%</p>
          </div>
        )}

        {/* Gallery grid */}
        {isLoading ? (
          <p className="text-center text-muted-foreground py-20">Loading photos…</p>
        ) : photos.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Image className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg">No photos yet</p>
            <p className="text-sm">Upload some event photos to get started</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.name}
                className="aspect-square rounded-lg overflow-hidden cursor-pointer border border-border hover:border-primary transition-colors relative group"
                onClick={() => setSelected(photo.name)}
              >
                <img
                  src={getPublicUrl(photo.name)}
                  alt="Event photo"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {selected && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <a
                href={getPublicUrl(selected)}
                download
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Button size="icon" variant="secondary">
                  <Download className="h-4 w-4" />
                </Button>
              </a>
              <Button
                size="icon"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMutation.mutate(selected);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="secondary" onClick={() => setSelected(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <img
              src={getPublicUrl(selected)}
              alt="Event photo"
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
}
