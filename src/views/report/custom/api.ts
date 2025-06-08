import { request } from '@/api/service.js'


export function reqList(params) {
    return request({
        url: '/report/custom/list',
        method: 'get',
        params
    });
}