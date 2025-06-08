import express from 'express';
import db from '#utils/db.js';
import { success, error } from '#utils/response.js';

const router = express.Router();

/**
 * @api {get} /account-types/list 获取所有账户类型
 * @apiName GetAccountTypes
 * @apiGroup AccountType
 */
router.get('/list', async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const size = parseInt(req.query.size, 10) || 10;
        const keyword = req.query.keyword?.trim() || '';

        const offset = (page - 1) * size;

        const params = [];
        let whereClause = '';
        if (keyword) {
            whereClause = 'WHERE name ILIKE $1';
            params.push(`%${keyword}%`);
        }

        // 获取分页数据
        const queryText = `
            SELECT id, name, icon, color, is_digital, can_overdraft, remark, 
                   created_at, updated_at
            FROM account_types
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${params.length + 1}
            OFFSET $${params.length + 2}
        `;

        params.push(size, offset);

        const { rows } = await db.query(queryText, params);

        // 获取总数
        const countQuery = `
            SELECT COUNT(*) AS total FROM account_types ${whereClause}
        `;
        const countParams = keyword ? [`%${keyword}%`] : [];
        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total, 10);

        res.json(success({
            records: rows,
            total
        }));
    } catch (err) {
        console.error('获取账户类型失败:', err);
        res.status(500).json(error('获取账户类型失败', err.message));
    }
});


/**
 * @api {post} /account-types/add 创建账户类型
 * @apiName CreateAccountType
 * @apiGroup AccountType
 *
 * @apiParam {String} name 类型名称
 * @apiParam {String} [icon] 图标
 * @apiParam {String} [color] 颜色
 * @apiParam {Boolean} [is_digital=false] 是否电子账户
 * @apiParam {Boolean} [can_overdraft=false] 是否允许透支
 * @apiParam {String} [remark] 备注
 */
router.post('/add', async (req, res) => {
    const { name, icon, color, is_digital, can_overdraft, remark } = req.body;

    if (!name) {
        return res.status(400).json(error('类型名称不能为空'));
    }

    try {
        const { rows } = await db.query(`
            INSERT INTO account_types 
                (name, icon, color, is_digital, can_overdraft, remark)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, name, icon, color, is_digital, can_overdraft, remark,
                      created_at, updated_at
        `, [
            name,
            icon || null,
            color || null,
            is_digital || false,
            can_overdraft || false,
            remark || null
        ]);

        res.status(201).json(success(rows[0], '账户类型创建成功'));
    } catch (err) {
        if (err.code === '20088') { // 唯一约束冲突
            return res.status(400).json(error('账户类型名称已存在'));
        }
        console.error('创建账户类型失败:', err);
        res.status(500).json(error('创建账户类型失败', err.message));
    }
});

/**
 * @api {put} /account-types/edit/:id 更新账户类型
 * @apiName UpdateAccountType
 * @apiGroup AccountType
 *
 * @apiParam {Number} id 账户类型ID
 * @apiParam {String} [name] 类型名称
 * @apiParam {String} [icon] 图标
 * @apiParam {String} [color] 颜色
 * @apiParam {Boolean} [is_digital] 是否电子账户
 * @apiParam {Boolean} [can_overdraft] 是否允许透支
 * @apiParam {String} [remark] 备注
 */
router.put('/edit/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { name, icon, color, is_digital, can_overdraft, remark } = req.body;

    if (!id || isNaN(id)) {
        return res.status(400).json(error('ID不合法'));
    }
    try {
        // 先检查记录是否存在
        const checkResult = await db.query(
            'SELECT 1 FROM account_types WHERE id = $1',
            [id]
        );

        if (checkResult.rowCount === 0) {
            return res.status(404).json(error('账户类型不存在'));
        }

        // 更新记录
        const { rows } = await db.query(`
            UPDATE account_types 
            SET 
                name = COALESCE($1, name),
                icon = COALESCE($2, icon),
                color = COALESCE($3, color),
                is_digital = COALESCE($4, is_digital),
                can_overdraft = COALESCE($5, can_overdraft),
                remark = COALESCE($6, remark),
                updated_at = NOW()
            WHERE id = $7
            RETURNING id, name, icon, color, is_digital, can_overdraft, remark,
                      created_at, updated_at
        `, [
            name || null,
            icon || null,
            color || null,
            is_digital !== undefined ? is_digital : null,
            can_overdraft !== undefined ? can_overdraft : null,
            remark || null,
            id
        ]);

        res.json(success(rows[0], '账户类型更新成功'));
    } catch (err) {
        if (err.code === '23505') { // 唯一约束冲突
            return res.status(400).json(error('账户类型名称已存在'));
        }
        console.error('更新账户类型失败:', err);
        res.status(500).json(error('更新账户类型失败', err.message));
    }
});

/**
 * @api {delete} /account-types/:id 删除账户类型
 * @apiName DeleteAccountType
 * @apiGroup AccountType
 *
 * @apiParam {Number} id 账户类型ID
 */
router.delete('/delete/:id', async (req, res) => {
    const id = parseInt(req.params.id);

    if (!id || isNaN(id)) {
        return res.status(400).json(error('ID不合法'));
    }

    try {
        // 检查是否有账户使用此类型
        const accountCheck = await db.query(
            'SELECT 1 FROM financial_accounts WHERE type_id = $1 LIMIT 1',
            [id]
        );

        if (accountCheck.rowCount > 0) {
            return res.status(400).json(error('无法删除，已有账户使用此类型'));
        }

        const { rows } = await db.query(`
            DELETE FROM account_types 
            WHERE id = $1
            RETURNING id, name
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json(error('账户类型不存在'));
        }

        res.json(success(rows[0], '账户类型删除成功'));
    } catch (err) {
        console.error('删除账户类型失败:', err);
        res.status(500).json(error('删除账户类型失败', err.message));
    }
});

export default router;