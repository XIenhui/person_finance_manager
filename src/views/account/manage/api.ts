import { request } from '@/api/service.js'

/**
 * 获取账户列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function reqList(params) {
    return request({
        url: '/setting/accounts/list',
        method: 'get',
        params
    });
}

/**
 * 获取账户详情
 * @param {Number} id 账户ID
 * @returns {Promise}
 */
export function reqDetail(id) {
    return request({
        url: `/setting/accounts/detail/${id}`,
        method: 'get'
    });
}

/**
 * 创建账户
 * @param {Object} data 账户数据
 * @returns {Promise}
 */
export function reqAdd(data) {
    return request({
        url: '/setting/accounts/add',
        method: 'post',
        data
    });
}

/**
 * 更新账户
 * @param {Number} id 账户ID
 * @param {Object} data 更新数据
 * @returns {Promise}
 */
export function reqEdit(id, data) {
    return request({
        url: `/setting/accounts/edit/${id}`,
        method: 'put',
        data
    });
}

/**
 * 删除账户
 * @param {Number} id 账户ID
 * @returns {Promise}
 */
export function reqDelete(id) {
    return request({
        url: `/setting/accounts/delete/${id}`,
        method: 'delete'
    });
}

export function reqChangeStatus(status, id) {
    const data = { is_active: status }
    return request({
        url: `/setting/accounts/edit/${id}`,
        method: 'put',
        data
    });
}
export function reqTypes(data) {
    return request({
        url: '/setting/accountTypes/list',
        method: 'get',
        params: data,
    });
};