import { defineStore } from 'pinia'
import { getMenu } from '@/data/menuData.js'

export const useMainStore = defineStore('main', {
    state: () => ({
        accounts: [] as any[],
        accountTypes: [],
        categories: [] as any[],
        users: [] as any[],
        curPage: -1,
        title: '测试标题',
        subTitle: '',
        curList: getMenu(''),
        notFound: false,
        menuCollapse: false,
    }),
    getters: {
        // 可按需添加
    },
    actions: {
        setSubTitle(subTitle: string) {
            if (subTitle) this.subTitle = subTitle
        },
        setMenu(path: string) {
            this.curList = getMenu(path)
        },
        changeMenuCollapse(type: boolean) {
            this.menuCollapse = type
        },
        checkNotFound(name: string) {
            if (!name) return
            this.notFound = name === 'NotFound'
        },
    }
})
