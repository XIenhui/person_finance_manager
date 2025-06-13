import express from 'express';
import db from '#utils/db.js';
import { success, error } from '#utils/response.js';
import dayjs from "dayjs";

const router = express.Router();

/**
 * @api {get} /reports/account 获取账号相关趋势报表
 * @apiName GetAccountTrendReport
 * @apiGroup Report
 *
 * @apiParam {String} period 查询时间区间(day/week/month/year)
 */
router.get('/trend', async (req, res) => {
    try {
        const { accountId, period = 'day' } = req.query;

        // 设置日期范围
        const endDate = dayjs().endOf('day');
        let startDate;
        let intervalStep, outputFormat;

        switch (period) {
            case 'hour':
                startDate = endDate.subtract(120, 'hour');
                intervalStep = '1 hour';
                outputFormat = 'YYYY-MM-DD HH24:00';
                break;
            case 'hours':
                startDate = endDate.subtract(300, 'hour');
                intervalStep = '6 hours';
                outputFormat = 'YYYY-MM-DD HH24:00';
                break;
            case 'day':
                startDate = endDate.subtract(30, 'day');
                intervalStep = '1 day';
                outputFormat = 'YYYY-MM-DD';
                break;
            case 'week':
                startDate = endDate.subtract(30, 'week');
                intervalStep = '1 week';
                outputFormat = 'YYYY-MM-DD';
                break;
            case 'month':
                startDate = endDate.subtract(30, 'month');
                intervalStep = '1 month';
                outputFormat = 'YYYY-MM';
                break;
            case 'year':
                startDate = endDate.subtract(10, 'year');
                intervalStep = '1 year';
                outputFormat = 'YYYY';
                break;
            default:
                startDate = endDate.subtract(30, 'day');
                intervalStep = '1 day';
                outputFormat = 'YYYY-MM-DD';
        }

        // 构建查询SQL
        const dateGroupExpr =
            period !== 'hours' ?
                `TO_CHAR(DATE_TRUNC('${intervalStep.split(' ')[1]}', transaction_date), '${outputFormat}')` :
                `TO_CHAR(DATE_TRUNC('hour', transaction_date) -
                    INTERVAL '1 hour' * (EXTRACT(HOUR FROM transaction_date)::int % 6),
                'YYYY-MM-DD HH24:00'
            )`;

        const trendQuery = `
            WITH time_series AS (
                SELECT generate_series(
                    $1::timestamp,
                    $2::timestamp,
                    INTERVAL '${intervalStep}'
                ) AS date_point
            ),
            transactions_with_cat AS (
                SELECT 
                    t.*, 
                    c.in_statistics 
                FROM transactions t
                LEFT JOIN transaction_categories c ON t.category_id = c.id
                WHERE ${accountId ? 't.account_id = $3 AND' : ''} t.transaction_date <= $2
            ),
            income_expense_grouped AS (
                SELECT
                    ${dateGroupExpr} AS date_group,
                    SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) AS income,
                    SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) AS expense
                FROM transactions_with_cat t
                WHERE ${ accountId ? '' : 't.in_statistics = true AND'}
                t.transaction_date BETWEEN $1 AND $2
                GROUP BY date_group
            ),
            latest_balance_per_time AS (
              SELECT
                ts.date_point,
                COALESCE((
                  ${
                    accountId
                      ? `SELECT t.balance_after
                           FROM transactions_with_cat t
                           WHERE t.transaction_date <= ts.date_point
                           ORDER BY t.transaction_date DESC, t.id DESC
                           LIMIT 1`
                      : `SELECT SUM(sub.balance_after) FROM (
                            SELECT DISTINCT ON (t.account_id)
                                t.account_id, t.balance_after
                            FROM transactions_with_cat t
                            WHERE t.transaction_date <= ts.date_point
                            ORDER BY t.account_id, t.transaction_date DESC, t.id DESC
                        ) sub`
                  }
                ), 0) AS balance
              FROM time_series ts
            ),
            merged_data AS (
                SELECT 
                    TO_CHAR(ts.date_point, '${outputFormat}') AS date,
                    COALESCE(lb.balance, 0) AS balance,
                    COALESCE(ie.income, 0) AS income,
                    COALESCE(ie.expense, 0) AS expense
                FROM time_series ts
                LEFT JOIN latest_balance_per_time lb ON lb.date_point = ts.date_point
                LEFT JOIN income_expense_grouped ie ON ie.date_group = TO_CHAR(ts.date_point, '${outputFormat}')
            )
            SELECT * FROM merged_data ORDER BY date;
        `;

        const params = accountId
            ? [startDate.toISOString(), endDate.toISOString(), accountId]
            : [startDate.toISOString(), endDate.toISOString()];

        const trendResult = await db.query(trendQuery, params);

        // 查询当前余额和汇总数据
        let balanceQuery, summaryQuery;

        if (accountId) {
            balanceQuery = 'SELECT balance FROM financial_accounts WHERE id = $1';
            summaryQuery = `
                SELECT 
                  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) AS total_income,
                  SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) AS total_expense
                FROM transactions t
                LEFT JOIN transaction_categories c ON t.category_id = c.id
                WHERE c.in_statistics = true AND t.account_id = $1
            `;
        } else {
            balanceQuery = 'SELECT SUM(balance) AS balance FROM financial_accounts WHERE is_active = true';
            summaryQuery = `
                SELECT 
                  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) AS total_income,
                  SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) AS total_expense
                FROM transactions t
                LEFT JOIN transaction_categories c ON t.category_id = c.id
                WHERE c.in_statistics = true
            `;
        }

        const [balanceResult, summaryResult] = await Promise.all([
            db.query(balanceQuery, accountId ? [accountId] : []),
            db.query(summaryQuery, accountId ? [accountId] : [])
        ]);

        const totalPendingIncomeQuery = `
            SELECT COALESCE(SUM(amount), 0) AS amount
            FROM transactions t
            WHERE t.status = 'pending' AND t.amount > 0
        `;
        const totalPendingIncomeResult = await db.query(totalPendingIncomeQuery);
        const totalPendingIncome = parseFloat(totalPendingIncomeResult.rows[0].amount);

        const totalPendingExpenseQuery = `
            SELECT COALESCE(SUM(amount), 0) AS amount
            FROM transactions t
            WHERE t.status = 'pending' AND t.amount < 0
        `;
        const totalPendingExpenseResult = await db.query(totalPendingExpenseQuery);
        const totalPendingExpense = parseFloat(totalPendingExpenseResult.rows[0].amount);

        res.json(success({
            trendData: trendResult.rows,
            currentBalance: parseFloat(balanceResult.rows[0]?.balance || 0) - totalPendingIncome - totalPendingExpense,
            totalIncome: parseFloat(summaryResult.rows[0]?.total_income || 0) - totalPendingIncome,
            totalExpense: parseFloat(summaryResult.rows[0]?.total_expense || 0) + totalPendingExpense
        }));
    } catch (err) {
        console.error('获取余额趋势失败:', err);
        res.status(500).json(error('获取余额趋势失败', err.message));
    }
});

export default router;
