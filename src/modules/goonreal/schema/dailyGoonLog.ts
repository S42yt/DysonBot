import mongoose, { Schema, Document } from "mongoose";

export interface IDailyGoonLog extends Document {
  guildId: string;
  date: Date;
  triggeredBy: "automatic" | "manual";
  adminUserId?: string;
  sentAt: Date;
}

const dailyGoonLogSchema = new Schema<IDailyGoonLog>({
  guildId: { type: String, required: true },
  date: { type: Date, required: true },
  triggeredBy: { type: String, enum: ["automatic", "manual"], required: true },
  adminUserId: { type: String, default: null },
  sentAt: { type: Date, default: Date.now },
});

dailyGoonLogSchema.index({ guildId: 1, date: 1 }, { unique: true });

const DailyGoonLogModel = mongoose.model<IDailyGoonLog>("DailyGoonLog", dailyGoonLogSchema);

export default class DailyGoonLog {
  static async hasBeenSentToday(guildId: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const log = await DailyGoonLogModel.findOne({
      guildId,
      date: { $gte: today, $lt: tomorrow }
    });

    return !!log;
  }

  static async logDailyGoon(
    guildId: string,
    triggeredBy: "automatic" | "manual",
    adminUserId?: string
  ): Promise<IDailyGoonLog> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const log = await DailyGoonLogModel.findOneAndUpdate(
      { guildId, date: today },
      { 
        triggeredBy, 
        adminUserId: adminUserId || null,
        sentAt: new Date()
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );

    return log;
  }

  static async getTodaysLog(guildId: string): Promise<IDailyGoonLog | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return await DailyGoonLogModel.findOne({
      guildId,
      date: { $gte: today, $lt: tomorrow }
    });
  }

  static async getRecentLogs(guildId: string, days: number = 7): Promise<IDailyGoonLog[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return await DailyGoonLogModel.find({
      guildId,
      date: { $gte: startDate }
    }).sort({ date: -1 });
  }
}