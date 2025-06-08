import express from 'express';
import db from '#utils/db.js';
import { success, error } from '#utils/response.js';
import dayjs from 'dayjs';

const router = express.Router();

/**
 * @api {get} /dashboard/summary 获取首页汇总数据
 * @apiName GetDashboardSummary
 * @apiGroup Dashboard
 */
router.get('/summary', async (req, res) => {
    try {
        const currentDate = dayjs();
        const startOfMonth = currentDate.startOf('month').format('YYYY-MM-DD');
        const endOfMonth = currentDate.endOf('month').format('YYYY-MM-DD');
        const startOfLastMonth = currentDate.subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
        const endOfLastMonth = currentDate.subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

        // 获取本月支出
        const monthExpenseQuery = `
            SELECT COALESCE(SUM(ABS(amount)), 0) AS amount
            FROM transactions t
            LEFT JOIN transaction_categories c ON t.category_id = c.id
            WHERE 
                transaction_type = 'expense' AND
                status = 'completed' AND
                c.code <> '09980001' AND
                transaction_date BETWEEN $1 AND $2
        `;
        const monthExpenseResult = await db.query(monthExpenseQuery, [startOfMonth, endOfMonth]);
        const monthExpense = parseFloat(monthExpenseResult.rows[0].amount);

        // 获取上月支出
        const lastMonthExpenseQuery = `
            SELECT COALESCE(SUM(ABS(amount)), 0) AS amount
            FROM transactions t
            LEFT JOIN transaction_categories c ON t.category_id = c.id
            WHERE 
                transaction_type = 'expense' AND
                status = 'completed' AND
                c.code <> '09980001' AND
                transaction_date BETWEEN $1 AND $2
        `;
        const lastMonthExpenseResult = await db.query(lastMonthExpenseQuery, [startOfLastMonth, endOfLastMonth]);
        const lastMonthExpense = parseFloat(lastMonthExpenseResult.rows[0].amount);

        // 计算支出增长率
        const expenseGrowthRate = lastMonthExpense > 0
            ? ((monthExpense - lastMonthExpense) / lastMonthExpense * 100).toFixed(1)
            : 0;

        // 获取本月收入
        const monthIncomeQuery = `
            SELECT COALESCE(SUM(amount), 0) AS amount
            FROM transactions t
            LEFT JOIN transaction_categories c ON t.category_id = c.id
            WHERE 
                transaction_type = 'income' AND
                status = 'completed' AND
                c.code <> '09990001' AND
                transaction_date BETWEEN $1 AND $2
        `;
        const monthIncomeResult = await db.query(monthIncomeQuery, [startOfMonth, endOfMonth]);
        const monthIncome = parseFloat(monthIncomeResult.rows[0].amount);

        // 获取上月收入
        const lastMonthIncomeQuery = `
            SELECT COALESCE(SUM(amount), 0) AS amount
            FROM transactions t
            LEFT JOIN transaction_categories c ON t.category_id = c.id
            WHERE 
                transaction_type = 'income' AND
                status = 'completed' AND
                c.code <> '09990001' AND
                transaction_date BETWEEN $1 AND $2
        `;
        const lastMonthIncomeResult = await db.query(lastMonthIncomeQuery, [startOfLastMonth, endOfLastMonth]);
        const lastMonthIncome = parseFloat(lastMonthIncomeResult.rows[0].amount);

        // 计算收入增长率
        const incomeGrowthRate = lastMonthIncome > 0
            ? ((monthIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(1)
            : 0;

        // 获取可用余额
        const totalRestQuery = `
            SELECT COALESCE(SUM(balance), 0) AS amount
            FROM financial_accounts f
            LEFT JOIN account_types t ON t.id = f.type_id
            WHERE is_active = true AND
            t.can_overdraft = false
        `;
        const totalRestResult = await db.query(totalRestQuery);
        const totalRest = parseFloat(totalRestResult.rows[0].amount);

        // 获取总资产
        const totalAssetsQuery = `
            SELECT COALESCE(SUM(balance), 0) AS amount
            FROM financial_accounts
            WHERE is_active = true
        `;
        const totalAssetsResult = await db.query(totalAssetsQuery);
        const totalAssets = parseFloat(totalAssetsResult.rows[0].amount);

        // 获取上月总资产（简化处理，实际可能需要更复杂的计算）
        const lastMonthAssets = totalAssets - monthIncome + monthExpense;
        const assetsGrowthRate = lastMonthAssets > 0
            ? ((totalAssets - lastMonthAssets) / lastMonthAssets * 100).toFixed(1)
            : 0;

        res.json(success({
            month_expense: {
                amount: monthExpense,
                growth_rate: parseFloat(expenseGrowthRate),
                compared_last_month: monthExpense > lastMonthExpense ? 'increase' :
                    monthExpense < lastMonthExpense ? 'decrease' : 'equal'
            },
            month_income: {
                amount: monthIncome,
                growth_rate: parseFloat(incomeGrowthRate),
                compared_last_month: monthIncome > lastMonthIncome ? 'increase' :
                    monthIncome < lastMonthIncome ? 'decrease' : 'equal'
            },
            total_assets: {
                amount: totalAssets,
                growth_rate: parseFloat(assetsGrowthRate),
                compared_last_month: totalAssets > lastMonthAssets ? 'increase' :
                    totalAssets < lastMonthAssets ? 'decrease' : 'equal'
            },
            total_rest: {
                amount: totalRest
            }
        }));
    } catch (err) {
        console.error('获取首页汇总数据失败:', err);
        res.status(500).json(error('获取首页汇总数据失败', err.message));
    }
});

export default router;