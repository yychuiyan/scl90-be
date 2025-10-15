require('dotenv').config();

// 根据环境加载对应的 .env 文件
const env = process.env.NODE_ENV || 'development';
if (env === 'production') {
  require('dotenv').config({ path: '.env.production' });
} else if (env === 'test') {
  require('dotenv').config({ path: '.env.test' });
}

const config = {
  development: {
    port: 9898,
    database: 'mongodb://localhost:27017/scl90',
    logLevel: 'debug',
  },
  production: {
    port: process.env.PORT || 9898,
    database: process.env.MONGODB_URI, // 移除默认值，强制使用环境变量
    logLevel: 'error',
  },
  test: {
    port: 9899,
    database: 'mongodb://localhost:27017/scl90_test',
    logLevel: 'error',
  },
};
module.exports = config[env];
