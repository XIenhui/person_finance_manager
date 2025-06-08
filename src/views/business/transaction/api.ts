import { request } from '@/api/service.js'


/**
 * 获取交易列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function reqList(params) {
    return request({
        url: '/business/transaction/list',
        method: 'get',
        params
    });
}

/**
 * 获取交易详情
 * @param {Number} id 交易ID
 * @returns {Promise}
 */
export function reqDetail(id) {
    return request({
        url: `/business/transaction/detail/${id}`,
        method: 'get'
    });
}

/**
 * 创建交易
 * @param {Object} data 交易数据
 * @returns {Promise}
 */
export function reqAdd(data) {
    return request({
        url: '/business/transaction/add',
        method: 'post',
        data
    });
}

/**
 * 更新交易
 * @param {Number} id 交易ID
 * @param {Object} data 更新数据
 * @returns {Promise}
 */
export function reqEdit(id, data) {
    return request({
        url: `/business/transaction/edit/${id}`,
        method: 'put',
        data
    });
}

/**
 * 删除交易
 * @param {Number} id 交易ID
 * @returns {Promise}
 */
export function reqDelete(id) {
    return request({
        url: `/business/transaction/delete/${id}`,
        method: 'delete'
    });
}

export function reqChangeStatus(status, id) {
    const data = { is_active: status }
    return request({
        url: `/business/transaction/edit/${id}`,
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