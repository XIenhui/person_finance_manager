import { request } from '@/api/service.js'
export function reqTransList(params = {}) {
    const data = {
        pageNum: 1,
        pageSize: 30,
        ...params
    }
    return request({
        url: '/business/transaction/list',
        method: 'get',
        params: data
    });
}
export function reqStat() {
    return request({
        url: '/home/dashboard/summary',
        method: 'get',
    });
}
export function reqAccountList(params) {
    const data = {
        page: 1,
        size: 30,
        is_active: 1,
        sortField: 'balance',
        sortOrder: 'desc',
        ...params
    }
    return request({
        url: '/setting/accounts/list',
        method: 'get',
        params: data
    });
}