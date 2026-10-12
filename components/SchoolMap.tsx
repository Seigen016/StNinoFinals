'use client';

import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef } from 'react';

const COORDS: [number, number] = [120.8620, 14.2826];

// Lucide `LocateFixed` as inline SVG string
const LOCATE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#404040" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="2" y1="12" x2="5" y2="12"/>
  <line x1="19" y1="12" x2="22" y2="12"/>
  <line x1="12" y1="2" x2="12" y2="5"/>
  <line x1="12" y1="19" x2="12" y2="22"/>
  <circle cx="12" cy="12" r="7"/>
  <circle cx="12" cy="12" r="3"/>
</svg>`;

class RecenterControl implements maplibregl.IControl {
  private _container: HTMLElement | null = null;

  onAdd(map: maplibregl.Map) {
    this._container = document.createElement('div');
    this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = 'Center map';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.innerHTML = LOCATE_ICON;
    btn.onclick = () => map.flyTo({ center: COORDS, zoom: 15, duration: 800 });

    this._container.appendChild(btn);
    return this._container;
  }

  onRemove() {
    this._container?.remove();
  }
}

const PULSE_CSS = `
  @keyframes markerPulse {
    0%   { transform: scale(1);   opacity: 0.6; }
    70%  { transform: scale(2.2); opacity: 0;   }
    100% { transform: scale(2.2); opacity: 0;   }
  }
  .marker-wrapper { position: relative; width: 56px; height: 56px; cursor: pointer; }
  .marker-pulse {
    position: absolute; inset: 0; border-radius: 50%;
    background: rgba(127,29,29,0.4);
    animation: markerPulse 2s ease-out infinite;
  }
  .marker-pulse-delay { animation-delay: 0.6s; }
  .marker-logo {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 44px; height: 44px;
    border-radius: 50%;
    border: 3px solid #7f1d1d;
    box-shadow: 0 3px 12px rgba(0,0,0,0.25);
    overflow: hidden;
    background: #fff;
  }
  .marker-logo img { width: 100%; height: 100%; object-fit: cover; }
`;

export function SchoolMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    if (!document.getElementById('marker-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'marker-pulse-style';
      style.textContent = PULSE_CSS;
      document.head.appendChild(style);
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: COORDS,
      zoom: 15,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new RecenterControl(), 'top-right');

    // Marker: two staggered pulse rings + logo
    const wrapper = document.createElement('div');
    wrapper.className = 'marker-wrapper';
    const pulse1 = document.createElement('div');
    pulse1.className = 'marker-pulse';
    const pulse2 = document.createElement('div');
    pulse2.className = 'marker-pulse marker-pulse-delay';
    const logoWrap = document.createElement('div');
    logoWrap.className = 'marker-logo';
    const img = document.createElement('img');
    img.src = '/logo.png';
    logoWrap.appendChild(img);
    wrapper.appendChild(pulse1);
    wrapper.appendChild(pulse2);
    wrapper.appendChild(logoWrap);

    const popup = new maplibregl.Popup({ offset: 30, closeButton: false }).setHTML(`
      <div style="padding:10px 14px;font-family:system-ui,sans-serif;">
        <p style="font-weight:700;color:#1a1a1a;margin:0 0 4px;font-size:13px;">Sto. Niño de Praga Academy</p>
        <p style="color:#666;font-size:11px;margin:0;">Trece Martires City, Cavite</p>
      </div>
    `);

    new maplibregl.Marker({ element: wrapper })
      .setLngLat(COORDS)
      .setPopup(popup)
      .addTo(map);

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  return (
    <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden ring-1 ring-gray-200">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
