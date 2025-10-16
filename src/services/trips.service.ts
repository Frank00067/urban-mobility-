import supabase from "../utils/supabase";

export interface Filters {
  start_date?: string | undefined;
  end_date?: string | undefined;
  duration_min?: number | undefined;
  duration_max?: number | undefined;
  distance_min?: number | undefined;
  distance_max?: number | undefined;
  store_and_fwd_flag?: ("Y" | "N" | "all") | undefined;
  vendor_id?: number | undefined;
}

type Comparable = string | number;
interface FilterOps {
  gte: (column: string, value: Comparable) => FilterOps;
  lte: (column: string, value: Comparable) => FilterOps;
  eq: (column: string, value: Comparable) => FilterOps;
}
const applyFilters = (query: FilterOps, filters: Filters): FilterOps => {
  let q: FilterOps = query;
  if (filters.start_date) q = q.gte("pickup_datetime", filters.start_date);
  if (filters.end_date) q = q.lte("dropoff_datetime", filters.end_date);
  if (filters.duration_min !== undefined)
    q = q.gte("trip_duration", filters.duration_min);
  if (filters.duration_max !== undefined)
    q = q.lte("trip_duration", filters.duration_max);
  if (filters.distance_min !== undefined)
    q = q.gte("trip_min_distance", filters.distance_min);
  if (filters.distance_max !== undefined)
    q = q.lte("trip_min_distance", filters.distance_max);
  if (filters.vendor_id !== undefined) q = q.eq("vendor_id", filters.vendor_id);
  if (filters.store_and_fwd_flag && filters.store_and_fwd_flag !== "all") {
    q = q.eq("store_and_fwd_flag", filters.store_and_fwd_flag);
  }
  return q;
};

const listTrips = async ({
  page,
  limit,
  filters,
}: {
  page: number;
  limit: number;
  filters: Filters;
}) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  interface RangeResult {
    data: unknown[] | null;
    error: unknown | null;
    count: number | null;
  }
  interface OrderOps extends FilterOps {
    order: (column: string, opts: { ascending: boolean }) => RangeOps;
  }
  interface RangeOps extends FilterOps {
    range: (from: number, to: number) => Promise<RangeResult>;
  }
  let baseQuery = supabase
    .from("trips")
    .select("*", { count: "planned" }) as unknown as OrderOps;
  baseQuery = applyFilters(baseQuery, filters) as OrderOps;
  const ordered = baseQuery.order("pickup_datetime", { ascending: true });
  const ranged = ordered.range(from, to);
  const { data, error, count }: RangeResult = await ranged;
  if (error) return { data: null, error };
  return {
    data: {
      items: (data as unknown[]) ?? [],
      total: (count as number | null) ?? 0,
      page,
      limit,
      totalPages: count ? Math.ceil((count as number) / limit) : 0,
    },
    error: null,
  };
};

const mapData = async ({ filters }: { filters: Filters }) => {
  let q = supabase
    .from("trips")
    .select("id, pickup_coordinates, dropoff_coordinates", {
      head: false,
    }) as unknown as FilterOps & {
    limit: (n: number) => Promise<{ data: unknown; error: unknown }>;
  };
  q = applyFilters(q, filters) as typeof q;
  const { data, error } = (await q.limit(20000)) as {
    data: unknown;
    error: unknown;
  }; // cap to prevent huge payloads
  if (error) return { data: null, error };
  const rows =
    (data as { pickup_coordinates: unknown; dropoff_coordinates: unknown }[]) ??
    [];
  return { data: rows, error: null };
};

const stats = async ({ filters }: { filters: Filters }) => {
  let q = supabase
    .from("trips")
    .select(
      "trip_duration, trip_min_distance, id, vendor_id, store_and_fwd_flag, pickup_datetime, dropoff_datetime",
    ) as unknown as FilterOps & Promise<{ data: unknown; error: unknown }>;
  q = applyFilters(q, filters) as typeof q;
  const { data, error } = await (q as unknown as Promise<{
    data: unknown;
    error: unknown;
  }>);
  if (error) return { data: null, error };
  interface Row {
    trip_duration: number | null;
    trip_min_distance: number | null;
    id: number;
  }
  const rows: Row[] = (data as Row[]) ?? [];
  const totalTrips = rows.length;
  let sumDuration = 0;
  let sumDistance = 0;
  for (const r of rows) {
    sumDuration += r.trip_duration ?? 0;
    sumDistance += r.trip_min_distance ?? 0;
  }
  const avgDuration = totalTrips ? sumDuration / totalTrips : 0;
  const avgDistance = totalTrips ? sumDistance / totalTrips : 0;
  const avgSpeed = totalTrips ? avgDistance / (avgDuration / 3600 || 1) : 0;
  return {
    data: { totalTrips, avgDuration, avgDistance, avgSpeed },
    error: null,
  };
};

const vendors = async () => {
  const { data, error } = await supabase
    .from("vendors")
    .select("id")
    .order("id", { ascending: true });
  if (error) return { data: null, error };
  const ids = (data ?? []).map((v) => v.id);
  return { data: ids, error: null };
};

export default { listTrips, mapData, stats, vendors };
