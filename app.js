const express = require('express');
const accessRoutes = require('./routes/access');
const adminRoutes = require('./routes/admin');
const corsMiddleware = require('./middleware/corsMiddleware');

const app = express();

// 应用 CORS 日志中间件
app.use(corsMiddleware.logger());

// 应用 CORS 中间件
app.use(corsMiddleware.getMiddleware());

// 应用预检请求处理
app.use(corsMiddleware.preflightMiddleware());

// 手动设置 CORS 头（备用）
app.use(corsMiddleware.setHeaders());

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// 路由
app.use('/access', accessRoutes);
app.use('/admin', adminRoutes);

// 健康检查路由
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '服务运行正常',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    cors: {
      allowedOrigins: require('./config/cors').getAllowedOrigins(),
    },
  });
});

// 根路由
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SCL90访问追踪系统 API',
    version: '1.0.0',
    cors: {
      enabled: true,
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
    endpoints: {
      access: '/access/:uniqueId',
      info: '/access/:uniqueId/info',
      admin: '/access/admin/records',
      health: '/health',
    },
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '路由不存在',
    path: req.originalUrl,
  });
});
// CORS 错误处理
app.use(corsMiddleware.errorHandler());
// 全局错误处理中间件
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  const statusCode = error.status || 500;
  const response = {
    success: false,
    message: '服务器内部错误',
  };

  // 开发环境返回详细错误信息
  if (process.env.NODE_ENV === 'development') {
    response.error = error.message;
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
});
module.exports = app;
