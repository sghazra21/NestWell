import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Loader2 } from 'lucide-react';

export interface PickedLocation {
  latitude: number;
  longitude: number;
  displayName: string;
  city: string;
}

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onPick: (loc: PickedLocation | null) => void;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
  };
}

// Default view: India
const DEFAULT_CENTER: [number, number] = [22.9734, 78.6569];
const DEFAULT_ZOOM = 5;
const FOCUS_ZOOM = 15;

export const LocationPicker: React.FC<LocationPickerProps> = ({ initialLat, initialLng, onPick }) => {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<PickedLocation | null>(
    initialLat != null && initialLng != null
      ? { latitude: initialLat, longitude: initialLng, displayName: '', city: '' }
      : null
  );
  const debounceRef = useRef<number | null>(null);

  // Init map once
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current).setView(
      initialLat != null && initialLng != null ? [initialLat, initialLng] : DEFAULT_CENTER,
      initialLat != null && initialLng != null ? FOCUS_ZOOM : DEFAULT_ZOOM
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const pin = L.divIcon({
      className: '',
      html: '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#4f46e5;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 24],
    });

    if (initialLat != null && initialLng != null) {
      markerRef.current = L.marker([initialLat, initialLng], { icon: pin, draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const ll = markerRef.current!.getLatLng();
        reverseGeocode(ll.lat, ll.lng);
      });
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!markerRef.current) {
        markerRef.current = L.marker(e.latlng, { icon: pin, draggable: true }).addTo(map);
        markerRef.current.on('dragend', () => {
          const ll = markerRef.current!.getLatLng();
          reverseGeocode(ll.lat, ll.lng);
        });
      } else {
        markerRef.current.setLatLng(e.latlng);
      }
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const placeMarker = (lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;
    const pin = L.divIcon({
      className: '',
      html: '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#4f46e5;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 24],
    });
    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { icon: pin, draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const ll = markerRef.current!.getLatLng();
        reverseGeocode(ll.lat, ll.lng);
      });
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    map.setView([lat, lng], Math.max(map.getZoom(), FOCUS_ZOOM));
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { Accept: 'application/json' } }
      );
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.municipality || addr.state || '';
      const loc: PickedLocation = {
        latitude: lat,
        longitude: lng,
        displayName: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        city,
      };
      setPicked(loc);
      onPick(loc);
    } catch {
      const loc: PickedLocation = { latitude: lat, longitude: lng, displayName: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, city: '' };
      setPicked(loc);
      onPick(loc);
    }
  };

  const search = async (q: string) => {
    if (q.trim().length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&addressdetails=1&limit=6`,
        { headers: { Accept: 'application/json' } }
      );
      const data: NominatimResult[] = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const onQueryChange = (v: string) => {
    setQuery(v);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => search(v), 400);
  };

  const selectResult = (r: NominatimResult) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    const addr = r.address || {};
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.state || '';
    placeMarker(lat, lng);
    const loc: PickedLocation = { latitude: lat, longitude: lng, displayName: r.display_name, city };
    setPicked(loc);
    onPick(loc);
    setResults([]);
    setQuery(r.display_name.split(',').slice(0, 2).join(','));
  };

  const clear = () => {
    setPicked(null);
    onPick(null);
    setQuery('');
    setResults([]);
    if (markerRef.current && mapRef.current) {
      mapRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-300">
        Society Location <span className="text-slate-500 font-normal">(search + pinpoint on map)</span>
      </label>
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search city, area, landmark…"
          className="w-full h-10 pl-9 pr-9 rounded-xl border border-slate-700 bg-slate-900 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
        />
        {searching && (
          <Loader2 className="w-4 h-4 text-indigo-400 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
        )}
        {results.length > 0 && (
          <ul className="absolute z-[1000] left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl max-h-56 overflow-y-auto">
            {results.map((r) => (
              <li key={r.place_id}>
                <button
                  type="button"
                  onClick={() => selectResult(r)}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-indigo-600/30 flex items-start gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{r.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div ref={mapEl} className="h-56 w-full rounded-xl border border-slate-700 overflow-hidden z-0" />
      {picked && (
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
          <p className="text-[11px] text-emerald-200 line-clamp-2 flex-1">
            📍 {picked.displayName || `${picked.latitude.toFixed(5)}, ${picked.longitude.toFixed(5)}`}
          </p>
          <button
            type="button"
            onClick={clear}
            className="text-[11px] font-bold text-slate-400 hover:text-white shrink-0"
          >
            Clear
          </button>
        </div>
      )}
      <p className="text-[10px] text-slate-500">Click anywhere on the map or drag the pin for the exact location.</p>
    </div>
  );
};
