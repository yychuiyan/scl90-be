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
      // 记录存在，检查是否在24小时内
      const within24Hours = AccessRecord.isWithin24Hours(record);
      console.log(`Within 24 hours: ${within24Hours}`);
      // 记录存在，检查是否在24小时内
      if (within24Hours) {
        // 在24小时内，增加访问次数
        const updateResult = await AccessRecord.incrementAccessCount(uniqueId);
        if (!updateResult) {
          throw new Error('Failed to update access count');
        }
        // 从更新结果中提取文档
        const updatedRecord = extractDocumentFromResult(updateResult);

        if (!updatedRecord) {
          throw new Error('No document found in update result');
        }

        console.log('Updated document:', updatedRecord);
        console.log('updatedDocument.firstAccessTime', updatedRecord.firstAccessTime);
        return res.status(200).json({
          success: true,
          message: '访问成功',
          data: {
            uniqueId,
            status: 'active',
            accessCount: updatedRecord.accessCount,
            firstAccessTime: new Date(updatedRecord.firstAccessTime).toISOString(),
            updateTime: new Date(updatedRecord.updateTime).toISOString(),
            isWithin24Hours: true,
          },
        });
      } else {
        // 超过24小时，更新状态为失效
        const updatedRestul = await AccessRecord.update(uniqueId, { status: 'expired' });
        // 从更新结果中提取文档
        const updatedRecord = extractDocumentFromResult(updatedRestul);

        return res.status(403).json({
          success: false,
          message: '访问已失效（超过24小时）',
          data: {
            uniqueId,
            status: 'expired',
            accessCount: updatedRecord.accessCount,
            firstAccessTime: new Date(updatedRecord.firstAccessTime).toISOString(),
            updateTime: new Date(updatedRecord.updateTime).toISOString(),
            isWithin24Hours: false,
          },
        });
      }
    } else {
      return res.status(404).json({
        success: false,
        code: 11283,
        message: '无效链接',
        data: {},
      });
    }
  } catch (error) {
    console.error('Access route error:', error);
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

module.exports = router;
