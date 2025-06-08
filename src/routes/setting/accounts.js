import express from 'express';
import db from '#utils/db.js';
import { success, error } from '#utils/response.js';

const router = express.Router();

/**
 * @api {get} /accounts 获取账户列表
 * @apiName GetAccounts
 * @apiGroup Account
 *
 * @apiParam {Number} [page=1] 页码
 * @apiParam {Number} [size=10] 每页数量
 * @apiParam {String} [keyword] 搜索关键词
 * @apiParam {String} [type_id] 账户类型ID
 * @apiParam {String} [sortField] 排序字段
 * @apiParam {String} [sortOrder] 排序方式(asc/desc)
 */
router.get('/list', async (req, res) => {
    try {
        const { page = 1, size = 10, keyword, is_active,  type_id, sortField, sortOrder } = req.query;
        const offset = (page - 1) * size;

        let query = `
            SELECT 
                fa.id, fa.account_name, fa.account_number, fa.balance, 
                fa.currency, fa.institution, fa.is_active, fa.opening_date,
                fa.closing_date, fa.credit_limit, fa.sort_order, fa.description,
                fa.created_at, fa.updated_at,
                at.id as type_id, at.name as type_name, at.icon as type_icon, at.color as type_color,
                at.is_digital as is_digital, at.can_overdraft as can_overdraft
            FROM financial_accounts fa
            JOIN account_types at ON fa.type_id = at.id
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        if (keyword) {
            query += ` AND (fa.account_name ILIKE $${paramIndex} OR fa.account_number ILIKE $${paramIndex})`;
            params.push(`%${keyword}%`);
            paramIndex++;
        }

        if (type_id) {
            query += ` AND fa.type_id = $${paramIndex}`;
            params.push(type_id);
            paramIndex++;
        }
        if (is_active !== '') {
            query += ` AND fa.is_active = $${paramIndex}`;
            params.push(is_active === '1' || is_active === 1); // 转换为布尔值
            paramIndex++;
        }


        if (sortField && sortOrder) {
            const validFields = ['account_name', 'balance', 'opening_date', 'created_at', 'updated_at'];
            if (validFields.includes(sortField)) {
                query += ` ORDER BY fa.${sortField} ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
            }
        } else {
            query += ` ORDER BY fa.sort_order ASC, fa.created_at DESC`;
        }


        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(size, offset);

        // 获取分页数据
        const result = await db.query(query, params);
        // 获取总数
        let countQuery = `
            SELECT COUNT(*) 
            FROM financial_accounts fa
            WHERE 1=1
        `;

        const countParams = [];
        paramIndex = 1;

        if (keyword) {
            countQuery += ` AND (fa.account_name ILIKE $${paramIndex} OR fa.account_number ILIKE $${paramIndex})`;
            countParams.push(`%${keyword}%`);
            paramIndex++;
        }

        if (type_id) {
            countQuery += ` AND fa.type_id = $${paramIndex}`;
            countParams.push(type_id);
            paramIndex++;
        }

        if (is_active !== '') {
            countQuery += ` AND fa.is_active = $${paramIndex}`;
            countParams.push(is_active === '1' || is_active === 1); // 转换为布尔值
            paramIndex++;
        }

        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        const records = result.rows.map(row => ({
            ...row,
            is_active: row.is_active ? 1 : 0
        }));
        res.json(success({
            records,
            total,
            page: parseInt(page),
            size: parseInt(size)
        }));

    } catch (err) {
        console.error('获取账户列表失败:', err);
        res.status(500).json(error('获取账户列表失败', err.message));
    }
});

/**
 * @api {get} /accounts/:id 获取账户详情
 * @apiName GetAccountDetail
 * @apiGroup Account
 *
 * @apiParam {Number} id 账户ID
 */
router.get('/detail/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(`
            SELECT 
                fa.id, fa.account_name, fa.account_number, fa.balance, 
                fa.currency, fa.institution, fa.is_active, fa.opening_date,
                fa.closing_date, fa.credit_limit, fa.sort_order, fa.description,
                fa.created_at, fa.updated_at,
                at.id as type_id, at.name as type_name, at.icon as type_icon
            FROM financial_accounts fa
            JOIN account_types at ON fa.type_id = at.id
            WHERE fa.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json(error('账户不存在'));
        }

        res.json(success(result.rows[0]));

    } catch (err) {
        console.error('获取账户详情失败:', err);
        res.status(500).json(error('获取账户详情失败', err.message));
    }
});

/**
 * @api {post} /accounts 创建账户
 * @apiName CreateAccount
 * @apiGroup Account
 *
 * @apiParam {String} account_name 账户名称
 * @apiParam {Number} type_id 账户类型ID
 * @apiParam {String} [account_number] 账号/卡号
 * @apiParam {String} [currency=CNY] 货币类型
 * @apiParam {String} [institution] 所属机构
 * @apiParam {Number} [balance=0] 初始余额
 * @apiParam {Boolean} [is_active=true] 是否激活
 * @apiParam {Date} [opening_date] 开户日期
 * @apiParam {Number} [credit_limit] 信用额度(信用卡专用)
 * @apiParam {Number} [sort_order=0] 排序权重
 * @apiParam {String} [description] 描述
 */
router.post('/add', async (req, res) => {
    try {
        const {
            account_name,
            type_id,
            account_number,
            currency = 'CNY',
            institution,
            balance = 0,
            is_active = true,
            opening_date,
            credit_limit,
            sort_order = 0,
            description
        } = req.body;

        // 验证必填字段
        if (!account_name || !type_id) {
            return res.status(400).json(error('账户名称和类型不能为空'));
        }

        // 检查账户类型是否存在
        const typeCheck = await db.query('SELECT 1 FROM account_types WHERE id = $1', [type_id]);
        if (typeCheck.rows.length === 0) {
            return res.status(400).json(error('账户类型不存在'));
        }

        // 检查账号是否已存在
        if (account_number) {
            const accountCheck = await db.query(
                'SELECT 1 FROM financial_accounts WHERE account_number = $1',
                [account_number]
            );
            if (accountCheck.rows.length > 0) {
                return res.status(400).json(error('账号/卡号已存在'));
            }
        }

        const result = await db.query(`
            INSERT INTO financial_accounts (
                account_name, type_id, account_number, currency, 
                institution, balance, is_active, opening_date,
                credit_limit, sort_order, description
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [
            account_name,
            type_id,
            account_number || null,
            currency,
            institution || null,
            balance,
            is_active,
            opening_date || null,
            credit_limit || null,
            sort_order,
            description || null
        ]);

        res.status(201).json(success(result.rows[0], '账户创建成功'));

    } catch (err) {
        console.error('创建账户失败:', err);
        res.status(500).json(error('创建账户失败', err.message));
    }
});

/**
 * @api {put} /accounts/:id 更新账户
 * @apiName UpdateAccount
 * @apiGroup Account
 *
 * @apiParam {Number} id 账户ID
 * @apiParam {String} [account_name] 账户名称
 * @apiParam {Number} [type_id] 账户类型ID
 * @apiParam {String} [account_number] 账号/卡号
 * @apiParam {String} [currency] 货币类型
 * @apiParam {String} [institution] 所属机构
 * @apiParam {Number} [balance] 余额
 * @apiParam {Boolean} [is_active] 是否激活
 * @apiParam {Date} [opening_date] 开户日期
 * @apiParam {Date} [closing_date] 关闭日期
 * @apiParam {Number} [credit_limit] 信用额度
 * @apiParam {Number} [sort_order] 排序权重
 * @apiParam {String} [description] 描述
 */
router.put('/edit/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            account_name,
            type_id,
            account_number,
            currency,
            institution,
            balance,
            is_active,
            opening_date,
            closing_date,
            credit_limit,
            sort_order,
            description
        } = req.body;

        // 检查账户是否存在
        const accountCheck = await db.query('SELECT 1 FROM financial_accounts WHERE id = $1', [id]);
        if (accountCheck.rows.length === 0) {
            return res.status(404).json(error('账户不存在'));
        }

        // 检查账户类型是否存在
        if (type_id) {
            const typeCheck = await db.query('SELECT 1 FROM account_types WHERE id = $1', [type_id]);
            if (typeCheck.rows.length === 0) {
                return res.status(400).json(error('账户类型不存在'));
            }
        }

        // 检查账号是否已存在(排除自己)
        if (account_number) {
            const accountCheck = await db.query(
                'SELECT 1 FROM financial_accounts WHERE account_number = $1 AND id != $2',
                [account_number, id]
            );
            if (accountCheck.rows.length > 0) {
                return res.status(400).json(error('账号/卡号已存在'));
            }
        }

        const result = await db.query(`
            UPDATE financial_accounts
            SET 
                account_name = COALESCE($1, account_name),
                type_id = COALESCE($2, type_id),
                account_number = COALESCE($3, account_number),
                currency = COALESCE($4, currency),
                institution = COALESCE($5, institution),
                balance = COALESCE($6, balance),
                is_active = COALESCE($7, is_active),
                opening_date = COALESCE($8, opening_date),
                closing_date = COALESCE($9, closing_date),
                credit_limit = COALESCE($10, credit_limit),
                sort_order = COALESCE($11, sort_order),
                description = COALESCE($12, description),
                updated_at = NOW()
            WHERE id = $13
            RETURNING *
        `, [
            account_name || null,
            type_id || null,
            account_number || null,
            currency || null,
            institution || null,
            balance !== undefined ? balance : null,
            is_active !== undefined ? is_active : null,
            opening_date || null,
            closing_date || null,
            credit_limit || null,
            sort_order || null,
            description || null,
            id
        ]);

        res.json(success(result.rows[0], '账户更新成功'));

    } catch (err) {
        console.error('更新账户失败:', err);
        res.status(500).json(error('更新账户失败', err.message));
    }
});

/**
 * @api {delete} /accounts/:id 删除账户
 * @apiName DeleteAccount
 * @apiGroup Account
 *
 * @apiParam {Number} id 账户ID
 */
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 检查账户是否存在
        const accountCheck = await db.query('SELECT 1 FROM financial_accounts WHERE id = $1', [id]);
        if (accountCheck.rows.length === 0) {
            return res.status(404).json(error('账户不存在'));
        }

        // 检查是否有交易记录
        const transactionCheck = await db.query(
            'SELECT 1 FROM transactions WHERE account_id = $1 LIMIT 1',
            [id]
        );
        if (transactionCheck.rows.length > 0) {
            return res.status(400).json(error('无法删除，该账户存在交易记录'));
        }

        const result = await db.query(
            'DELETE FROM financial_accounts WHERE id = $1 RETURNING id, account_name',
            [id]
        );

        res.json(success(result.rows[0], '账户删除成功'));

    } catch (err) {
        console.error('删除账户失败:', err);
        res.status(500).json(error('删除账户失败', err.message));
    }
});

export default router;