import express from 'express';
import db from '#utils/db.js';
import { success, error } from '#utils/response.js';
import { buildTree } from '#utils/treeUtil.js';

const router = express.Router();

/**
 * @api {get} /categories 获取分类树形结构
 * @apiName GetCategoryTree
 * @apiGroup Category
 *
 * @apiParam {String} [type] 分类类型(income/expense)
 * @apiParam {Boolean} [active] 是否只返回激活的分类
 */
router.get('/list', async (req, res) => {
    try {
        const { type, is_active, in_statistics } = req.query;

        let query = 'SELECT * FROM transaction_categories WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (type) {
            query += ` AND type = $${paramIndex++}`;
            params.push(type);
        }

        if (is_active === '1') {
            query += ` AND is_active = true`;
        }

        // 👉 按 type 和 full_code 排序
        query += ' ORDER BY type DESC, full_code';

        const result = await db.query(query, params);
        const records = result.rows.map(row => ({
            ...row,
            is_active: row.is_active ? 1 : 0,
            in_statistics: row.in_statistics ? 1 : 0
        }));

        const tree = buildTree(records);
        res.json(success(tree));
    } catch (err) {
        console.error('获取分类树失败:', err);
        res.status(500).json(error('获取分类树失败', err.message));
    }
});


/**
 * @api {get} /categories/flat 获取扁平化分类列表
 * @apiName GetCategoriesFlat
 * @apiGroup Category
 *
 * @apiParam {String} [type] 分类类型(income/expense)
 * @apiParam {Boolean} [active] 是否只返回激活的分类
 */
router.get('/flat', async (req, res) => {
    try {
        const { type, active } = req.query;

        let query = 'SELECT * FROM transaction_categories WHERE 1=1';
        const params = [];

        if (type) {
            query += ' AND type = $1';
            params.push(type);
        }

        if (active === 'true') {
            query += ' AND is_active = true';
        }

        query += ' ORDER BY full_code';

        const result = await db.query(query, params);

        res.json(success(result.rows));
    } catch (err) {
        console.error('获取分类列表失败:', err);
        res.status(500).json(error('获取分类列表失败', err.message));
    }
});

/**
 * @api {get} /categories/:id 获取分类详情
 * @apiName GetCategoryDetail
 * @apiGroup Category
 *
 * @apiParam {Number} id 分类ID
 */
router.get('/detail/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'SELECT * FROM transaction_categories WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json(error('分类不存在'));
        }

        res.json(success(result.rows[0]));
    } catch (err) {
        console.error('获取分类详情失败:', err);
        res.status(500).json(error('获取分类详情失败', err.message));
    }
});

/**
 * @api {post} /categories 创建分类
 * @apiName CreateCategory
 * @apiGroup Category
 *
 * @apiParam {String} name 分类名称
 * @apiParam {String} type 分类类型(income/expense)
 * @apiParam {Number} [parent_id] 父分类ID
 * @apiParam {String} [icon] 图标
 * @apiParam {String} [description] 描述
 */
router.post('/add', async (req, res) => {
    try {
        const { name, type, parent_id, icon, description, is_active, in_statistics } = req.body;

        if (!name || !type || !['income', 'expense'].includes(type)) {
            return res.status(400).json(error('参数不合法'));
        }

        // 验证父分类是否存在
        let parent = null;
        if (parent_id) {
            const parentResult = await db.query(
                'SELECT * FROM transaction_categories WHERE id = $1',
                [parent_id]
            );

            if (parentResult.rows.length === 0) {
                return res.status(400).json(error('父分类不存在'));
            }

            parent = parentResult.rows[0];

            // 验证类型一致性
            if (parent.type !== type) {
                return res.status(400).json(error('子分类必须与父分类类型一致'));
            }

            const hasSameName = await db.query(
                'SELECT * FROM transaction_categories WHERE parent_id = $1 AND name = $2',
                [parent_id, name]
            );

            if (hasSameName.rows.length !== 0) {
                return res.status(400).json(error('同级存在相同名称'));
            }
        } else {
            const hasSameName = await db.query(
                'SELECT * FROM transaction_categories WHERE parent_id IS NULL AND name = $1',
                [name]
            );

            if (hasSameName.rows.length !== 0) {
                return res.status(400).json(error('根级存在相同名称'));
            }
        }

        // 生成分类编码
        let code, full_code, level;
        if (parent_id && parent !== null) {
            // 查询同级最大code
            const maxCodeResult = await db.query(
                `SELECT MAX(code) FROM transaction_categories 
                WHERE parent_id = $1`,
                [parent_id]
            );
            const maxCode = maxCodeResult.rows[0].max || '';
            const lastNum = parseInt(maxCode.slice(-3)) || 0;
            code = `${parent.code}${String(lastNum + 1).padStart(4, '0')}`;
            full_code = `${parent.full_code}.${code}`;
            level = parent.level + 1;
        } else {
            // 一级分类
            const maxCodeResult = await db.query(
                `SELECT MAX(code) FROM transaction_categories 
                 WHERE parent_id IS NULL
                 AND code ~ '^\\d+$'
                 AND CAST(code AS INTEGER) < 990`  // 排除 0990-0999
            )

            const maxCode = maxCodeResult.rows[0].max || '';
            const lastNum = parseInt(maxCode) || 0;
            code = String(lastNum + 1).padStart(4, '0');
            full_code = code;
            level = 1;
        }

        // 创建分类
        const result = await db.query(
            `INSERT INTO transaction_categories 
             (name, type, parent_id, code, full_code, level, icon, description, is_active, in_statistics)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [name, type, parent_id || null, code, full_code, level, icon || null, description || null,
                is_active !== undefined ? is_active : true,
                in_statistics !== undefined ? in_statistics : true,
            ]
        );

        res.status(201).json(success(result.rows[0], '分类创建成功'));
    } catch (err) {
        if (err.code === '23505') { // 唯一约束冲突
            return res.status(400).json(error('分类编码已存在'));
        }
        console.error('创建分类失败:', err);
        res.status(500).json(error('创建分类失败', err.message));
    }
});

/**
 * @api {put} /categories/:id 更新分类
 * @apiName UpdateCategory
 * @apiGroup Category
 *
 * @apiParam {Number} id 分类ID
 * @apiParam {String} [name] 分类名称
 * @apiParam {String} [icon] 图标
 * @apiParam {Boolean} [is_active] 是否激活
 * @apiParam {String} [description] 描述
 */
router.put('/edit/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, icon, is_active, description, in_statistics } = req.body;

        // 检查分类是否存在
        const checkResult = await db.query(
            'SELECT * FROM transaction_categories WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json(error('分类不存在'));
        }

        // 更新分类
        const result = await db.query(
            `UPDATE transaction_categories 
             SET 
               name = COALESCE($1, name),
               icon = COALESCE($2, icon),
               is_active = COALESCE($3, is_active),
               description = COALESCE($4, description),
               in_statistics = COALESCE($5, in_statistics),
               updated_at = NOW()
             WHERE id = $6
             RETURNING *`,
            [
                name || null,
                icon || null,
                is_active !== undefined ? is_active : null,
                description || null,
                in_statistics !== undefined ? in_statistics : null,
                id
            ]
        );

        res.json(success(result.rows[0], '分类更新成功'));
    } catch (err) {
        console.error('更新分类失败:', err);
        res.status(500).json(error('更新分类失败', err.message));
    }
});

/**
 * @api {delete} /categories/:id 删除分类
 * @apiName DeleteCategory
 * @apiGroup Category
 *
 * @apiParam {Number} id 分类ID
 */
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 检查分类是否存在
        const checkResult = await db.query(
            'SELECT * FROM transaction_categories WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json(error('分类不存在'));
        }

        // 检查是否有子分类
        const childCheck = await db.query(
            'SELECT 1 FROM transaction_categories WHERE parent_id = $1 LIMIT 1',
            [id]
        );

        if (childCheck.rows.length > 0) {
            return res.status(400).json(error('请先删除所有子分类'));
        }

        // 检查是否有交易记录使用此分类
        const transactionCheck = await db.query(
            'SELECT 1 FROM transactions WHERE category_id = $1 LIMIT 1',
            [id]
        );

        if (transactionCheck.rows.length > 0) {
            return res.status(400).json(error('无法删除，已有交易使用此分类'));
        }

        // 删除分类
        const result = await db.query(
            'DELETE FROM transaction_categories WHERE id = $1 RETURNING *',
            [id]
        );

        res.json(success(result.rows[0], '分类删除成功'));
    } catch (err) {
        console.error('删除分类失败:', err);
        res.status(500).json(error('删除分类失败', err.message));
    }
});

export default router;