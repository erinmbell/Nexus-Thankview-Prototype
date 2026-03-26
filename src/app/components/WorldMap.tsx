import { useState, useMemo, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { TV } from "../theme";

const WORLD_GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/**
 * City coordinates [longitude, latitude] for global cities.
 */
const CITY_COORDS: Record<string, [number, number]> = {
  // US
  "New York": [-74.006, 40.7128],
  "Los Angeles": [-118.2437, 34.0522],
  "Boston": [-71.0589, 42.3601],
  "San Francisco": [-122.4194, 37.7749],
  "Chicago": [-87.6298, 41.8781],
  "Washington": [-77.0369, 38.9072],
  "Austin": [-97.7431, 30.2672],
  "Atlanta": [-84.388, 33.749],
  "Denver": [-104.9903, 39.7392],
  "Seattle": [-122.3321, 47.6062],
  "Philadelphia": [-75.1652, 39.9526],
  "Miami": [-80.1918, 25.7617],
  "Dallas": [-96.797, 32.7767],
  "Phoenix": [-112.074, 33.4484],
  "Minneapolis": [-93.265, 44.9778],
  "Portland": [-122.6765, 45.5231],
  "Houston": [-95.3698, 29.7604],
  "Nashville": [-86.7816, 36.1627],
  // Canada
  "Toronto": [-79.3832, 43.6532],
  "Vancouver": [-123.1216, 49.2827],
  "Montreal": [-73.5673, 45.5017],
  "Calgary": [-114.0719, 51.0447],
  "Ottawa": [-75.6972, 45.4215],
  // International
  "London": [-0.1278, 51.5074],
  "Paris": [2.3522, 48.8566],
  "Berlin": [13.405, 52.52],
  "Sydney": [151.2093, -33.8688],
  "Melbourne": [144.9631, -37.8136],
  "Tokyo": [139.6917, 35.6895],
  "Singapore": [103.8198, 1.3521],
  "Dubai": [55.2708, 25.2048],
  "Mexico City": [-99.1332, 19.4326],
  "São Paulo": [-46.6333, -23.5505],
  "Mumbai": [72.8777, 19.076],
  "Hong Kong": [114.1694, 22.3193],
};

/**
 * ISO 3166-1 numeric → 2-letter country code mapping.
 * world-atlas@2 uses numeric IDs as strings (e.g., "840" for US).
 */
const NUMERIC_TO_ALPHA2: Record<string, string> = {
  "840": "US", "124": "CA", "826": "GB", "250": "FR", "276": "DE",
  "036": "AU", "392": "JP", "702": "SG", "784": "AE", "484": "MX",
  "076": "BR", "356": "IN", "344": "HK", "156": "CN", "380": "IT",
  "724": "ES", "528": "NL", "056": "BE", "756": "CH", "040": "AT",
  "752": "SE", "578": "NO", "208": "DK", "246": "FI", "372": "IE",
  "620": "PT", "616": "PL", "203": "CZ", "410": "KR", "554": "NZ",
  "032": "AR", "152": "CL", "170": "CO", "604": "PE", "862": "VE",
  "818": "EG", "710": "ZA", "566": "NG", "404": "KE", "682": "SA",
  "376": "IL", "792": "TR", "643": "RU", "804": "UA", "764": "TH",
  "360": "ID", "608": "PH", "458": "MY", "704": "VN",
};

/** Friendly display names for 2-letter codes. */
const COUNTRY_DISPLAY: Record<string, string> = {
  US: "United States", CA: "Canada", GB: "United Kingdom", FR: "France",
  DE: "Germany", AU: "Australia", JP: "Japan", SG: "Singapore",
  AE: "United Arab Emirates", MX: "Mexico", BR: "Brazil", IN: "India",
  HK: "Hong Kong", CN: "China", IT: "Italy", ES: "Spain", NL: "Netherlands",
  BE: "Belgium", CH: "Switzerland", AT: "Austria", SE: "Sweden", NO: "Norway",
  DK: "Denmark", FI: "Finland", IE: "Ireland", PT: "Portugal", PL: "Poland",
  CZ: "Czech Republic", KR: "South Korea", NZ: "New Zealand", AR: "Argentina",
  CL: "Chile", CO: "Colombia", PE: "Peru", VE: "Venezuela", EG: "Egypt",
  ZA: "South Africa", NG: "Nigeria", KE: "Kenya", SA: "Saudi Arabia",
  IL: "Israel", TR: "Turkey", RU: "Russia", UA: "Ukraine", TH: "Thailand",
  ID: "Indonesia", PH: "Philippines", MY: "Malaysia", VN: "Vietnam",
};

interface CityDot {
  city: string;
  count: number;
}

interface TooltipInfo {
  label: string;
  value: string;
  x: number;
  y: number;
}

interface WorldMapProps {
  /** Country values keyed by 2-letter country code (e.g., "US", "CA"). */
  countryValues?: Record<string, number>;
  cityDots?: CityDot[];
  color?: string;
  /** Label for the metric shown in tooltips (e.g., "recipients", "views"). Defaults to "recipients". */
  valueLabel?: string;
  /** Called when a country is clicked. Returns the 2-letter code and display name. */
  onRegionClick?: (countryCode: string, countryName: string) => void;
}

export function WorldMap({
  countryValues = {},
  cityDots = [],
  color = TV.brand,
  valueLabel = "recipients",
  onRegionClick,
}: WorldMapProps) {
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  // Build a numeric-ID → value lookup so we can color-fill the TopoJSON features
  const numericValues = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [numId, alpha2] of Object.entries(NUMERIC_TO_ALPHA2)) {
      const val = countryValues[alpha2];
      if (val) map[numId] = val;
    }
    return map;
  }, [countryValues]);

  const vals = Object.values(numericValues);
  const maxVal = vals.length ? Math.max(...vals) : 1;

  const cr = parseInt(color.slice(1, 3), 16);
  const cg = parseInt(color.slice(3, 5), 16);
  const cb = parseInt(color.slice(5, 7), 16);

  const fillColor = useCallback(
    (numericId: string): string => {
      const v = numericValues[numericId];
      if (v === undefined || v === 0) return "#ede9f5";
      const pct = Math.min(v / maxVal, 1);
      const r = Math.round(0xed + (cr - 0xed) * pct);
      const g = Math.round(0xe9 + (cg - 0xe9) * pct);
      const b = Math.round(0xf5 + (cb - 0xf5) * pct);
      return `rgb(${r},${g},${b})`;
    },
    [numericValues, maxVal, cr, cg, cb]
  );

  const maxDotCount = useMemo(
    () => Math.max(...cityDots.map((d) => d.count), 1),
    [cityDots]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, label: string, value: string) => {
      const rect = (e.currentTarget as SVGElement)
        .closest(".world-map-root")
        ?.getBoundingClientRect();
      if (!rect) return;
      setTooltip({
        label,
        value,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    []
  );

  const clearTooltip = useCallback(() => setTooltip(null), []);

  const handleKeyDismiss = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") { clearTooltip(); (e.target as HTMLElement).blur(); }
  }, [clearTooltip]);

  const showTooltipAtCenter = useCallback((el: SVGElement | null, label: string, value: string) => {
    if (!el) return;
    const root = el.closest(".world-map-root")?.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (!root) return;
    setTooltip({ label, value, x: r.left - root.left + r.width / 2, y: r.top - root.top });
  }, []);

  return (
    <div className="world-map-root relative w-full h-full" role="img" aria-label="World map showing engagement distribution by country">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 130, center: [0, 30] }}
        width={800}
        height={420}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup>
          <Geographies geography={WORLD_GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                // world-atlas@2 uses numeric ID as string
                const numericId = String(geo.id);
                const alpha2 = NUMERIC_TO_ALPHA2[numericId];
                const displayName =
                  (alpha2 && COUNTRY_DISPLAY[alpha2]) ||
                  geo.properties?.name ||
                  "Unknown";
                const val = numericValues[numericId];
                const hasData = val !== undefined && val > 0;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillColor(numericId)}
                    stroke="#ffffff"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none", transition: "fill 150ms" },
                      hover: {
                        outline: `2px solid ${TV.brand}`,
                        outlineOffset: "-1px",
                        fill: hasData ? color : "#ddd6f3",
                        cursor: hasData && onRegionClick ? "pointer" : "default",
                      },
                      pressed: { outline: `2px solid ${TV.brand}`, outlineOffset: "-1px" },
                    }}
                    onMouseMove={(e) =>
                      handleMouseMove(
                        e as unknown as React.MouseEvent,
                        displayName,
                        hasData
                          ? `${val.toLocaleString()} ${valueLabel}`
                          : "No data"
                      )
                    }
                    onMouseLeave={clearTooltip}
                    onClick={() => {
                      if (onRegionClick && alpha2 && hasData) {
                        onRegionClick(alpha2, displayName);
                      }
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* City markers */}
          {cityDots.map((dot) => {
            const coords = CITY_COORDS[dot.city];
            if (!coords) return null;
            const pct = dot.count / maxDotCount;
            const r = 3 + pct * 6;
            return (
              <Marker key={dot.city} coordinates={coords}>
                <circle r={r + 2} fill={color} opacity={0.18} />
                <circle
                  r={r}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={1.5}
                  opacity={0.85}
                  tabIndex={0}
                  role="img"
                  aria-label={`${dot.city}: ${dot.count.toLocaleString()} ${valueLabel}`}
                  style={{
                    cursor: "default",
                    transition: "opacity 150ms",
                    outline: "none",
                  }}
                  onMouseMove={(e) =>
                    handleMouseMove(
                      e as unknown as React.MouseEvent,
                      dot.city,
                      `${dot.count.toLocaleString()} ${valueLabel}`
                    )
                  }
                  onMouseLeave={clearTooltip}
                  onFocus={(e) => showTooltipAtCenter(e.currentTarget as unknown as SVGElement, dot.city, `${dot.count.toLocaleString()} ${valueLabel}`)}
                  onBlur={clearTooltip}
                  onKeyDown={handleKeyDismiss}
                  onMouseEnter={(e) => {
                    (e.currentTarget as SVGCircleElement).setAttribute(
                      "opacity",
                      "1"
                    );
                    const glow = (e.currentTarget as SVGCircleElement)
                      .previousElementSibling;
                    if (glow) glow.setAttribute("opacity", "0.35");
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as SVGCircleElement).setAttribute(
                      "opacity",
                      "0.85"
                    );
                    const glow = (e.currentTarget as SVGCircleElement)
                      .previousElementSibling;
                    if (glow) glow.setAttribute("opacity", "0.18");
                  }}
                />
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: "translate(-50%, -100%)",
            background: "#fff",
            borderRadius: 10,
            border: `1px solid ${TV.borderLight}`,
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            padding: "6px 12px",
            whiteSpace: "nowrap",
            zIndex: 20,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: TV.textPrimary }}>
            {tooltip.label}
          </div>
          <div style={{ fontSize: 11, color: TV.textSecondary }}>{tooltip.value}</div>
        </div>
      )}
    </div>
  );
}