import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Apartment } from "@/data/mockData";
import MatchBadge from "./MatchBadge";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface ApartmentMapProps {
  apartments: Apartment[];
}

export default function ApartmentMap({ apartments }: ApartmentMapProps) {
  const center: [number, number] = [32.075, 34.775]; // Tel Aviv center

  return (
    <div className="rounded-2xl overflow-hidden h-[60vh] shadow-card">
      <MapContainer
        center={center}
        zoom={13}
        className="w-full h-full z-0"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {apartments.map((apt) => (
          <Marker key={apt.id} position={apt.coordinates}>
            <Popup className="apartment-popup" minWidth={220} maxWidth={260}>
              <div className="p-1">
                <img
                  src={apt.images[0]}
                  alt={apt.title}
                  className="w-full h-28 object-cover rounded-lg mb-2"
                />
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-foreground truncate">{apt.title}</h3>
                    <p className="text-muted-foreground text-xs">{apt.location}</p>
                  </div>
                  <MatchBadge percent={apt.matchPercent} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-extrabold text-primary text-sm">
                    ₪{apt.price.toLocaleString()}/mo
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {apt.rooms} rooms · {apt.size}m²
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
