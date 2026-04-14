const express = require('express');
const router = express.Router();
const AccessRecord = require('../models/AccessRecord');

/**
 * 从 MongoDB 更新结果中提取文档数据
 */
function extractDocumentFromResult(result) {
  if (!result) return null;

  // 如果是 MongoDB 的更新结果，文档在 value 属性中
  if (result.value) {
    return result.value;
  }

  // 如果是直接文档对象，直接返回
  return result;
}

/**
 * 处理访问请求
 * GET /access/:uniqueId
 */
router.get('/:uniqueId', async (req, res) => {
  try {
    const { uniqueId } = req.params;

    // 参数验证
    if (!uniqueId || uniqueId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '唯一标识不能为空',
      });
    }

    // 查找记录
    let record = await AccessRecord.findByUniqueId(uniqueId);

    if (record) {
      return res.status(200).json({
        success: true,
        message: '访问成功',
        data: {
          uniqueId,
          status: record.status,
          accessCount: record.accessCount,
          isAccessStatus: record.isAccessStatus,
          firstAccessTime: record.firstAccessTime && new Date(record.firstAccessTime).toISOString(),
          updateTime: new Date(record.updateTime).toISOString(),
          createTime: record.createTime,
        },
      });
      // 检查是否在24小时内
      // const within24Hours = AccessRecord.isWithin24Hours(record);
      // if (within24Hours) {

      // } else {
      // 超过24小时，更新状态为失效
      // const updatedRestul = await AccessRecord.update(uniqueId, { status: 'expired' });
      // // 从更新结果中提取文档
      // const updatedRecord = extractDocumentFromResult(updatedRestul);

      // return res.status(200).json({
      //   success: false,
      //   message: '访问已失效（超过24小时）',
      //   data: {
      //     uniqueId,
      //     status: 'expired',
      //     accessCount: updatedRecord.accessCount,
      //     firstAccessTime: new Date(updatedRecord.firstAccessTime).toISOString(),
      //     updateTime: new Date(updatedRecord.updateTime).toISOString(),
      //     isWithin24Hours: false,
      //   },
      // });
      // }
    } else {
      // 记录不存在，创建新记录
      const newRecord = await AccessRecord.create(uniqueId);

      return res.status(201).json({
        success: true,
        message: '新记录创建成功',
        data: {
          uniqueId,
          status: 'active',
          accessCount: 0,
          firstAccessTime: '',
          updateTime: new Date(newRecord.updateTime).toISOString(),
          createDate: AccessRecord.formatTime(newRecord.createDate),
          isWithin24Hours: true,
          isAccessStatus: false,
        },
      });
    }
  } catch (error) {
    // 处理重复键错误（唯一标识冲突）
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: '唯一标识已存在，请重试',
      });
    }

    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});
/**
 * 创建单个访问记录
 * POST /access
 * Body: { uniqueId: 'your-unique-id' }
 */
router.post('/insert', async (req, res) => {
  try {
    const { uniqueId } = req.body;

    // 参数验证
    if (!uniqueId || typeof uniqueId !== 'string' || uniqueId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'uniqueId 是必须的且必须是有效的字符串',
      });
    }

    const trimmedId = uniqueId.trim();
    console.log(`创建单个访问记录请求: uniqueId = ${trimmedId}`);

    // 调用单个创建方法
    // 假设 AccessRecord.create 方法接收一个 uniqueId 字符串并返回创建好的记录对象
    const createdRecord = await AccessRecord.create(trimmedId);

    // 如果创建成功，返回 201 Created 状态码和新创建的记录
    res.status(201).json({
      success: true,
      data: createdRecord,
    });
  } catch (error) {
    console.error('创建单个访问记录路由错误:', error);

    res.status(500).json({
      success: false,
      message: '创建访问记录失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});
/**
 * 批量创建访问记录
 * POST /access/batch
 * Body: { uniqueIds: ['id1', 'id2', 'id3'] }
 */
router.post('/batch', async (req, res) => {
  try {
    const { uniqueIds } = req.body;

    // 参数验证
    if (!uniqueIds || !Array.isArray(uniqueIds)) {
      return res.status(400).json({
        success: false,
        message: 'uniqueIds 是必须的且必须是数组',
      });
    }

    if (uniqueIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'uniqueIds 数组不能为空',
      });
    }

    // 验证数组中的每个元素
    const invalidIds = uniqueIds.filter(id => !id || typeof id !== 'string' || id.trim() === '');
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'uniqueIds 中包含无效的唯一标识',
        invalidIds,
      });
    }

    console.log(`批量创建请求: ${uniqueIds.length} 个唯一标识`);

    // 调用批量创建方法
    const result = await AccessRecord.batchCreate(uniqueIds.map(id => id.trim()));

    res.status(result.created > 0 ? 201 : 200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('批量创建路由错误:', error);

    res.status(500).json({
      success: false,
      message: '批量创建失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});
/**
 * 获取记录信息
 * GET /access/:uniqueId/info
 */
router.get('/:uniqueId/info', async (req, res) => {
  try {
    const { uniqueId } = req.params;

    const record = await AccessRecord.findByUniqueId(uniqueId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: '记录不存在',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...record,
        firstAccessTime: new Date(record.firstAccessTime).toISOString(),
        updateTime: new Date(record.updateTime).toISOString(),
        isWithin24Hours: AccessRecord.isWithin24Hours(record),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

/**
 * 获取所有记录（用于管理）
 * GET /access/admin/records
 */
router.get('/admin/records', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const records = await AccessRecord.findAll(parseInt(limit));

    const formattedRecords = records.map(record => ({
      ...record,
      firstAccessTime: new Date(record.firstAccessTime).toISOString(),
      updateTime: new Date(record.updateTime).toISOString(),
      isWithin24Hours: AccessRecord.isWithin24Hours(record),
    }));

    res.status(200).json({
      success: true,
      data: {
        records: formattedRecords,
        total: formattedRecords.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

module.exports = router;
