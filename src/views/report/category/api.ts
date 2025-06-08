import { request } from '@/api/service.js'


export function reqList(params) {
    return request({
        url: '/report/day/list',
        method: 'get',
        params
    });
}