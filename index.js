import express from 'express';
import cors from 'cors';
import accountRoutes from './src/routes/setting/accountTypes.js';
import accounts from "#routes/setting/accounts.js";
import category from "#routes/setting/category.js";
import transaction from "#routes/business/transaction.js";
import day from "#routes/report/day.js";
import custom from "#routes/report/custom.js";
import screen from "#routes/home/dashboard.js";

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/setting/accountTypes', accountRoutes)
app.use('/api/setting/accounts', accounts)
app.use('/api/setting/category', category)
app.use('/api/business/transaction', transaction)
app.use('/api/report/day', day)
app.use('/api/report/custom', custom)
app.use('/api/home/dashboard', screen)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`)
})
