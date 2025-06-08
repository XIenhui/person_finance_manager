// utils/common.js

import db from '#utils/db.js';
import dayjs from 'dayjs';

/**
 * 生成交易编号
 * 格式: T + 年月日(YYYYMMDD) + 4位序列号(每日从0001开始)
 * 例如: T202306150001
 *
 * @returns {Promise<string>} 生成的交易编号
 */
export async function generateTransactionNo(seq = 1) {
    try {
        // 获取当前日期部分(YYYYMMDD)
        const datePart = dayjs().format('YYYYMMDDHHmmss');

        // 查询当日已有最大交易编号
        const query = `
            SELECT transaction_no 
            FROM transactions 
            WHERE transaction_no ILIKE $1
            ORDER BY transaction_no DESC 
            LIMIT 1
        `;
        const result = await db.query(query, [datePart]);
        let sequence = seq;
        if (result.rows.length > 0) {
            // 提取已有编号的序列部分并加1
            const lastNo = result.rows[0].transaction_no;
            const lastSequence = parseInt(lastNo.slice(-4), 10);
            sequence = lastSequence + 1;
        }

        // 格式化为4位数字，不足前面补0
        const sequencePart = sequence.toString().padStart(4, '0');
        return `${datePart}${sequencePart}`;
    } catch (err) {
        console.error('生成交易编号失败:', err);
        // 作为后备方案，使用时间戳生成编号
        const timestamp = dayjs().valueOf();
        return `${timestamp}`;
    }
}