import mongoose, { Schema, Document } from "mongoose";

export interface IGoonStreak extends Document {
  userId: string;
  guildId: string;
  currentStreak: number;
  lastSubmission: Date;
  quotes: Array<{
    date: Date;
    content: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const goonStreakSchema = new Schema<IGoonStreak>(
  {
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    currentStreak: { type: Number, default: 0 },
    lastSubmission: { type: Date, default: null },
    quotes: [
      {
        date: { type: Date, required: true },
        content: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

goonStreakSchema.index({ userId: 1, guildId: 1 }, { unique: true });

const GoonStreakModel = mongoose.model<IGoonStreak>(
  "GoonStreak",
  goonStreakSchema
);

export default class GoonStreak {
  static async findOrCreateUser(
    userId: string,
    guildId: string
  ): Promise<IGoonStreak> {
    let user = await GoonStreakModel.findOne({ userId, guildId });
    if (!user) {
      user = new GoonStreakModel({ userId, guildId });
      await user.save();
    }
    return user;
  }

  static async updateStreak(
    userId: string,
    guildId: string,
    quote: string
  ): Promise<IGoonStreak> {
    const user = await this.findOrCreateUser(userId, guildId);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (user.lastSubmission && user.lastSubmission >= today) {
      throw new Error("Already submitted today");
    }

    if (user.lastSubmission) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (user.lastSubmission < yesterday) {
        user.currentStreak = 0;
      }
    }

    user.currentStreak += 1;
    user.lastSubmission = now;
    user.quotes.push({ date: now, content: quote });

    await user.save();
    return user;
  }

  static async getUserStreak(
    userId: string,
    guildId: string
  ): Promise<IGoonStreak | null> {
    return await GoonStreakModel.findOne({ userId, guildId });
  }

  static async getAllUsers(guildId: string): Promise<IGoonStreak[]> {
    return await GoonStreakModel.find({ guildId });
  }
}
