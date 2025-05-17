import mongoose, { Schema, Document } from "mongoose";

export interface IMemberStatus extends Document {
  userId: string;
  displayName: string;
  username: string;
  status: "angemeldet" | "abgemeldet";
  reason?: string;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MemberStatusSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    username: { type: String, required: true },
    status: {
      type: String,
      enum: ["angemeldet", "abgemeldet"],
      default: "angemeldet",
      required: true,
    },
    reason: { type: String, default: null },
    endTime: { type: Date, default: null },
  },
  { timestamps: true }
);

export const MemberStatusModel = mongoose.model<IMemberStatus>(
  "MemberStatus",
  MemberStatusSchema
);
