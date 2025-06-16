import express from 'express';
import db from '#utils/db.js';
import { success, error } from '#utils/response.js';
import dayjs from 'dayjs';
import {buildTree} from "#utils/treeUtil.js";

const router = express.Router();

/**
 * @api {get} /reports/enhanced 增强版交易报表
 * @apiName GetEnhancedTransactionReport
 * @apiGroup Report
 *
 * @apiParam {String} [type] 交易类型(income/expense)
 * @apiParam {Number} [categoryLevel] 账目级别
 * @apiParam {Number} [fullCode] 父账目fullCode
 * @apiParam {String} [date] 指定日期(YYYY-MM-DD)
 * @apiParam {String} [month] 指定月份(YYYY-MM)
 * @apiParam {String} [year] 指定年份(YYYY)
 * @apiParam {String} [startTime] 开始时间(YYYY-MM-DD HH:mm:ss)
 * @apiParam {String} [endTime] 结束时间(YYYY-MM-DD HH:mm:ss)
 */
router.get('/list', async (req, res) => {
    try {
        const {
            type,
            categoryLevel,
            fullCode,
            date,
            month,
            year,
            startTime,
            endTime,
            show_all
        } = req.query;

        // 验证时间参数
        const timeConditions = [];
        const queryParams = [];
        let paramIndex = 1;

        if (date) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return res.status(400).json(error('日期格式不正确，请使用YYYY-MM-DD格式'));
            }
            timeConditions.push(`report_date = $${paramIndex++}`);
            queryParams.push(date);
        } else if (month) {
            if (!/^\d{4}-\d{2}$/.test(month)) {
                return res.status(400).json(error('月份格式不正确，请使用YYYY-MM格式'));
            }
            timeConditions.push(`report_month = DATE_TRUNC('month', $${paramIndex++}::date)`);
            queryParams.push(`${month}-01`);
        } else if (year) {
            if (!/^\d{4}$/.test(year)) {
                return res.status(400).json(error('年份格式不正确，请使用YYYY格式'));
            }
            timeConditions.push(`report_year = DATE_TRUNC('year', $${paramIndex++}::date)`);
            queryParams.push(`${year}-01-01`);
        } else if (startTime || endTime) {
            if (startTime) {
                if (!dayjs(startTime, 'YYYY-MM-DD HH:mm:ss', true).isValid()) {
                    return res.status(400).json(error('开始时间格式不正确，请使用YYYY-MM-DD HH:mm:ss格式'));
                }
                timeConditions.push(`transaction_date >= $${paramIndex++}`);
                queryParams.push(startTime);
            }
            if (endTime) {
                if (!dayjs(endTime, 'YYYY-MM-DD HH:mm:ss', true).isValid()) {
                    return res.status(400).json(error('结束时间格式不正确，请使用YYYY-MM-DD HH:mm:ss格式'));
                }
                timeConditions.push(`transaction_date <= $${paramIndex++}`);
                queryParams.push(endTime);
            }
        } else {
            // 默认查询当天数据
            timeConditions.push(`report_date = $${paramIndex++}`);
            queryParams.push(dayjs().format('YYYY-MM-DD'));
        }

        // 构建查询条件
        let whereClause = timeConditions.length > 0 ? `WHERE ${timeConditions.join(' AND ')}` : '';

        if (type) {
            if (!['income', 'expense'].includes(type)) {
                return res.status(400).json(error('交易类型参数不正确，应为income或expense'));
            }
            whereClause += whereClause ? ' AND' : ' WHERE';
            whereClause += ` transaction_type = $${paramIndex++}`;
            queryParams.push(type);
        }

        if (categoryLevel) {
            const level = parseInt(categoryLevel, 10);
            if (isNaN(level)) {
                return res.status(400).json(error('账目级别必须为数字'));
            }
            whereClause += whereClause ? ' AND' : ' WHERE';
            whereClause += ` category_level = $${paramIndex++}`;
            queryParams.push(level);
        }

        if (fullCode) {
            whereClause += whereClause ? ' AND' : ' WHERE';
            whereClause += ` 
            (category_full_code = $${paramIndex} OR 
            category_full_code LIKE $${paramIndex} || '.%')`;
            queryParams.push(fullCode);
            paramIndex++
        }

        if (show_all !== '1' && show_all !== 1) {
            whereClause += whereClause ? ' AND' : ' WHERE';
            whereClause += ` category_in_statistics = true`;
        }
        // 构建查询SQL
        const query = `
            SELECT
                -- 时间维度
                CASE
                    WHEN $${paramIndex++}::text IS NOT NULL THEN MIN(report_date)::text
                    WHEN $${paramIndex++}::text IS NOT NULL THEN TO_CHAR(MIN(report_month), 'YYYY-MM')
                    WHEN $${paramIndex++}::text IS NOT NULL THEN TO_CHAR(MIN(report_year), 'YYYY')
                    ELSE TO_CHAR(MIN(transaction_date), 'YYYY-MM-DD HH24:MI:SS') || ' ~ ' ||
                         TO_CHAR(MAX(transaction_date), 'YYYY-MM-DD HH24:MI:SS')
                END AS time_period,
                
                -- 交易类型
                transaction_type,
                
                -- 账目信息
                category_id,
                category_name,
                category_level,
                category_parent_id,
                category_code,
                category_full_code,
                category_in_statistics,
                -- 金额汇总
                
                SUM(amount) AS total_amount,
                COUNT(*) AS transaction_count
            FROM
                enhanced_transaction_report
            ${whereClause}
            GROUP BY
                GROUPING SETS (
                    (),
                    (transaction_type),
                    (category_id, category_name, category_level, category_parent_id, category_code, category_full_code, category_in_statistics, transaction_type)
                )
            HAVING
                GROUPING(transaction_type) = 0 OR
                (GROUPING(category_id) = 0 AND GROUPING(transaction_type) = 0)
            ORDER BY
                transaction_type,
                total_amount DESC
        `;

        // 添加分组参数
        queryParams.push(date || null);
        queryParams.push(month || null);
        queryParams.push(year || null);

        // 执行查询
        const result = await db.query(query, queryParams);

        const tree = buildTree(result.rows, 'category_id','category_parent_id');
        // 处理查询结果
        const reportData = {
            summary: {
                total_income: 0,
                total_expense: 0,
                net_income: 0,
                transaction_count: 0
            },
            time_period: '',
            details: {
                income: [],
                expense: []
            },
            tree
        };
        result.rows.forEach(row => {
            // 设置时间范围
            if (!reportData.time_period) {
                reportData.time_period = row.time_period;
            }

            // 汇总数据
            if (!row.category_id) {
                // 总览数据
                if (row.transaction_type === 'income') {
                    reportData.summary.total_income = parseFloat(row.total_amount);
                } else if (row.transaction_type === 'expense') {
                    reportData.summary.total_expense = Math.abs(parseFloat(row.total_amount));
                }
                reportData.summary.transaction_count += parseInt(row.transaction_count, 10);
            } else {
                // 明细数据
                const item = {
                    category_id: row.category_id,
                    category_name: row.category_name,
                    category_level: row.category_level,
                    full_code: row.category_full_code,
                    amount: parseFloat(row.total_amount),
                    transaction_count: parseInt(row.transaction_count, 10),
                    in_statistics: row.category_in_statistics
                };

                if (row.transaction_type === 'income') {
                    reportData.details.income.push(item);
                } else if (row.transaction_type === 'expense') {
                    item.amount = Math.abs(item.amount); // 支出金额转为正数
                    reportData.details.expense.unshift(item);
                }
            }
        });

        // 计算净收入
        reportData.summary.net_income = reportData.summary.total_income - reportData.summary.total_expense;
        res.json(success(reportData));
    } catch (err) {
        console.error('获取增强版报表失败:', err);
        res.status(500).json(error('获取增强版报表失败', err.message));
    }
});

export default router;