import request from "supertest";

// Mock the trips service used by the controller to avoid real Supabase calls
jest.mock("../services/trips.service", () => {
  return {
    __esModule: true,
    default: {
      listTrips: jest.fn().mockResolvedValue({
        data: {
          items: [
            {
              id: 1,
              vendor_id: 2,
              pickup_datetime: new Date("2020-01-01T10:00:00Z").toISOString(),
              dropoff_datetime: new Date("2020-01-01T10:20:00Z").toISOString(),
              passenger_count: 1,
              pickup_coordinates: {
                type: "Point",
                coordinates: [-73.98, 40.75],
              },
              dropoff_coordinates: {
                type: "Point",
                coordinates: [-73.99, 40.76],
              },
              store_and_fwd_flag: "N",
              trip_duration: 1200,
              trip_min_distance: 2.1,
              trip_speed: 6.3,
              suspicious_trip: false,
            },
          ],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
        error: null,
      }),
      mapData: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            pickup_coordinates: { type: "Point", coordinates: [-73.98, 40.75] },
            dropoff_coordinates: {
              type: "Point",
              coordinates: [-73.99, 40.76],
            },
          },
        ],
        error: null,
      }),
      stats: jest.fn().mockResolvedValue({
        data: {
          totalTrips: 10,
          avgDuration: 600,
          avgDistance: 3.2,
          avgSpeed: 19.2,
        },
        error: null,
      }),
      vendors: jest.fn().mockResolvedValue({
        data: [1, 2, 3],
        error: null,
      }),
    },
  };
});

import app from "../app";

describe("Trips API", () => {
  it("GET /api/v1/trips should return paginated items", async () => {
    const res = await request(app).get("/api/v1/trips?page=1&limit=20");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("items");
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.total).toBe(1);
  });

  it("GET /api/v1/trips/map should return points array", async () => {
    const res = await request(app).get("/api/v1/trips/map");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toHaveProperty("pickup_coordinates");
    expect(res.body.data[0]).toHaveProperty("dropoff_coordinates");
  });

  it("GET /api/v1/trips/stats should return totals and averages", async () => {
    const res = await request(app).get("/api/v1/trips/stats");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      totalTrips: 10,
      avgDuration: 600,
      avgDistance: 3.2,
      avgSpeed: 19.2,
    });
  });

  it("GET /api/v1/trips/vendors should return vendor ids", async () => {
    const res = await request(app).get("/api/v1/trips/vendors");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([1, 2, 3]);
  });
});
