create table vendors (
    id bigserial primary key,
    name text
);

alter table vendors enable row level security;

create policy "Allow read access to all users" on vendors
    for select using (true);

create extension if not exists postgis with schema extensions;

create table trips (
    id bigserial primary key,
    vendor_id bigint references vendors(id),
    pickup_datetime timestamp,
    dropoff_datetime timestamp,
    passenger_count integer,
    pickup_coordinates extensions.geometry(Point, 4326),
    dropoff_coordinates extensions.geometry(Point, 4326),
    store_and_fwd_flag varchar(1),
    trip_duration integer,
    trip_speed float generated always as (
        case
            when trip_duration > 0 then
                (extensions.st_distance(
                    extensions.st_transform(pickup_coordinates, 2163),
                    extensions.st_transform(dropoff_coordinates, 2163)
                ) / 1609.34) / (trip_duration / 3600.0)
            else null
        end
    ) stored,
    trip_min_distance float generated always as (
        case
            when pickup_coordinates is not null and dropoff_coordinates is not null then
                extensions.st_distance(
                    extensions.st_transform(pickup_coordinates, 2163),
                    extensions.st_transform(dropoff_coordinates, 2163)
                ) / 1609.34
            else null
        end
    ) stored,
    suspicious_trip boolean
);

alter table trips enable row level security;
create policy "Allow read access to all users" on trips
    for select using (true);