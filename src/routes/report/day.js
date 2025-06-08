import express from 'express';
import db from '#utils/db.js';
import { success, error } from '#utils/response.js';

const router = express.Router();

/**
 * @api {get} /reports/daily 获取每日交易报表
 * @apiName GetDailyTransactionReport
 * @apiGroup Report
 *
 * @apiParam {String} date 查询日期(YYYY-MM-DD)
 */
router.get('/list', async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json(error('请指定查询日期'));
        }

        // 验证日期格式
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json(error('日期格式不正确，请使用YYYY-MM-DD格式'));
        }

        const query = `
            SELECT * FROM daily_transaction_report
            WHERE report_date = $1
        `;

        const result = await db.query(query, [date]);

        if (result.rows.length === 0) {
            return res.json(success({
                report_date: date,
                total_income: 0,
                total_expense: 0,
                income_details: [],
                expense_details: []
            }));
        }

        const report = result.rows[0];

        // 格式化响应数据
        const response = {
            report_date: report.report_date,
            total_income: parseFloat(report.total_income),
            total_expense: parseFloat(report.total_expense),
            net_income: parseFloat(report.total_income) - parseFloat(report.total_expense),
            income_details: report.income_details || [],
            expense_details: report.expense_details || []
        };

        res.json(success(response));
    } catch (err) {
        console.error('获取每日报表失败:', err);
        res.status(500).json(error('获取每日报表失败', err.message));
    }
});

export default router;