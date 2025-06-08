// utils/response.js
export function success(data = {}, message = '操作成功!') {
    return {
        code: 200,
        message,
        successful: true,
        timestamp: Date.now(),
        data
    };
}

export function error(message = '操作失败', err = null) {
    return {
        code: 500,
        message,
        successful: false,
        timestamp: Date.now(),
        data: {
            error: err?.message || err || '未知错误'
        }
    };
}
