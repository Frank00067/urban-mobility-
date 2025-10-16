create table vendors {
    id bigint primary key default nextval('vendors_id_seq'::regclass),
    name text
};

alter table vendors enable row level security;

create policy "Allow read access to all users" on vendors
    for select using (true);

create extension if not exists postgis with schema extensions;

create table trips {
    id bigint primary key default nextval('trips_id_seq'::regclass),
    vendor_id bigint references vendors(id),
    pickup_datetime timestamp,
    dropoff_datetime timestamp,
    passenger_count integer,
    pickup_coordinates extensions.geometry(Point, 4326),
    dropoff_coordinates extensions.geometry(Point, 4326),
    store_and_fwd_flag varchar(1),
    trip_duration integer,
    trip_speed float,
    trip_min_distance float,
    suspicious_trip boolean
};

alter table trips enable row level security;
create policy "Allow read access to all users" on trips
    for select using (true);
