import { useState, useMemo, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { TV } from "../theme";

/**
 * Standard US Atlas TopoJSON (10m resolution, Albers projection).
 * Publicly available via the topojson/us-atlas CDN.
 */
const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

/**
 * City coordinates (longitude, latitude) for the Albers USA projection.
 */
const CITY_COORDS: Record<string, [number, number]> = {
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
  "Dallas": [-96.797, 32.7767],
  "Phoenix": [-112.074, 33.4484],
  "Philadelphia": [-75.1652, 39.9526],
  "Miami": [-80.1918, 25.7617],
  "Minneapolis": [-93.265, 44.9778],
  "Portland": [-122.6765, 45.5231],
  "Kansas City": [-94.5786, 39.0997],
  "St. Louis": [-90.1994, 38.627],
  "Houston": [-95.3698, 29.7604],
  "Nashville": [-86.7816, 36.1627],
  "Charlotte": [-80.8431, 35.2271],
  "Columbus": [-82.9988, 39.9612],
  "Indianapolis": [-86.1581, 39.7684],
  "San Diego": [-117.1611, 32.7157],
  "Pittsburgh": [-79.9959, 40.4406],
  "Detroit": [-83.0458, 42.3314],
  "Salt Lake City": [-111.891, 40.7608],
  "Raleigh": [-78.6382, 35.7796],
  "Tampa": [-82.4572, 27.9506],
  "Orlando": [-81.3789, 28.5383],
};

/** FIPS code → state abbreviation. */
const FIPS_TO_STATE: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY", "72": "PR",
};

/** Reverse lookup: abbreviation → FIPS. */
const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

interface CityDot {
  city: string;
  count: number;
}

interface UsMapProps {
  stateValues?: Record<string, number>;
  cityDots?: CityDot[];
  color?: string;
}

interface TooltipInfo {
  label: string;
  value: string;
  x: number;
  y: number;
}

export function UsMap({
  stateValues = {},
  cityDots = [],
  color = "#7c45b0",
}: UsMapProps) {
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  const vals = Object.values(stateValues);
  const maxVal = vals.length ? Math.max(...vals) : 1;

  const cr = parseInt(color.slice(1, 3), 16);
  const cg = parseInt(color.slice(3, 5), 16);
  const cb = parseInt(color.slice(5, 7), 16);

  const stateColor = useCallback(
    (abbrev: string): string => {
      const v = stateValues[abbrev];
      if (v === undefined || v === 0) return "#ede9f5";
      const pct = Math.min(v / maxVal, 1);
      const r = Math.round(0xed + (cr - 0xed) * pct);
      const g = Math.round(0xe9 + (cg - 0xe9) * pct);
      const b = Math.round(0xf5 + (cb - 0xf5) * pct);
      return `rgb(${r},${g},${b})`;
    },
    [stateValues, maxVal, cr, cg, cb]
  );

  const maxDotCount = useMemo(
    () => Math.max(...cityDots.map((d) => d.count), 1),
    [cityDots]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent, label: string, value: string) => {
    const rect = (e.currentTarget as SVGElement).closest(".us-map-root")?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      label,
      value,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const clearTooltip = useCallback(() => setTooltip(null), []);

  return (
    <div className="us-map-root relative w-full h-full">
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{ scale: 1000 }}
        width={800}
        height={500}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const fips = geo.id as string;
              const abbrev = FIPS_TO_STATE[fips] || "";
              const val = stateValues[abbrev];
              const name = STATE_NAMES[abbrev] || abbrev;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={stateColor(abbrev)}
                  stroke="#ffffff"
                  strokeWidth={0.75}
                  style={{
                    default: { outline: "none", transition: "fill 150ms" },
                    hover: { outline: "2px solid #7c45b0", outlineOffset: "-1px", fill: color, cursor: "default" },
                    pressed: { outline: "2px solid #7c45b0", outlineOffset: "-1px" },
                  }}
                  onMouseMove={(e) =>
                    handleMouseMove(
                      e as unknown as React.MouseEvent,
                      name,
                      val ? `${val.toLocaleString()} views` : "No data"
                    )
                  }
                  onMouseLeave={clearTooltip}
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
          const r = 5 + pct * 9;
          return (
            <Marker key={dot.city} coordinates={coords}>
              {/* Glow ring */}
              <circle r={r + 3} fill={color} opacity={0.18} />
              {/* Main dot */}
              <circle
                r={r}
                fill={color}
                stroke="#fff"
                strokeWidth={2}
                opacity={0.85}
                style={{ cursor: "default", transition: "opacity 150ms" }}
                onMouseMove={(e) =>
                  handleMouseMove(
                    e as unknown as React.MouseEvent,
                    dot.city,
                    `${dot.count.toLocaleString()} views`
                  )
                }
                onMouseLeave={clearTooltip}
                onMouseEnter={(e) => {
                  (e.currentTarget as SVGCircleElement).setAttribute("opacity", "1");
                  const glow = (e.currentTarget as SVGCircleElement).previousElementSibling;
                  if (glow) glow.setAttribute("opacity", "0.35");
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as SVGCircleElement).setAttribute("opacity", "0.85");
                  const glow = (e.currentTarget as SVGCircleElement).previousElementSibling;
                  if (glow) glow.setAttribute("opacity", "0.18");
                }}
              />
            </Marker>
          );
        })}
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