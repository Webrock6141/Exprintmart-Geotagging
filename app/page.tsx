import { MapPin, Infinity as InfinityIcon, ShieldCheck } from "lucide-react"
import { GeoTagTool } from "@/components/geotag-tool"
import Image from "next/image";



export default function Page() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center">
              <Image
                src="/exprint_logo.svg" // Change this to your logo filename
                alt="Exprintmart Logo"
                width={48}
                height={48}
                className="h-12 w-auto"
                priority
              />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-foreground">
                {/* <span className="text-muted-foreground"> — Free Geotagging Tool</span> */}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <InfinityIcon className="h-4 w-4 text-primary" aria-hidden="true" />
              No daily limits
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              100% in your browser
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-balance text-2xl font-bold text-foreground sm:text-3xl">
            Embed EXIF geotags & metadata into your images
          </h2>
          <p className="mt-2 text-pretty text-muted-foreground leading-relaxed">
            Upload JPG, PNG or WebP images, add GPS coordinates, titles,
            keywords, descriptions and author info, then download tagged copies.
            Everything runs locally — your photos never leave your device.
          </p>
        </div>

        <GeoTagTool />
      </main>

      <footer className="border-t border-border bg-card/60">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-muted-foreground">
          &copy; Exprintmart | Unlimited Free Image Geotagging
        </div>
      </footer>
    </div>
  )
}
