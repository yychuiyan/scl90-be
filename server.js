const app = require('./app');
const config = require('./config/env');

// 启动服务器
const server = app.listen(config.port, () => {
  console.log(`=================================`);
  console.log(`🚀 服务器运行在端口 ${config.port}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 数据库: ${config.database}`);
  console.log(`🎯 数据库类型: ${config.database.includes('localhost') ? '本地' : '远程'}`);
  console.log(`=================================`);
});

// 优雅关闭
const gracefulShutdown = async signal => {
  console.log(`\n收到 ${signal} 信号，正在关闭服务器...`);

  server.close(async () => {
    console.log('HTTP服务器已关闭');

    const AccessRecord = require('./models/AccessRecord');
    await AccessRecord.close();

    console.log('数据库连接已关闭');
    console.log('服务器优雅关闭完成');
    process.exit(0);
  });

  // 如果5秒后还没有关闭，强制退出
  setTimeout(() => {
    console.error('强制关闭服务器...');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获异常处理
process.on('uncaughtException', error => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

module.exports = server;
