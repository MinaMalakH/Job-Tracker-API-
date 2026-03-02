import request from "supertest";
import { app } from "../src/index"; // ← import the exported app

describe("Auth API", () => {
  it("should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "testnew999@example.com", // use unique email each time
      password: "password123",
      name: "Test User",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("email", "testnew999@example.com");
  });
});
