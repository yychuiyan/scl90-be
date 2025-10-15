/**
 * CORS 配置模块
 * 提供跨域资源共享的配置选项
 */

const corsConfig = {
  // 开发环境配置
  development: {
    origin: function (origin, callback) {
      // 允许的域名列表
      const allowedOrigins = [
        'http://localhost:9898', // 您的后端端口
        'http://127.0.0.1:9898',
        'http://127.0.0.1',
      ];

      // 允许 null origin（本地文件系统）
      // 允许没有 origin 的请求（如移动应用、Postman等）
      if (!origin || origin === 'null' || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log(`CORS 拒绝: ${origin}`);
        callback(new Error(`域名 ${origin} 不被允许访问`), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-API-Key',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Current-Page'],
    maxAge: 86400, // 24小时
    preflightContinue: false,
    optionsSuccessStatus: 204,
  },

  // 生产环境配置
  production: {
    origin: function (origin, callback) {
      // 允许的域名列表 - 在生产环境中应该配置实际的前端域名
      const allowedOrigins = [
        'https://scl.yychuiyan.com',
        'https://scl-admin.yychuiyan.com',
        'https://scl-be.yychuiyan.com',
      ];

      // 允许没有 origin 的请求（如移动应用、Postman等）
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error(`域名 ${origin} 不被允许访问`), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  },

  // 测试环境配置
  test: {
    origin: '*',
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600, // 10分钟
  },

  // 获取当前环境的 CORS 配置
  getConfig: function (env = process.env.NODE_ENV || 'development') {
    return this[env] || this.development;
  },

  // 动态添加允许的域名
  addAllowedOrigin: function (origin, env = process.env.NODE_ENV || 'development') {
    if (this[env] && this[env].origin) {
      if (Array.isArray(this[env].origin)) {
        if (!this[env].origin.includes(origin)) {
          this[env].origin.push(origin);
        }
      }
    }
  },

  // 获取允许的域名列表（用于日志等）
  getAllowedOrigins: function (env = process.env.NODE_ENV || 'development') {
    const config = this.getConfig(env);
    return Array.isArray(config.origin) ? config.origin : 'dynamic (including null)';
  },
};

module.exports = corsConfig;
