import { reactive } from 'vue';
import { debounce } from 'lodash-es';
import { GET } from '@/api/service.js';

const ACCOUNT_TYPE_URL = '/setting/accountTypes/list';
const ACCOUNT_URL = '/setting/accounts/list';

/**
 * 账户类型远程搜索Hook
 * @param {Object} options 配置选项
 * @param {Boolean} options.immediate 是否立即加载初始数据
 * @param {Array} options.defaultOptions 默认选项
 * @param {Function} options.formatter 数据格式化函数
 * @returns {Object} 包含搜索方法和状态的响应式对象
 */
export const useAccountTypeRemote = (options) => {
    const { immediate = false, defaultOptions = [] } = options;

    let lastFetchId = 0;
    const state = reactive({
        data: [...defaultOptions],
        fetching: false,
        loaded: false
    });

    // 远程搜索方法
    const fetchAccountTypes = debounce(async (keyword = '') => {
        lastFetchId += 1;
        const fetchId = lastFetchId;

        state.data = [];
        state.fetching = true;

        try {
            const response = await GET(ACCOUNT_TYPE_URL, {
                keyword,
                page: 1,
                size: 50, // 限制每次返回的数量
                is_active: 1,
            });

            if (fetchId !== lastFetchId) return;
            state.data = response.data.records
            state.loaded = true;
        } catch (error) {
            console.error('获取账户类型失败:', error);
            state.data = [...defaultOptions];
        } finally {
            state.fetching = false;
        }
    }, 800);

    // 立即加载初始数据
    if (immediate && !state.loaded) {
        fetchAccountTypes();
    }

    return {
        fetchAccountTypes,
        accountTypeState: state
    };
};

export const useAccountRemote = (options) => {
    const { immediate = false, defaultOptions = [] } = options;

    let lastFetchId = 0;
    const state = reactive({
        data: [...defaultOptions],
        fetching: false,
        loaded: false
    });

    // 远程搜索方法
    const fetchAccounts = debounce(async (keyword = '') => {
        lastFetchId += 1;
        const fetchId = lastFetchId;

        state.data = [];
        state.fetching = true;

        try {
            const response = await GET(ACCOUNT_URL, {
                keyword,
                page: 1,
                size: 50, // 限制每次返回的数量
                is_active: 1,
            });

            if (fetchId !== lastFetchId) return;
            state.data = response.data.records
            state.loaded = true;
        } catch (error) {
            console.error('获取账户数据失败:', error);
            state.data = [...defaultOptions];
        } finally {
            state.fetching = false;
        }
    }, 800);

    // 立即加载初始数据
    if (immediate && !state.loaded) {
        fetchAccounts();
    }

    return {
        fetchAccounts,
        accountState: state
    };
};