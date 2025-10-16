import request from "supertest";
import app from "./app";

describe("App", () => {
  it("GET /health should return status 200 and expected JSON", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "OK");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("uptime");
    expect(res.body).toHaveProperty("environment");
    expect(res.body).toHaveProperty("version");
  });

  it("GET /hello-world should respond", async () => {
    const res = await request(app).get("/hello-world");
    expect(res.status).toBe(200);
  });
});
