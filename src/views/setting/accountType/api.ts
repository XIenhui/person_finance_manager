import { request } from "@/api/service";
export const reqList = (data) => {
    return request({
        url: '/setting/accountTypes/list',
        method: 'get',
        params: data,
    });
};

export const reqAdd = (data) => {
    return request({
        url: '/setting/accountTypes/add',
        method: 'post',
        data,
    });
};

export const reqDelete = (id) => {
    return request({
        url: `/setting/accountTypes/delete/${id}`,
        method: 'delete',
    });
};

export const reqEdit = (id, data) => {
    return request({
        url: `/setting/accountTypes/edit/${id}`,
        method: 'put',
        data,
    });
};