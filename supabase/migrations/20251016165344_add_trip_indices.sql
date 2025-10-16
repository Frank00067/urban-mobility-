-- Indices to optimize common filters and sorts on trips

-- Date/time filters
create index if not exists idx_trips_pickup_datetime on trips (pickup_datetime);
create index if not exists idx_trips_dropoff_datetime on trips (dropoff_datetime);

-- Vendor and flags
create index if not exists idx_trips_vendor_id on trips (vendor_id);
create index if not exists idx_trips_store_and_fwd_flag on trips (store_and_fwd_flag);

-- Duration and distance filters
create index if not exists idx_trips_trip_duration on trips (trip_duration);
create index if not exists idx_trips_trip_min_distance on trips (trip_min_distance);

-- Spatial indices for pickup and dropoff coordinates (SRID 4326)
create index if not exists idx_trips_pickup_coords_gix on trips using gist (pickup_coordinates);
create index if not exists idx_trips_dropoff_coords_gix on trips using gist (dropoff_coordinates);


