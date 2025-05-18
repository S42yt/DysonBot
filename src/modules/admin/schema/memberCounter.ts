import { Document, Schema } from "mongoose";
import { BaseSchema } from "../../../core/index.js";

export interface CounterDocument extends Document {
  channelId: string;
  format: string;
  guildId: string;
  lastUpdated: Date;
}

const counterSchema = new Schema<CounterDocument>(
  {
    channelId: { type: String, required: true },
    format: {
      type: String,
      required: true,
      default: "「👥」Mitglieder✩ {count}",
    },
    guildId: { type: String, required: true },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

class CounterModel extends BaseSchema<CounterDocument> {
  constructor() {
    super("Counter", counterSchema);
  }

  async findByGuildId(guildId: string): Promise<CounterDocument | null> {
    return await this.findOne({ guildId });
  }

  async createOrUpdateCounter(
    guildId: string,
    channelId: string,
    format: string
  ): Promise<CounterDocument> {
    const existingCounter = await this.findOne({ guildId });

    if (existingCounter) {
      existingCounter.channelId = channelId;
      existingCounter.format = format;
      existingCounter.lastUpdated = new Date();
      return await existingCounter.save();
    } else {
      return await this.create({
        guildId,
        channelId,
        format,
        lastUpdated: new Date(),
      });
    }
  }
}

export default new CounterModel();
