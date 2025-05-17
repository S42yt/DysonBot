import mongoose from "mongoose";
import Logger from "../../utils/logger.js";
import ConfigHandler from "../../utils/configHandler.js";

export class DatabaseHandler {
  private static instance: DatabaseHandler;
  private isConnected = false;
  private configHandler: ConfigHandler;

  private constructor() {
    this.configHandler = ConfigHandler.getInstance();
  }

  public static getInstance(): DatabaseHandler {
    if (!DatabaseHandler.instance) {
      DatabaseHandler.instance = new DatabaseHandler();
    }
    return DatabaseHandler.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      const config = this.configHandler.getConfig();
      const connectionString = config.connectionString;
      const dbName = config.dbName;

      const fullConnectionString = connectionString.startsWith("mongodb")
        ? connectionString
        : `mongodb+srv://${connectionString}`;

      Logger.info("Connecting to database...");

      await mongoose.connect(fullConnectionString, {
        dbName: dbName,
      });

      this.isConnected = true;
      Logger.info("Connected to database");
    } catch (error) {
      Logger.error("Error connecting to database:", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      Logger.info("Disconnected from database");
    } catch (error) {
      Logger.error("Error disconnecting from database:", error);
      throw error;
    }
  }

  public async getConnectionStatus(): Promise<boolean> {
    return this.isConnected;
  }

  public get connection(): typeof mongoose {
    return mongoose;
  }
}

export default DatabaseHandler;
