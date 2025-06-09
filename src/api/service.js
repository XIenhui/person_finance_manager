import axios from 'axios';
import Qs from 'qs';
import { get } from 'lodash-es';
export const getToken = () => {
  return '6ba7b8159dad11d180b400c04fd430c8';
};
// const getUserInfo = () => {
//     return {
//         tenantCode: ''
//     }
// }
const globSetting = {
  apiUrl: 'http://127.0.0.1:3001/api',
};
/**
 * @description 创建请求实例
 */
function createService() {
  // 创建一个 axios 实例
  const service = axios.create();
  // 请求拦截
  service.interceptors.request.use(
    (config) => {
      if (config.method === 'get') {
        config.paramsSerializer = function (params) {
          return Qs.stringify(params, { arrayFormat: 'repeat' });
        };
      }
      return config;
    },
    (error) => {
      // 发送失败
      return Promise.reject(error);
    }
  );
  // 响应拦截
  service.interceptors.response.use(
    (response) => {
      // dataAxios 是 axios 返回数据中的 data
      console.log('interceptors-response', response);
      const dataAxios = response.data;
      const { successful } = dataAxios;
      const isOk = successful === true;
      if (isOk) {
        return dataAxios;
      } else if (response.config.responseType === 'blob') {
        return dataAxios;
      } else if (response.status === 200) {
        const data = response.data;
        if (data.code) {
          if (isOk) {
            return dataAxios;
          } else {
            console.error(`${dataAxios.message}`);
            return dataAxios;
          }
        } else {
          return dataAxios;
        }
      } else {
        console.error(`${dataAxios.message}`);
      }
    },
    (error) => {
      const message = get(error, 'response.data.message');
      const status = get(error, 'response.status');
      switch (status) {
        case 400:
          error.message = '请求错误';
          break;
        case 401:
          error.message = '未授权，请登录';
          break;
        case 403:
          error.message = '拒绝访问';
          break;
        case 404:
          error.message = `请求地址出错: ${error.response.config.url}`;
          break;
        case 408:
          error.message = '请求超时';
          break;
        case 500:
          error.message = '服务器内部错误';
          break;
        case 501:
          error.message = '服务未实现';
          break;
        case 502:
          error.message = '网关错误';
          break;
        case 503:
          error.message = '服务不可用';
          break;
        case 504:
          error.message = '网关超时';
          break;
        case 505:
          error.message = 'HTTP版本不受支持';
          break;
        default:
          error.message = '未知错误';
          break;
      }
      if (error.message === 'Network Error') {
        error.message = '网络连接失败,请稍后再试';
      }
      if (message) {
        error.message = message;
      }
      if (!status) error.message = '无法连接到服务器';
      console.error(error);
      return Promise.reject(error);
    }
  );
  return service;
}

/**
 * @description 创建请求方法
 * @param {Object} service axios 实例
 */
function createRequestFunction(service) {
  return function (config) {
    const token = getToken();
    let headers = {};
    if (token !== null && token !== undefined) {
      headers = {
        Authorization: 'Bearer ' + token,
      };
    }
    const configDefault = {
      headers: {
        ...headers,
        'Content-Type': get(config, 'headers.Content-Type', 'application/json'),
      },
      // 超时时间 10 秒
      // timeout: 1000 * 10,
      timeout: 5000,
      baseURL: globSetting.apiUrl,
      data: {},
    };
    return service(Object.assign(configDefault, config));
  };
}

// 用于真实网络请求的实例和请求方法
export const service = createService();
export const request = createRequestFunction(service);

export const GET = async (url, query) => {
  return await request({ url: url, method: 'GET', params: query });
};

export const POST = async (url, obj) => {
  return await request({ url: url, method: 'POST', data: obj });
};

export const PUT = async (url, obj) => {
  return await request({ url: url, method: 'PUT', data: obj });
};

export const DELETE = async (url, obj) => {
  return await request({ url: url, method: 'DELETE', data: obj });
};
