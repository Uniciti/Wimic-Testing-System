import { Schema } from "mongoose";

export const TestResultSchema: Schema = new Schema({
    date: { type: String, required: true },
    time: { type: String, required: true },
    testType: { type: String, required: true },
    platform: { type: String, required: true },
    result: { type: String, required: true },
    data: { type: Array, required: true }
});