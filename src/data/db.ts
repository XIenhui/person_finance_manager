export const dbConfig = {
    host: 'localhost',
    port: 5432,
    database: 'my_finance',
    user: 'mahang', // 创建专用只读用户
    password: '123456',
    ssl: false // 开发环境禁用SSL
};