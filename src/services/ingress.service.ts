import { Database } from "../types/database.types";
import supabase from "../utils/supabase";

type TripInsert = Database["public"]["Tables"]["trips"]["Insert"];

type FileData = Pick<
  Express.Multer.File,
  "fieldname" | "originalname" | "mimetype" | "size" | "buffer"
>;

<<<<<<< HEAD
const upsertTrips = async (trips: TripInsert[]) => {
  const { data, error } = await supabase
    .from("trips")
    .upsert(trips, { onConflict: "id" });

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
=======
const upsertTrips = async (tripsBatch: TripInsert[][]) => {
  const errorList = [];
  for (const trips of tripsBatch) {
    const { error } = await supabase
      .from("trips")
      .upsert(trips, { onConflict: "id" });

    if (error) {
      errorList.push(error);
    }
  }

  if (errorList.length > 0) {
    return { error: { message: "Some errors occured", errors: errorList } };
  }

  return { data: null, error: null };
>>>>>>> 142719504754837855f7b0bef6dc9069d465a5df
};

const calculateTimeDifferenceInSeconds = (
  start: string,
  end: string,
): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return (endDate.getTime() - startDate.getTime()) / 1000;
};

const readRowsFromCSV = async (
  fileData: Buffer,
<<<<<<< HEAD
): Promise<{ trips: TripInsert[]; vendorIds: Set<number> }> => {
  const textData = fileData.toString("utf-8");
  const lines = textData.split("\n");
  const trips: TripInsert[] = [];
=======
): Promise<{ tripsBatch: TripInsert[][]; vendorIds: Set<number> }> => {
  const textData = fileData.toString("utf-8");
  const lines = textData.split("\n");
  const tripsBatch: TripInsert[][] = [];
  let currentBatch: TripInsert[] = [];
>>>>>>> 142719504754837855f7b0bef6dc9069d465a5df
  const vendorIds = new Set<number>();

  for (const line of lines.slice(1)) {
    // Skip header line
    const [
      id,
      vendor_id,
      pickup_datetime,
      dropoff_datetime,
      passenger_count,
      pickup_longitude,
      pickup_latitude,
      dropoff_longitude,
      dropoff_latitude,
      store_and_fwd_flag,
      trip_duration,
    ] = line.split(",");

    if (vendor_id) {
      vendorIds.add(parseInt(vendor_id));
    }

    if (
      id &&
      vendor_id &&
      pickup_datetime &&
      dropoff_datetime &&
      passenger_count &&
      pickup_longitude &&
      pickup_latitude &&
      dropoff_longitude &&
      dropoff_latitude &&
      store_and_fwd_flag &&
      trip_duration
    ) {
<<<<<<< HEAD
      trips.push({
=======
      currentBatch.push({
>>>>>>> 142719504754837855f7b0bef6dc9069d465a5df
        id: parseInt(id.slice(2), 10),
        vendor_id: parseInt(vendor_id, 10),
        pickup_datetime: new Date(pickup_datetime).toISOString(),
        dropoff_datetime: new Date(dropoff_datetime).toISOString(),
        passenger_count: parseInt(passenger_count, 10),
        pickup_coordinates: {
          type: "Point",
          coordinates: [
            parseFloat(pickup_longitude),
            parseFloat(pickup_latitude),
          ],
        },
        dropoff_coordinates: {
          type: "Point",
          coordinates: [
            parseFloat(dropoff_longitude),
            parseFloat(dropoff_latitude),
          ],
        },
        store_and_fwd_flag: store_and_fwd_flag === "Y" ? "Y" : "N",
        trip_duration: parseInt(trip_duration, 10),
        suspicious_trip: false,
      });
<<<<<<< HEAD
    }
  }

  return { trips, vendorIds };
=======

      if (currentBatch.length === 1000) {
        tripsBatch.push(currentBatch);
        currentBatch = [];
      }
    }
  }

  // Push the last batch if it has any trips
  if (currentBatch.length > 0) {
    tripsBatch.push(currentBatch);
  }

  return { tripsBatch, vendorIds };
>>>>>>> 142719504754837855f7b0bef6dc9069d465a5df
};

const upsertVendors = async (vendorIds: Set<number>) => {
  const vendors = Array.from(vendorIds).map((id) => ({
    id,
    name: `Vendor ${id}`,
  }));
  const { error } = await supabase
    .from("vendors")
    .upsert(vendors, { onConflict: "id" });

  if (error) {
    return { error };
  }

  return { error: null };
};

<<<<<<< HEAD
const processTripData = async (trips: TripInsert[]): Promise<TripInsert[]> => {
  return trips.map((trip) => {
    const durationInSeconds = calculateTimeDifferenceInSeconds(
      trip.pickup_datetime ?? new Date().toISOString(),
      trip.dropoff_datetime ?? new Date().toISOString(),
    );
    return {
      ...trip,
      suspicious_trip: trip.trip_duration !== durationInSeconds,
    };
  });
=======
const processTripData = async (
  tripsBatch: TripInsert[][],
): Promise<TripInsert[][]> => {
  const processedTrips: TripInsert[][] = [];
  for (const trips of tripsBatch) {
    const processed = trips.map((trip) => {
      const durationInSeconds = calculateTimeDifferenceInSeconds(
        trip.pickup_datetime ?? new Date().toISOString(),
        trip.dropoff_datetime ?? new Date().toISOString(),
      );
      return {
        ...trip,
        suspicious_trip: trip.trip_duration !== durationInSeconds,
      };
    });
    processedTrips.push(processed);
  }
  return processedTrips;
>>>>>>> 142719504754837855f7b0bef6dc9069d465a5df
};

export const ingest = async (fileData: FileData) => {
  try {
<<<<<<< HEAD
    const { trips, vendorIds } = await readRowsFromCSV(fileData.buffer);
    const processedTrips = await processTripData(trips);
=======
    const { tripsBatch, vendorIds } = await readRowsFromCSV(fileData.buffer);
    const processedTrips = await processTripData(tripsBatch);
>>>>>>> 142719504754837855f7b0bef6dc9069d465a5df
    const { error: upsertedVendorsError } = await upsertVendors(vendorIds);
    if (upsertedVendorsError) {
      return { data: null, error: upsertedVendorsError };
    }
<<<<<<< HEAD
=======

>>>>>>> 142719504754837855f7b0bef6dc9069d465a5df
    const { error: upsertedTripsError } = await upsertTrips(processedTrips);

    if (upsertedTripsError) {
      return { data: null, error: upsertedTripsError };
    }

    const { count: totalTripsCount, error: countTripsError } = await supabase
      .from("trips")
      .select("id", { count: "exact", head: true });

    if (countTripsError) {
      return { data: null, error: countTripsError };
    }

    const { count: totalVendorsCount, error: countVendorsError } =
      await supabase
        .from("vendors")
        .select("id", { count: "exact", head: true });

    if (countVendorsError) {
      return { data: null, error: countVendorsError };
    }

    return {
      data: {
        totalTrips: totalTripsCount || 0,
        totalVendors: totalVendorsCount || 0,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
};

<<<<<<< HEAD
export default { ingest };
=======
export default { ingest };
>>>>>>> 142719504754837855f7b0bef6dc9069d465a5df
