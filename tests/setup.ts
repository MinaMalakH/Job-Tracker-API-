import { connectMongoDB } from "../src/config/database";
import mongoose from "mongoose";

beforeAll(async () => {
  await connectMongoDB();
});

afterAll(async () => {
  await mongoose.connection.close();
});
