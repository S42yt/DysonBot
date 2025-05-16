import mongoose, { Document, Schema } from 'mongoose';
import DatabaseHandler from './databaseHandler';

abstract class BaseSchema<T extends Document> {
  protected model!: mongoose.Model<T>;
  protected schema: Schema;
  protected modelName: string;
  protected dbHandler = DatabaseHandler.getInstance();

  /**
   * Create a new schema
   * @param modelName Name of the MongoDB model
   * @param schema Mongoose schema definition
   */
  constructor(modelName: string, schema: Schema) {
    this.modelName = modelName;
    this.schema = schema;

    this.registerModel();
  }

  private registerModel(): void {
    try {
      if (mongoose.models[this.modelName]) {
        this.model = mongoose.model<T>(this.modelName);
      } else {
        this.model = mongoose.model<T>(this.modelName, this.schema);
      }
    } catch (error) {
      throw new Error(`Failed to register model ${this.modelName}: ${error}`);
    }
  }

  /**
   * Create a new document
   * @param data Document data
   * @returns The created document
   */
  async create(data: Partial<T>): Promise<T> {
    await this.ensureConnected();
    return (await this.model.create(data)) as T;
  }

  /**
   * Find documents matching the given filter
   * @param filter Filter criteria
   * @returns Array of matching documents
   */
  async find(filter: object = {}): Promise<T[]> {
    await this.ensureConnected();
    return await this.model.find(filter).exec();
  }

  /**
   * Find a single document matching the given filter
   * @param filter Filter criteria
   * @returns Matching document or null
   */
  async findOne(filter: object): Promise<T | null> {
    await this.ensureConnected();
    return await this.model.findOne(filter).exec();
  }

  /**
   * Find a document by its ID
   * @param id Document ID
   * @returns Matching document or null
   */
  async findById(id: string): Promise<T | null> {
    await this.ensureConnected();
    return await this.model.findById(id).exec();
  }

  /**
   * Update a document matching the given filter
   * @param filter Filter criteria
   * @param update Update data
   * @param options Update options
   * @returns Updated document
   */
  async updateOne(
    filter: object,
    update: object,
    options: object = {}
  ): Promise<any> {
    await this.ensureConnected();
    return await this.model.updateOne(filter, update, options).exec();
  }

  /**
   * Update multiple documents matching the given filter
   * @param filter Filter criteria
   * @param update Update data
   * @param options Update options
   * @returns Update result
   */
  async updateMany(
    filter: object,
    update: object,
    options: object = {}
  ): Promise<any> {
    await this.ensureConnected();
    return await this.model.updateMany(filter, update, options).exec();
  }

  /**
   * Delete a document matching the given filter
   * @param filter Filter criteria
   * @returns Delete result
   */
  async deleteOne(filter: object): Promise<any> {
    await this.ensureConnected();
    return await this.model.deleteOne(filter).exec();
  }

  /**
   * Delete multiple documents matching the given filter
   * @param filter Filter criteria
   * @returns Delete result
   */
  async deleteMany(filter: object): Promise<any> {
    await this.ensureConnected();
    return await this.model.deleteMany(filter).exec();
  }

  getModel(): mongoose.Model<T> {
    return this.model;
  }

  private async ensureConnected(): Promise<void> {
    if (!this.dbHandler.getConnectionStatus()) {
      await this.dbHandler.connect();
      if (!this.dbHandler.getConnectionStatus()) {
        throw new Error('Failed to connect to database');
      }
    }
  }
}

export default BaseSchema;
