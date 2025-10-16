type Trip = Record<string, unknown>;

const state = {
  page: 1,
  limit: 20,
  totalPages: 0,
  filters: {} as Record<string, string>,
};

const qs = (params: Record<string, unknown>) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
    )
    .join("&");

const fetchVendors = async () => {
  const res = await fetch(`/api/v1/trips/vendors`);
  const json = await res.json();
  const select = document.getElementById("vendor-select") as HTMLSelectElement;
  (json.data as number[]).forEach((id: number) => {
    const opt = document.createElement("option");
    opt.value = String(id);
    opt.textContent = String(id);
    const existingVendors = new Set<number>();
    for (const option of select.options) {
      existingVendors.add(Number(option.value));
    }
    if (!existingVendors.has(id)) {
      select.appendChild(opt);
    }
  });
};

const fetchStats = async () => {
  const res = await fetch(`/api/v1/trips/stats?${qs(state.filters)}`);
  const { data } = await res.json();
  (document.getElementById("card-total") as HTMLElement).textContent = String(
    data.totalTrips,
  );
  (document.getElementById("card-avg-duration") as HTMLElement).textContent = (
    Math.round(data.avgDuration * 100) / 100
  ).toString();
  (document.getElementById("card-avg-distance") as HTMLElement).textContent = (
    Math.round(data.avgDistance * 100) / 100
  ).toString();
  (document.getElementById("card-avg-speed") as HTMLElement).textContent = (
    Math.round(data.avgSpeed * 100) / 100
  ).toString();
};

type LngLat = [number, number];
type Role = "pickup" | "dropoff";
interface FeaturePoint {
  type: "Feature";
  geometry: { type: "Point"; coordinates: LngLat };
  properties: { id: number; role: Role; color: string };
}
interface FeatureLine {
  type: "Feature";
  geometry: { type: "LineString"; coordinates: LngLat[] };
  properties: Record<string, unknown>;
}
interface FeatureCollectionPoints {
  type: "FeatureCollection";
  features: FeaturePoint[];
}
interface GeojsonSourceLike {
  setData: (d: FeatureCollectionPoints | FeatureLine) => void;
  _data?: FeatureCollectionPoints;
}
interface MapboxMapLike {
  getSource: (id: string) => unknown;
  addSource: (id: string, source: unknown) => void;
  addLayer: (layer: unknown) => void;
  setPaintProperty: (layerId: string, prop: string, value: unknown) => void;
  getPaintProperty: (layerId: string, prop: string) => unknown;
  on: (event: string, layerIdOrHandler: unknown, handler?: unknown) => void;
}
interface PopupLike {
  setLngLat: (lngLat: LngLat) => PopupLike;
  setHTML: (html: string) => PopupLike;
  addTo: (map: MapboxMapLike) => PopupLike;
  remove: () => void;
}
declare const mapboxgl: {
  accessToken: string;
  Map: new (options: {
    container: string;
    style: string;
    center: LngLat;
    zoom: number;
  }) => MapboxMapLike;
  Popup: new (options?: {
    closeButton?: boolean;
    closeOnClick?: boolean;
  }) => PopupLike;
};

const getMapboxToken = (): string => {
  // the server injects this via EJS into a meta tag for simplicity
  const meta = document.querySelector(
    'meta[name="mapbox-token"]',
  ) as HTMLMetaElement | null;
  return meta?.content || "";
};

const colorForId = (id: number) => {
  const rand = Math.sin(id) * 10000;
  const r = Math.floor((rand - Math.floor(rand)) * 256);
  const g = Math.floor(
    (Math.sin(id * 1.3) - Math.floor(Math.sin(id * 1.3))) * 256,
  );
  const b = Math.floor(
    (Math.sin(id * 1.7) - Math.floor(Math.sin(id * 1.7))) * 256,
  );
  return `rgb(${(r + 256) % 256}, ${(g + 256) % 256}, ${(b + 256) % 256})`;
};

let map: MapboxMapLike | null = null;

const ensureMap = () => {
  if (map) return map;
  const token = getMapboxToken();
  if (!token) return null;
  mapboxgl.accessToken = token;
  map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: [-73.9857, 40.7484],
    zoom: 10,
  });
  return map;
};

const fetchMap = async () => {
  const m = ensureMap();
  if (!m) return;
  const res = await fetch(`/api/v1/trips/map?${qs(state.filters)}`);
  const { data } = await res.json();
  const features: FeaturePoint[] = [];
  (
    data as {
      id: number;
      pickup_coordinates: { coordinates: LngLat };
      dropoff_coordinates: { coordinates: LngLat };
    }[]
  ).forEach((row) => {
    const color = colorForId(row.id);
    if (row.pickup_coordinates?.coordinates) {
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: row.pickup_coordinates.coordinates,
        },
        properties: { id: row.id, role: "pickup", color },
      });
    }
    if (row.dropoff_coordinates?.coordinates) {
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: row.dropoff_coordinates.coordinates,
        },
        properties: { id: row.id, role: "dropoff", color },
      });
    }
  });
  const geojson: FeatureCollectionPoints = {
    type: "FeatureCollection",
    features,
  };
  const existingSource = m.getSource("trip-points") as
    | GeojsonSourceLike
    | undefined;
  if (existingSource) {
    existingSource.setData(geojson);
  } else {
    m.on("load", () => {
      m.addSource("trip-points", { type: "geojson", data: geojson });
      m.addLayer({
        id: "trip-points",
        type: "circle",
        source: "trip-points",
        paint: {
          "circle-radius": 4,
          "circle-color": ["get", "color"],
          "circle-opacity": 0.7,
        },
      });
      // hover interaction: popup + blinking line between pickup and dropoff
      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true,
      });
      let blinkInterval: number | null = null;
      const setLine = (coords: LngLat[], width: number, color: string) => {
        const sourceId = "trip-line";
        const layerId = "trip-line-layer";
        const lineData: FeatureLine = {
          type: "Feature",
          geometry: { type: "LineString", coordinates: coords },
          properties: {},
        };
        const lineSource = m.getSource(sourceId) as
          | GeojsonSourceLike
          | undefined;
        if (lineSource) {
          lineSource.setData(lineData);
        } else {
          m.addSource(sourceId, { type: "geojson", data: lineData });
          m.addLayer({
            id: layerId,
            type: "line",
            source: sourceId,
            paint: {
              "line-color": color,
              "line-width": width,
              "line-opacity": 1,
            },
          });
        }
        m.setPaintProperty(layerId, "line-width", width);
        m.setPaintProperty(layerId, "line-color", color);
      };
      m.on("mousemove", "trip-points", (e: { features?: FeaturePoint[] }) => {
        const f = e.features && e.features[0];
        if (!f) return;
        const id = f.properties.id;
        const color = f.properties.color;
        const role = f.properties.role;
        const point = f.geometry.coordinates;
        // find the counterpart point in the source data
        const src = m.getSource("trip-points") as GeojsonSourceLike | undefined;
        const fallback: FeatureCollectionPoints = {
          type: "FeatureCollection",
          features: [],
        };
        const fc: FeatureCollectionPoints =
          src && src._data ? (src._data as FeatureCollectionPoints) : fallback;
        const other = fc.features.find(
          (x: FeaturePoint) =>
            x.properties.id === id && x.properties.role !== role,
        );
        if (!other) return;
        const otherPoint = other.geometry.coordinates;
        const circleRadius =
          (m.getPaintProperty("trip-points", "circle-radius") as number) || 4;
        setLine([point, otherPoint], circleRadius, color);
        // blink twice
        if (blinkInterval) {
          clearInterval(blinkInterval);
          blinkInterval = null;
        }
        let count = 0;
        blinkInterval = window.setInterval(() => {
          const cur = m.getPaintProperty("trip-line-layer", "line-opacity") as
            | number
            | undefined;
          m.setPaintProperty(
            "trip-line-layer",
            "line-opacity",
            cur && cur > 0 ? 0 : 1,
          );
          count += 1;
          if (count >= 4 && blinkInterval) {
            // 4 toggles ~ 2 blinks
            clearInterval(blinkInterval);
            blinkInterval = null;
            m.setPaintProperty("trip-line-layer", "line-opacity", 1);
          }
        }, 250);
        popup
          .setLngLat(point)
          .setHTML(
            `<div><strong>Trip ${id}</strong><br/>Role: ${role}<br/>Color: ${color}</div>`,
          )
          .addTo(m);
      });
      m.on("mouseleave", "trip-points", () => {
        popup.remove();
      });
    });
  }
};

const fetchTrips = async () => {
  const params = { page: state.page, limit: state.limit, ...state.filters };
  const res = await fetch(`/api/v1/trips?${qs(params)}`);
  const json = await res.json();
  const items: Trip[] = json.data.items;
  state.totalPages = json.data.totalPages;
  (document.getElementById("page-info") as HTMLElement).textContent =
    `Page ${state.page} of ${state.totalPages}`;
  renderTable(items);
};

const renderTable = (items: Trip[]) => {
  const thead = document.querySelector(
    "#trips-table thead",
  ) as HTMLTableSectionElement;
  const tbody = document.querySelector(
    "#trips-table tbody",
  ) as HTMLTableSectionElement;
  tbody.innerHTML = "";
  thead.innerHTML = "";
  if (!items || items.length === 0) return;
  const first: Trip = items[0] ?? {};
  const columns = Object.keys(first as object);
  const trh = document.createElement("tr");
  columns.forEach((c) => {
    const th = document.createElement("th");
    th.textContent = c;
    if (c === "vendor_id" || c === "store_and_fwd_flag")
      th.className = "col-flag";
    if (c === "passenger_count") th.className = "col-count";
    if (c === "suspicious_trip") th.className = "col-bool";
    if (c === "pickup_datetime" || c === "dropoff_datetime")
      th.className = "col-datetime";
    if (c === "trip_speed" || c === "trip_min_distance")
      th.className = "col-narrow";
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  items.forEach((row) => {
    const tr = document.createElement("tr");
    columns.forEach((c) => {
      const td = document.createElement("td");
      const v = row[c as keyof Trip] as unknown;
      if (c === "pickup_coordinates" || c === "dropoff_coordinates") {
        const coords = (v as { coordinates: [number, number] } | undefined)
          ?.coordinates;
        const btn = document.createElement("button");
        btn.className = "copy-btn";
        btn.textContent = coords
          ? `Copy (${coords[0].toFixed(5)}, ${coords[1].toFixed(5)})`
          : "Copy";
        btn.addEventListener("click", async () => {
          if (coords) {
            await navigator.clipboard.writeText(`${coords[0]},${coords[1]}`);
            btn.textContent = "Copied!";
            setTimeout(
              () =>
                (btn.textContent = coords
                  ? `Copy (${coords[0].toFixed(5)}, ${coords[1].toFixed(5)})`
                  : "Copy"),
              1200,
            );
          }
        });
        td.appendChild(btn);
      } else if (c === "trip_speed" && typeof v === "number") {
        td.textContent = `${v.toFixed(2)} mph`;
      } else if (c === "trip_min_distance" && typeof v === "number") {
        td.textContent = `${v.toFixed(2)} mi`;
      } else if (
        (c === "pickup_datetime" || c === "dropoff_datetime") &&
        typeof v === "string"
      ) {
        const d = new Date(v);
        const compact = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        td.textContent = compact;
        td.className = "col-datetime";
      } else {
        td.textContent =
          typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
      }
      if (c === "vendor_id" || c === "store_and_fwd_flag")
        td.className = "col-flag";
      if (c === "passenger_count") td.className = "col-count";
      if (c === "suspicious_trip") td.className = "col-bool";
      if (c === "trip_speed" || c === "trip_min_distance")
        td.className = "col-narrow";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
};

const readFiltersFromForm = () => {
  const form = document.getElementById("filters") as HTMLFormElement;
  const fd = new FormData(form);
  const obj: Record<string, string> = {};
  fd.forEach((v, k) => {
    if (v) obj[k] = String(v);
  });
  state.filters = obj;
};

const attachEvents = () => {
  const prevBtn = document.getElementById("prev-page");
  if (prevBtn)
    prevBtn.addEventListener("click", () => {
      if (state.page > 1) {
        state.page -= 1;
        refresh();
      }
    });
  const nextBtn = document.getElementById("next-page");
  if (nextBtn)
    nextBtn.addEventListener("click", () => {
      if (state.page < state.totalPages) {
        state.page += 1;
        refresh();
      }
    });
  (document.getElementById("page-size") as HTMLSelectElement).addEventListener(
    "change",
    (e) => {
      state.limit = parseInt((e.target as HTMLSelectElement).value, 10);
      state.page = 1;
      refresh();
    },
  );
  (document.getElementById("filters") as HTMLFormElement).addEventListener(
    "submit",
    (e) => {
      e.preventDefault();
      readFiltersFromForm();
      state.page = 1;
      refresh();
    },
  );
  const resetBtn = document.getElementById("reset-filters");
  if (resetBtn)
    resetBtn.addEventListener("click", () => {
      (document.getElementById("filters") as HTMLFormElement).reset();
      state.filters = {};
      state.page = 1;
      refresh();
    });
};

const refresh = async () => {
  await Promise.all([fetchVendors(), fetchStats(), fetchMap(), fetchTrips()]);
};

window.addEventListener("DOMContentLoaded", async () => {
  attachEvents();
  await refresh();
});
