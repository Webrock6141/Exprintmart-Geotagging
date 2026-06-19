"use client"

import { useCallback, useRef, useState } from "react"
import { UploadCloud, X, MapPin, CheckCircle2, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ImageItem } from "@/components/geotag-tool"

interface UploadPanelProps {
  images: ImageItem[]
  onAddFiles: (files: FileList | File[]) => void
  onRemove: (id: string) => void
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"]

export function UploadPanel({ images, onAddFiles, onRemove }: UploadPanelProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (e.dataTransfer.files?.length) {
        onAddFiles(e.dataTransfer.files)
      }
    },
    [onAddFiles],
  )

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/10"
            : "border-border bg-muted/50 hover:border-primary/60 hover:bg-muted/80",
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <UploadCloud className="h-7 w-7" aria-hidden="true" />
        </div>
        <div>
          <p className="font-medium text-foreground text-balance">
            Drag & drop images here
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            or click to browse — JPG, PNG or WebP. Multiple files supported.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) onAddFiles(e.target.files)
            e.target.value = ""
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ImageIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          Uploaded images
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {images.length}
          </span>
        </h2>
      </div>

      {images.length === 0 ? (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          No images yet. Your uploads will appear here as thumbnails.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {images.map((img) => (
            <li
              key={img.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.dataURL || "/placeholder.svg"}
                alt={`Thumbnail of ${img.name}`}
                className="h-14 w-14 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {img.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(img.size / 1024).toFixed(0)} KB
                </p>
                {img.existingGeo && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-primary font-medium">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    Existing geotag found
                  </p>
                )}
                {img.processed && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    Downloaded
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${img.name}`}
                onClick={() => onRemove(img.id)}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}