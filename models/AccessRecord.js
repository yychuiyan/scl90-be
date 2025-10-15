const { MongoClient, ObjectId } = require('mongodb');
const config = require('../config/env');

class AccessRecord {
  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;
    this.init();
  }

  async init() {
    try {
      const uri = config.database;
      const dbName = this.getDatabaseName(uri);

      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.collection = this.db.collection('access_records');

      console.log(`MongoDB数据库连接成功！`);

      // 创建索引
      await this.createIndexes();
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  /**
   * 从连接字符串中提取数据库名称
   */
  getDatabaseName(uri) {
    // 如果URI中包含数据库名称，则使用它
    const match = uri.match(/mongodb:\/\/[^/]+\/([^?]+)/);
    if (match && match[1]) {
      return match[1];
    }

    // 否则根据环境返回默认数据库名称
    const env = process.env.NODE_ENV || 'development';
    const dbNames = {
      development: 'scl90',
      production: 'scl90',
      test: 'scl90_test',
    };

    return dbNames[env];
  }

  /**
   * 创建必要的索引
   */
  async createIndexes() {
    try {
      await this.collection.createIndex({ uniqueId: 1 }, { unique: true });
      await this.collection.createIndex({ status: 1 });
      await this.collection.createIndex({ firstAccessTime: 1 });
      await this.collection.createIndex({ updateTime: 1 });

      console.log('Database indexes created successfully');
    } catch (error) {
      console.error('Error creating indexes:', error);
      throw error;
    }
  }

  /**
   * 根据唯一标识查找记录
   */
  async findByUniqueId(uniqueId) {
    try {
      return await this.collection.findOne({ uniqueId });
    } catch (error) {
      console.error('Error finding record:', error);
      throw error;
    }
  }

  /**
   * 创建新的访问记录
   */
  async create(uniqueId) {
    try {
      const now = Date.now();
      const record = {
        uniqueId,
        status: 'active',
        firstAccessTime: now,
        accessCount: 1,
        updateTime: now,
      };

      const result = await this.collection.insertOne(record);
      return { ...record, _id: result.insertedId };
    } catch (error) {
      console.error('Error creating record:', error);
      throw error;
    }
  }

  /**
   * 更新访问记录
   */
  async update(uniqueId, updateData) {
    try {
      const result = await this.collection.findOneAndUpdate(
        { uniqueId },
        {
          $set: {
            ...updateData,
            updateTime: Date.now(),
          },
        },
        { returnDocument: 'after' }
      );

      return result;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  }

  /**
   * 增加访问次数
   */
  async incrementAccessCount(uniqueId) {
    try {
      const result = await this.collection.findOneAndUpdate(
        { uniqueId },
        {
          $inc: { accessCount: 1 },
          $set: { updateTime: Date.now() },
        },
        { returnDocument: 'after' }
      );

      return result;
    } catch (error) {
      console.error('Error incrementing access count:', error);
      throw error;
    }
  }

  /**
   * 检查记录是否在24小时内
   */
  isWithin24Hours(record) {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return now - record.firstAccessTime <= twentyFourHours;
  }

  /**
   * 获取所有记录（用于调试和管理）
   */
  async findAll(limit = 50) {
    try {
      return await this.collection.find({}).sort({ updateTime: -1 }).limit(limit).toArray();
    } catch (error) {
      console.error('Error finding all records:', error);
      throw error;
    }
  }

  /**
   * 删除记录（用于测试）
   */
  async deleteByUniqueId(uniqueId) {
    try {
      const result = await this.collection.deleteOne({ uniqueId });
      return result;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }

  /**
   * 关闭数据库连接
   */
  async close() {
    if (this.client) {
      await this.client.close();
      console.log('MongoDB connection closed');
    }
  }
}

module.exports = new AccessRecord();
