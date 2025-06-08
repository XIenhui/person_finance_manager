export const dbConfig = {
    host: 'localhost',
    port: 5432,
    database: 'finance',
    user: 'browser_user', // 创建专用只读用户
    password: 'weak_password',
    ssl: false // 开发环境禁用SSL
};