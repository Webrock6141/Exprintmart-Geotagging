"use client"

import { useEffect, useRef } from "react"
import "leaflet/dist/leaflet.css"

interface MapPreviewProps {
  lat: number | null
  lon: number | null
}

export function MapPreview({ lat, lon }: MapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Using `any` here because Leaflet is loaded dynamically on the client.
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const LRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      const L = (await import("leaflet")).default
      if (cancelled || !containerRef.current || mapRef.current) return
      LRef.current = L

      const startLat = lat ?? 20
      const startLon = lon ?? 0
      const map = L.map(containerRef.current, {
        center: [startLat, startLon],
        zoom: lat != null && lon != null ? 12 : 2,
        scrollWheelZoom: false,
        attributionControl: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
    }

    init()

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const L = LRef.current
    const map = mapRef.current
    if (!L || !map) return
    if (lat == null || lon == null || Number.isNaN(lat) || Number.isNaN(lon)) {
      if (markerRef.current) {
        map.removeLayer(markerRef.current)
        markerRef.current = null
      }
      return
    }

    const orangeIcon = L.divIcon({
      className: "",
      html: `<div style="
        width:18px;height:18px;border-radius:50% 50% 50% 0;
        background:#f97316;transform:rotate(-45deg);
        border:2px solid #fff;box-shadow:0 0 0 2px rgba(249,115,22,0.4);
      "></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 18],
    })

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lon], { icon: orangeIcon }).addTo(map)
    } else {
      markerRef.current.setLatLng([lat, lon])
    }
    map.setView([lat, lon], Math.max(map.getZoom(), 12), { animate: true })
  }, [lat, lon])

  return (
    <div
      ref={containerRef}
      className="h-72 w-full overflow-hidden rounded-lg border border-border"
      role="img"
      aria-label={
        lat != null && lon != null
          ? `Map showing location at latitude ${lat}, longitude ${lon}`
          : "Map preview, no coordinates entered yet"
      }
    />
  )
}
