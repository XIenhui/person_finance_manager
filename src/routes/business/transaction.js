import express from 'express';
import db from '#utils/db.js';
import {error, success} from '#utils/response.js';
import {generateTransactionNo} from '#utils/common.js';

const router = express.Router();

/**
 * @api {get} /transactions 获取交易列表
 * @apiName GetTransactions
 * @apiGroup Transaction
 *
 * @apiParam {Number} [page=1] 页码
 * @apiParam {Number} [pageSize=10] 每页数量
 * @apiParam {Number} [accountId] 账户ID
 * @apiParam {Number} [categoryId] 分类ID
 * @apiParam {String} [type] 交易类型(income/expense/transfer)
 * @apiParam {String} [status] 交易状态(pending/completed/cancelled)
 * @apiParam {String} [startTime] 开始日期(YYYY-MM-DD HH:mm:ss)
 * @apiParam {String} [endTime] 结束日期(YYYY-MM-DD HH:mm:ss)
 * @apiParam {Number} [minAmount] 最小金额
 * @apiParam {Number} [maxAmount] 最大金额
 * @apiParam {Boolean} [isTransfer] 是否转账交易
 */
router.get('/list', async (req, res) => {
    try {
        const {
            page = 1,
            pageSize = 10,
            accountId,
            categoryId,
            transactionType,
            status,
            startTime,
            endTime,
            minAmount,
            maxAmount,
            isTransfer
        } = req.query;

        let query = `
            SELECT 
                t.*,
                a.account_name as account_name,
                a.account_number as account_number,
                at.name as account_type_name,
                c.name as category_name,
                c.type as category_type,
                ra.account_name as related_account_name,
                at.id as type_id, at.name as type_name, at.icon as type_icon, at.color as type_color,
                at.is_digital as is_digital, at.can_overdraft as can_overdraft
            FROM transactions t
            LEFT JOIN financial_accounts a ON t.account_id = a.id
            LEFT JOIN account_types at ON a.type_id = at.id
            LEFT JOIN transaction_categories c ON t.category_id = c.id
            LEFT JOIN financial_accounts ra ON t.related_account_id = ra.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (accountId) {
            query += ` AND t.account_id = $${paramIndex++}`;
            params.push(accountId);
        }

        if (categoryId) {
            query += ` AND (t.category_id = $${paramIndex} OR c.parent_id = $${paramIndex})`;
            params.push(categoryId);
            paramIndex++;
        }

        if (transactionType) {
            query += ` AND t.transaction_type = $${paramIndex++}`;
            params.push(transactionType);
        }

        if (status) {
            query += ` AND t.status = $${paramIndex++}`;
            params.push(status);
        }

        if (startTime) {
            query += ` AND t.transaction_date >= $${paramIndex++}`;
            params.push(startTime);
        }

        if (endTime) {
            query += ` AND t.transaction_date <= $${paramIndex++}`;
            params.push(endTime);
        }

        if (minAmount) {
            query += ` AND ABS(t.amount) >= $${paramIndex++}`;
            params.push(minAmount);
        }

        if (maxAmount) {
            query += ` AND ABS(t.amount) <= $${paramIndex++}`;
            params.push(maxAmount);
        }

        if (isTransfer !== undefined) {
            query += ` AND t.is_transfer = $${paramIndex++}`;
            params.push(isTransfer === 'true');
        }

        // 获取总数
        const countQuery = `SELECT COUNT(*) FROM (${query}) as total`;
        const countResult = await db.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        // 添加分页和排序
        query += ` ORDER BY t.transaction_date DESC, t.id DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(parseInt(pageSize, 10), (parseInt(page, 10) - 1) * parseInt(pageSize, 10));

        const result = await db.query(query, params);
        const transactions = result.rows.map(row => ({
            ...row,
            is_transfer: row.is_transfer ? 1 : 0
        }));

        res.json(success({
            list: transactions,
            total,
            page: parseInt(page, 10),
            pageSize: parseInt(pageSize, 10)
        }));
    } catch (err) {
        console.error('获取交易列表失败:', err);
        res.status(500).json(error('获取交易列表失败', err.message));
    }
});

/**
 * @api {get} /transactions/:id 获取交易详情
 * @apiName GetTransaction
 * @apiGroup Transaction
 *
 * @apiParam {Number} id 交易ID
 */
router.get('/detail/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                t.*,
                a.account_name as account_name,
                a.account_number as account_number,
                at.name as account_type_name,
                c.name as category_name,
                c.type as category_type,
                ra.account_name as related_account_name
            FROM transactions t
            LEFT JOIN financial_accounts a ON t.account_id = a.id
            LEFT JOIN account_types at ON a.type_id = at.id
            LEFT JOIN transaction_categories c ON t.category_id = c.id
            LEFT JOIN financial_accounts ra ON t.related_account_id = ra.id
            WHERE t.id = $1
        `;

        const result = await db.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json(error('交易不存在'));
        }

        const transaction = {
            ...result.rows[0],
            is_transfer: result.rows[0].is_transfer ? 1 : 0
        };

        res.json(success(transaction));
    } catch (err) {
        console.error('获取交易详情失败:', err);
        res.status(500).json(error('获取交易详情失败', err.message));
    }
});

/**
 * @api {post} /transactions 创建交易
 * @apiName CreateTransaction
 * @apiGroup Transaction
 *
 * @apiBody {Number} account_id 账户ID
 * @apiBody {Number} [related_account_id] 关联账户ID(转账时必填)
 * @apiBody {Number} category_id 分类ID
 * @apiBody {Number} amount 金额
 * @apiBody {String} transaction_type 交易类型(income/expense/transfer)
 * @apiBody {String} transaction_date 交易时间(YYYY-MM-DD HH:mm:ss)
 * @apiBody {String} [payee] 收款方
 * @apiBody {String} [payer] 付款方
 * @apiBody {String} [description] 描述
 * @apiBody {String} [attachment] 附件路径
 * @apiBody {String} [status=completed] 交易状态(pending/completed/cancelled)
 */
router.post('/add', async (req, res) => {
    try {
        // 支持单条或多条交易数据
        const transactions = Array.isArray(req.body) ? req.body : [req.body];

        if (transactions.length === 0) {
            return res.status(400).json(error('至少需要提供一个交易数据'));
        }

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        // 验证所有交易数据
        for (const transaction of transactions) {
            const {
                account_id,
                related_account_id,
                category_id,
                amount,
                transaction_type,
                transaction_date,
                payee,
                payer,
                description,
                attachment,
                status = 'completed'
            } = transaction;

            // 验证必填字段
            if (!account_id || !category_id || !amount || !transaction_type || !transaction_date) {
                return res.status(400).json(error('缺少必填参数'));
            }

            // 验证金额
            if (isNaN(amount) || amount <= 0) {
                return res.status(400).json(error('金额必须大于0'));
            }

            // 转账交易验证
            const isTransfer = transaction_type === 'transfer';
            if (isTransfer && !related_account_id) {
                return res.status(400).json(error('转账交易必须指定关联账户'));
            }

            if (new Date(transaction_date) < oneMonthAgo) {
                return res.status(400).json(error('只能添加最近一个月内的交易金额或账户'));
            }
        }
        // 开始事务
        await db.query('BEGIN');

        try {
            const results = [];

            for (const transaction of transactions) {
                const {
                    account_id,
                    related_account_id,
                    category_id,
                    amount,
                    transaction_type,
                    transaction_date,
                    payee,
                    payer,
                    description,
                    attachment,
                    status = 'completed'
                } = transaction;

                // 验证账户存在
                const accountCheck = await db.query('SELECT id, balance FROM financial_accounts WHERE id = $1', [account_id]);
                if (accountCheck.rows.length === 0) {
                    throw new Error(`账户 ${account_id} 不存在`);
                }

                // 验证分类存在
                const categoryCheck = await db.query('SELECT id, type FROM transaction_categories WHERE id = $1', [category_id]);
                if (categoryCheck.rows.length === 0) {
                    throw new Error(`分类 ${category_id} 不存在`);
                }

                // 验证分类类型与交易类型匹配
                const isTransfer = transaction_type === 'transfer';
                if (!isTransfer && categoryCheck.rows[0].type !== transaction_type) {
                    throw new Error('分类类型与交易类型不匹配');
                }

                // 生成交易编号
                const transaction_no = await generateTransactionNo(results.length + 1);

                // 计算交易后余额
                let balanceAfter;
                let amountValue;

                const prevTransactionRes = await db.query(`
                    SELECT balance_after
                    FROM transactions
                    WHERE account_id = $1
                      AND (transaction_date < $2 OR (transaction_date = $2 AND transaction_no < $3))
                    ORDER BY transaction_date DESC, id DESC
                    LIMIT 1
                `, [account_id, transaction_date, transaction_no]);

                const previousBalance = prevTransactionRes.rows.length > 0
                    ? parseFloat(prevTransactionRes.rows[0].balance_after)
                    : 0; // 如果没有更早的交易，起始余额为 0

                if (transaction_type === 'income') {
                    amountValue = Math.abs(amount);
                } else if (transaction_type === 'expense') {
                    amountValue = -Math.abs(amount);
                } else if (isTransfer) {
                    amountValue = -Math.abs(amount);
                }

                balanceAfter = previousBalance + amountValue;
                if (transaction_type === 'income') {
                    amountValue = Math.abs(amount);
                } else if (transaction_type === 'expense') {
                    amountValue = -Math.abs(amount);
                } else if (isTransfer) {
                    // 转账交易需要验证关联账户
                    const relatedAccountCheck = await db.query('SELECT id, balance FROM financial_accounts WHERE id = $1', [related_account_id]);
                    if (relatedAccountCheck.rows.length === 0) {
                        throw new Error('关联账户不存在');
                    }
                    amountValue = -Math.abs(amount);
                }

                // 插入交易记录
                const insertQuery = `
                    INSERT INTO transactions (
                        transaction_no,
                        account_id,
                        related_account_id,
                        category_id,
                        amount,
                        transaction_type,
                        transaction_date,
                        balance_after,
                        payee,
                        payer,
                        description,
                        attachment,
                        status,
                        is_transfer
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    RETURNING id, transaction_date
                `;
                const insertParams = [
                    transaction_no,
                    account_id,
                    related_account_id || null,
                    category_id,
                    amountValue,
                    transaction_type,
                    transaction_date,
                    balanceAfter,
                    payee || null,
                    payer || null,
                    description || null,
                    attachment || null,
                    status,
                    isTransfer
                ];

                const insertResult = await db.query(insertQuery, insertParams);
                const transactionId = insertResult.rows[0].id;
                const newTransactionDate = insertResult.rows[0].transaction_date;

                // 如果是转账交易，需要创建对应的另一条记录
                if (isTransfer) {
                    const relatedBalanceAfter = parseFloat(accountCheck.rows[0].balance) + parseFloat(amount);

                    const relatedInsertQuery = `
                        INSERT INTO transactions (
                            transaction_no,
                            account_id,
                            related_account_id,
                            category_id,
                            amount,
                            transaction_type,
                            transaction_date,
                            balance_after,
                            payee,
                            payer,
                            description,
                            attachment,
                            status,
                            is_transfer
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                        RETURNING id, transaction_date
                    `;
                    const relatedInsertParams = [
                        transaction_no + '-R',
                        related_account_id,
                        account_id,
                        category_id,
                        Math.abs(amount),
                        transaction_type,
                        transaction_date,
                        relatedBalanceAfter,
                        payer || null,
                        payee || null,
                        description || null,
                        attachment || null,
                        status,
                        isTransfer
                    ];

                    const relatedInsertResult = await db.query(relatedInsertQuery, relatedInsertParams);
                    const relatedTransactionDate = relatedInsertResult.rows[0].transaction_date;

                    // 更新关联账户的后续交易余额
                    const updateRelatedSubsequentQuery = `
                        UPDATE transactions
                        SET balance_after = balance_after + $1
                        WHERE 
                            account_id = $2 AND
                            (transaction_date > $3 OR 
                            (transaction_date = $3 AND id > $4))
                    `;
                    await db.query(updateRelatedSubsequentQuery, [
                        Math.abs(amount),
                        related_account_id,
                        relatedTransactionDate,
                        relatedInsertResult.rows[0].id
                    ]);
                }

                // 更新账户余额
                const updateAccountQuery =
                    'UPDATE financial_accounts SET balance = balance + $1 WHERE id = $2';
                await db.query(updateAccountQuery, [amountValue, account_id]);

                // 更新同一账户的后续交易余额
                const updateSubsequentQuery = `
                    UPDATE transactions
                    SET balance_after = balance_after + $1
                    WHERE 
                        account_id = $2 AND
                        (transaction_date > $3 OR 
                        (transaction_date = $3 AND id > $4))
                `;
                await db.query(updateSubsequentQuery, [
                    amountValue,
                    account_id,
                    newTransactionDate,
                    transactionId
                ]);

                // 如果是转账交易，还需要更新关联账户余额
                if (isTransfer) {
                    const relatedAccount = await db.query('SELECT balance FROM financial_accounts WHERE id = $1', [related_account_id]);
                    const relatedBalanceAfter = parseFloat(relatedAccount.rows[0].balance) + parseFloat(amount);
                    await db.query(updateAccountQuery, [relatedBalanceAfter, related_account_id]);
                }

                results.push({
                    id: transactionId,
                    transaction_no,
                    account_id,
                    amount: amountValue,
                    transaction_type
                });
            }

            // 提交事务
            await db.query('COMMIT');

            res.json(success({
                count: results.length,
                transactions: results,
                message: `成功添加${results.length}笔交易`
            }));
        } catch (err) {
            // 回滚事务
            await db.query('ROLLBACK');
            console.error('批量添加交易失败:', err);
            res.status(500).json(error('批量添加交易失败', err.message));
        }
    } catch (err) {
        console.error('批量添加交易失败:', err);
        res.status(500).json(error('批量添加交易失败', err.message));
    }
});

/**
 * @api {put} /transactions/:id 更新交易
 * @apiName UpdateTransaction
 * @apiGroup Transaction
 *
 * @apiParam {Number} id 交易ID
 * @apiBody {Number} [account_id] 账户ID
 * @apiBody {Number} [related_account_id] 关联账户ID
 * @apiBody {Number} [category_id] 分类ID
 * @apiBody {Number} [amount] 金额
 * @apiBody {String} [transaction_type] 交易类型(income/expense/transfer)
 * @apiBody {String} [transaction_date] 交易时间(YYYY-MM-DD HH:mm:ss)
 * @apiBody {String} [payee] 收款方
 * @apiBody {String} [payer] 付款方
 * @apiBody {String} [description] 描述
 * @apiBody {String} [attachment] 附件路径
 * @apiBody {String} [status] 交易状态(pending/completed/cancelled)
 */
router.put('/edit/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            account_id,
            related_account_id,
            category_id,
            amount,
            transaction_type,
            transaction_date,
            payee,
            payer,
            description,
            attachment,
            status
        } = req.body;

        const isTransfer = transaction_type === 'transfer';
        const amountTrans = amount !== undefined &&
        (transaction_type === 'expense' || isTransfer) ? -Math.abs(amount) : Math.abs(amount);

        // 获取原始交易记录
        const originalQuery = 'SELECT * FROM transactions WHERE id = $1';
        const originalResult = await db.query(originalQuery, [id]);
        if (originalResult.rows.length === 0) {
            return res.status(404).json(error('交易不存在'));
        }

        const originalTransaction = originalResult.rows[0];

        // 检查是否是最近一个月的交易
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        // 开始事务
        await db.query('BEGIN');

        try {
            // 构建更新字段和参数
            const updateFields = [];
            const updateParams = [];
            let paramIndex = 1;

            if (account_id !== undefined) {
                updateFields.push(`account_id = $${paramIndex++}`);
                updateParams.push(account_id);
            }

            if (related_account_id !== undefined) {
                updateFields.push(`related_account_id = $${paramIndex++}`);
                updateParams.push(related_account_id);
            }

            if (category_id !== undefined) {
                updateFields.push(`category_id = $${paramIndex++}`);
                updateParams.push(category_id);
            }

            if (amount !== undefined) {
                updateFields.push(`amount = $${paramIndex++}`);
                updateParams.push(amountTrans);
            }

            if (transaction_type !== undefined) {
                updateFields.push(`transaction_type = $${paramIndex++}`);
                updateParams.push(transaction_type);
            }

            if (transaction_date !== undefined) {
                updateFields.push(`transaction_date = $${paramIndex++}`);
                updateParams.push(transaction_date);
            }

            if (payee !== undefined) {
                updateFields.push(`payee = $${paramIndex++}`);
                updateParams.push(payee);
            }

            if (payer !== undefined) {
                updateFields.push(`payer = $${paramIndex++}`);
                updateParams.push(payer);
            }

            if (description !== undefined) {
                updateFields.push(`description = $${paramIndex++}`);
                updateParams.push(description);
            }

            if (attachment !== undefined) {
                updateFields.push(`attachment = $${paramIndex++}`);
                updateParams.push(attachment);
            }

            if (status !== undefined) {
                updateFields.push(`status = $${paramIndex++}`);
                updateParams.push(status);
            }

            if (updateFields.length === 0) {
                return res.status(400).json(error('没有提供更新字段'));
            }
            const dataChange = transaction_date !== originalResult.transaction_date;
            // 处理金额或账户变更
            if (amount !== undefined || account_id !== undefined) {
                // 检查交易是否在一个月内
                if (new Date(originalTransaction.transaction_date) < oneMonthAgo) {
                    return res.status(400).json(error('只能修改最近一个月内的交易金额或账户'));
                }

                // 验证新账户是否存在
                const newAccountId = account_id !== undefined ? account_id : originalTransaction.account_id;
                const isSameAccount = newAccountId === originalTransaction.account_id;
                const accountQuery = 'SELECT * FROM financial_accounts WHERE id = $1';
                const accountResult = await db.query(accountQuery, [newAccountId]);
                if (accountResult.rows.length === 0) {
                    return res.status(404).json(error('交易账户不存在'));
                }
                if (isSameAccount) {
                    const amountChange = originalTransaction.amount - amountTrans;
                    // 更新当前交易的余额
                    updateFields.push(`balance_after = balance_after - $${paramIndex++}`);
                    updateParams.push(amountChange);

                    // 更新账户余额
                    const updateAccountQuery = `
                        UPDATE financial_accounts 
                        SET balance = balance - $1
                        WHERE id = $2
                    `;
                    await db.query(updateAccountQuery, [amountChange, newAccountId]);

                    // 获取需要更新的后续交易
                    const subsequentQuery = `
                    UPDATE transactions
                    SET balance_after = balance_after - $1
                    WHERE 
                        account_id = $2 AND
                        (transaction_date > $3 OR 
                        (transaction_date = $3 AND id > $4))
                `;
                    const subsequentParams = [
                        amountChange,
                        newAccountId,
                        originalTransaction.transaction_date,
                        id,
                    ];
                    await db.query(subsequentQuery, subsequentParams);

                } else {
                    //
                }

                // 如果是转账交易，还需要处理关联账户
                // if (originalTransaction.is_transfer) {
                //     const relatedAccountId = originalTransaction.related_account_id;
                //     const reverseAmountChange = -amountChange; // 反向金额变化
                //
                //     // 更新关联账户余额
                //     await db.query(updateAccountQuery, [reverseAmountChange, relatedAccountId]);
                //
                //     // 更新关联账户的后续交易
                //     const relatedSubsequentQuery = `
                //         SELECT id, account_id, amount, balance_after
                //         FROM transactions
                //         WHERE
                //             transaction_date >= $1 AND
                //             id != $2 AND
                //             account_id = $3
                //         ORDER BY transaction_date, id
                //     `;
                //     const relatedSubsequentResult = await db.query(relatedSubsequentQuery, [
                //         originalTransaction.transaction_date,
                //         originalTransaction.id,
                //         relatedAccountId
                //     ]);
                //
                //     for (const tx of relatedSubsequentResult.rows) {
                //         const updateSubsequentQuery = `
                //             UPDATE transactions
                //             SET balance_after = balance_after - $1
                //             WHERE id = $2
                //         `;
                //         await db.query(updateSubsequentQuery, [reverseAmountChange, tx.id]);
                //     }
                // }
            }

            // 执行更新
            const updateQuery = `
                UPDATE transactions 
                SET ${updateFields.join(', ')} 
                WHERE id = $${paramIndex}
                RETURNING *
            `;
            updateParams.push(id);

            const updateResult = await db.query(updateQuery, updateParams);
            const updatedTransaction = updateResult.rows[0];

            // 提交事务
            await db.query('COMMIT');

            res.json(success(updatedTransaction));
        } catch (err) {
            // 回滚事务
            await db.query('ROLLBACK');
            console.error('更新交易失败:', err);
            res.status(500).json(error('更新交易失败', err.message));
        }
    } catch (err) {
        console.error('更新交易失败:', err);
        res.status(500).json(error('更新交易失败', err.message));
    }
});

/**
 * @api {delete} /transactions/:id 删除交易
 * @apiName DeleteTransaction
 * @apiGroup Transaction
 *
 * @apiParam {Number} id 交易ID
 */
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 获取交易信息
        const transactionQuery = 'SELECT * FROM transactions WHERE id = $1';
        const transactionResult = await db.query(transactionQuery, [id]);
        if (transactionResult.rows.length === 0) {
            return res.status(404).json(error('交易不存在'));
        }
        const transaction = transactionResult.rows[0];
        const transactionDate = new Date(transaction.transaction_date);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        // 检查交易是否在一个月内
        const isRecentTransaction = transactionDate >= oneMonthAgo;

        const isTransfer = transaction.transaction_type === 'transfer';
        const amountTrans =
            (transaction.transaction_type === 'expense' || isTransfer) ?
                -Math.abs(transaction.amount) :
                Math.abs(transaction.amount);
        // 开始事务
        await db.query('BEGIN');

        try {
            // 如果是转账交易，需要删除关联的交易记录
            if (transaction.is_transfer) {
                const relatedQuery = `
                    DELETE FROM transactions 
                    WHERE transaction_no = $1 AND id != $2
                    RETURNING id, account_id, amount
                `;
                const relatedResult = await db.query(relatedQuery, [transaction.transaction_no, id]);

                if (relatedResult.rows.length > 0) {
                    const relatedTransaction = relatedResult.rows[0];
                    // 恢复关联账户余额
                    const updateRelatedAccountQuery = `
                        UPDATE financial_accounts 
                        SET balance = balance - $1 
                        WHERE id = $2
                    `;
                    await db.query(updateRelatedAccountQuery, [
                        -relatedTransaction.amount, // 因为是反向操作，所以取反
                        relatedTransaction.account_id
                    ]);

                    // 如果是最近交易，更新后续交易余额
                    if (isRecentTransaction) {
                        const updateSubsequentQuery = `
                            UPDATE transactions
                            SET balance_after = balance_after - $1
                            WHERE 
                                (transaction_date > $2 OR 
                                (transaction_date = $2 AND id > $3)) AND
                                account_id = $4
                        `;
                        await db.query(updateSubsequentQuery, [
                            -relatedTransaction.amount,
                            transactionDate,
                            relatedTransaction.id,
                            relatedTransaction.account_id
                        ]);
                    }
                }
            }

            // 恢复账户余额
            const updateAccountQuery = `
                UPDATE financial_accounts 
                SET balance = balance - $1 
                WHERE id = $2
            `;
            await db.query(updateAccountQuery, [
                amountTrans,
                transaction.account_id
            ]);

            // 如果是最近交易，更新后续交易余额
            if (isRecentTransaction) {
                const updateSubsequentQuery = `
                    UPDATE transactions
                    SET balance_after = balance_after - $1
                    WHERE 
                        account_id = $4 AND
                        (transaction_date > $2 OR 
                        (transaction_date = $2 AND id > $3))
                `;
                await db.query(updateSubsequentQuery, [
                    amountTrans,
                    transactionDate,
                    id,
                    transaction.account_id
                ]);
            }

            // 删除交易记录
            const deleteQuery = 'DELETE FROM transactions WHERE id = $1 RETURNING id';
            const deleteResult = await db.query(deleteQuery, [id]);

            // 提交事务
            await db.query('COMMIT');

            // 根据是否最近交易返回不同提示
            if (isRecentTransaction) {
                res.json(success({
                    id: deleteResult.rows[0].id,
                    message: '交易删除成功，并已更新后续交易余额'
                }));
            } else {
                res.json(success({
                    id: deleteResult.rows[0].id,
                    message: '交易删除成功（一个月前的记录，未更新后续交易余额）'
                }));
            }
        } catch (err) {
            // 回滚事务
            await db.query('ROLLBACK');
            console.error('删除交易失败:', err);
            res.status(500).json(error('删除交易失败', err.message));
        }
    } catch (err) {
        console.error('删除交易失败:', err);
        res.status(500).json(error('删除交易失败', err.message));
    }
});

/**
 * @api {patch} /transactions/:id/status 更新交易状态
 * @apiName UpdateTransactionStatus
 * @apiGroup Transaction
 *
 * @apiParam {Number} id 交易ID
 * @apiBody {String} status 新状态(pending/completed/cancelled)
 */
router.patch('/status/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['pending', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json(error('无效的状态值'));
        }

        const query = 'UPDATE transactions SET status = $1 WHERE id = $2 RETURNING *';
        const result = await db.query(query, [status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json(error('交易不存在'));
        }

        res.json(success(result.rows[0]));
    } catch (err) {
        console.error('更新交易状态失败:', err);
        res.status(500).json(error('更新交易状态失败', err.message));
    }
});

/**
 * @api {get} /transactions/:id/related 获取关联交易
 * @apiName GetRelatedTransactions
 * @apiGroup Transaction
 *
 * @apiParam {Number} id 交易ID
 */
router.get('/related/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 获取当前交易信息
        const currentQuery = 'SELECT transaction_no, is_transfer FROM transactions WHERE id = $1';
        const currentResult = await db.query(currentQuery, [id]);
        if (currentResult.rows.length === 0) {
            return res.status(404).json(error('交易不存在'));
        }

        const currentTransaction = currentResult.rows[0];

        let relatedTransactions = [];
        if (currentTransaction.is_transfer) {
            // 如果是转账交易，获取关联的交易记录
            const relatedQuery = `
                SELECT 
                    t.id,
                    t.transaction_no,
                    t.account_id,
                    t.amount,
                    t.transaction_type,
                    t.transaction_date,
                    t.status,
                    a.account_name
                FROM transactions t
                LEFT JOIN financial_accounts a ON t.account_id = a.id
                WHERE t.transaction_no = $1 AND t.id != $2
            `;
            const relatedResult = await db.query(relatedQuery, [
                currentTransaction.transaction_no,
                id
            ]);
            relatedTransactions = relatedResult.rows;
        }

        res.json(success(relatedTransactions));
    } catch (err) {
        console.error('获取关联交易失败:', err);
        res.status(500).json(error('获取关联交易失败', err.message));
    }
});

export default router;