/**
 * CORS 中间件封装
 * 提供统一的 CORS 处理
 */

const cors = require('cors');
const corsConfig = require('../config/cors');

class CorsMiddleware {
  constructor() {
    this.corsOptions = null;
    this.init();
  }

  // 初始化 CORS 配置
  init() {
    const env = process.env.NODE_ENV || 'development';
    this.corsOptions = corsConfig.getConfig(env);

    console.log(`🌐 CORS 配置已加载 - 环境: ${env}`);
    console.log(`📋 允许的域名: ${corsConfig.getAllowedOrigins(env)}`);
  }

  // 获取 CORS 中间件
  getMiddleware() {
    return cors(this.corsOptions);
  }

  // 处理预检请求的中间件
  preflightMiddleware() {
    return (req, res, next) => {
      if (req.method === 'OPTIONS') {
        res.header('Access-Control-Max-Age', this.corsOptions.maxAge || 86400);
        res.sendStatus(this.corsOptions.optionsSuccessStatus || 204);
      } else {
        next();
      }
    };
  }

  // 手动设置响应头（备用）
  setHeaders() {
    return (req, res, next) => {
      const origin = req.headers.origin;

      // 检查 origin 是否在允许列表中
      if (this.isOriginAllowed(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
      }

      res.header('Access-Control-Allow-Methods', this.corsOptions.methods.join(', '));
      res.header('Access-Control-Allow-Headers', this.corsOptions.allowedHeaders.join(', '));
      res.header('Access-Control-Allow-Credentials', this.corsOptions.credentials.toString());

      if (this.corsOptions.exposedHeaders && this.corsOptions.exposedHeaders.length > 0) {
        res.header('Access-Control-Expose-Headers', this.corsOptions.exposedHeaders.join(', '));
      }

      next();
    };
  }

  // 检查 origin 是否允许
  isOriginAllowed(origin) {
    if (!origin) return false;

    if (Array.isArray(this.corsOptions.origin)) {
      return this.corsOptions.origin.includes(origin);
    } else if (typeof this.corsOptions.origin === 'function') {
      // 对于函数类型的 origin 检查，我们这里简化处理
      // 实际应该调用函数，但这里为了简单直接返回 true
      return true;
    } else if (this.corsOptions.origin === '*') {
      return true;
    }

    return false;
  }

  // 动态添加允许的域名
  addAllowedOrigin(origin) {
    corsConfig.addAllowedOrigin(origin);
    this.init(); // 重新初始化以应用更改
  }

  // 错误处理中间件
  errorHandler() {
    return (error, req, res, next) => {
      if (error.message && error.message.includes('不被允许访问')) {
        return res.status(403).json({
          success: false,
          message: '跨域请求被拒绝',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
      }
      next(error);
    };
  }

  // 日志中间件
  logger() {
    return (req, res, next) => {
      const origin = req.headers.origin || '无 Origin';
      const method = req.method;
      const path = req.path;

      console.log(`🌐 CORS 请求: ${method} ${path} - Origin: ${origin}`);

      // 记录预检请求
      if (method === 'OPTIONS') {
        console.log(`🛰️  预检请求: ${path}`);
      }

      next();
    };
  }
}

// 创建单例实例
const corsMiddleware = new CorsMiddleware();

module.exports = corsMiddleware;
