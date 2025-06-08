import {createRouter, createWebHashHistory } from 'vue-router'
import { useMainStore } from "@/store/index.ts";
const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/home',
            redirect: '/home/dashboard',
            meta: { title: '首页' },
            children: [
                {
                    path: 'dashboard',
                    name: 'dashboard',
                    component: () => import('@/views/home/dashboard/index.vue'),
                    meta: { title: '首页', subTitle: '首页' }
                },
            ]
        },
        {
            path: '/business',
            redirect: '/business/transaction',
            meta: { title: '业务管理' },
            children: [
                {
                    path: 'transaction',
                    name: 'transaction',
                    component: () => import('@/views/business/transaction/index.vue'),
                    meta: { title: '业务管理', subTitle: '交易明细' },
                },
                {
                    path: 'income',
                    name: 'income',
                    component: () => import('@/views/business/income/index.vue'),
                    meta: { title: '业务管理', subTitle: '收入记录' },
                },
                {
                    path: 'expenditure',
                    name: 'expenditure',
                    component: () => import('@/views/business/expenditure/index.vue'),
                    meta: { title: '业务管理', subTitle: '支出记录' },
                },
                {
                    path: 'transfer',
                    name: 'transfer',
                    component: () => import('@/views/business/transfer/index.vue'),
                    meta: { title: '业务管理', subTitle: '转账记录' },
                },
            ]
        },
        {
            path: '/account',
            redirect: '/account/manage',
            meta: { title: '账户管理' },
            children: [
                {
                    path: 'manage',
                    name: 'manage',
                    component: () => import('@/views/account/manage/index.vue'),
                    meta: { title: '账户管理', subTitle: '账户数据' },
                },
                {
                    path: 'budget',
                    name: 'budget',
                    component: () => import('@/views/account/budget/index.vue'),
                    meta: { title: '账户管理', subTitle: '预算管理' },
                },
                {
                    path: 'goal',
                    name: 'goal',
                    component: () => import('@/views/account/goal/index.vue'),
                    meta: { title: '账户管理', subTitle: '目标储蓄' },
                },
            ]
        },
        {
            path: '/report',
            redirect: '/report/custom',
            meta: { title: '统计报表' },
            children: [
                {
                    path: 'custom',
                    name: 'report_custom',
                    component: () => import('@/views/report/custom/index.vue'),
                    meta: { title: '统计报表', subTitle: '交易统计表' },
                },
                {
                    path: 'category',
                    name: 'report_category',
                    component: () => import('@/views/report/category/index.vue'),
                    meta: { title: '统计报表', subTitle: '账目趋势表' },
                },
                {
                    path: 'account',
                    name: 'report_account',
                    component: () => import('@/views/report/account/index.vue'),
                    meta: { title: '统计报表', subTitle: '账户趋势表' },
                },
                {
                    path: 'budget',
                    name: 'report_budget',
                    component: () => import('@/views/report/budget/index.vue'),
                    meta: { title: '统计报表', subTitle: '预算趋势表' },
                },
            ]
        },
        {
            path: '/setting',
            redirect: '/setting/account',
            meta: { title: '系统管理' },
            children: [
                {
                    path: 'accountType',
                    name: 'accountType',
                    component: () => import('@/views/setting/accountType/index.vue'),
                    meta: { title: '管理设置', subTitle: '账户类型' }
                },
                {
                    path: 'account',
                    name: 'account',
                    component: () => import('@/views/setting/account/index.vue'),
                    meta: { title: '管理设置', subTitle: '基础账户' }
                },
                {
                    path: 'category',
                    name: 'category',
                    component: () => import('@/views/setting/category/index.vue'),
                    meta: { title: '管理设置', subTitle: '基础账目' }
                },
                {
                    path: 'user',
                    name: 'user',
                    component: () => import('@/views/setting/user/index.vue'),
                    meta: { title: '管理设置', subTitle: '用户列表' }
                },
                {
                    path: 'log',
                    name: 'log',
                    component: () => import('@/views/setting/log/index.vue'),
                    meta: { title: '管理设置', subTitle: '操作日志' }
                },
                {
                    path: 'system',
                    name: 'system',
                    component: () => import('@/views/setting/system/index.vue'),
                    meta: { title: '管理设置', subTitle: '系统设置' }
                },
            ]
        },
        // 404页面处理
        {
            path: '/:pathMatch(.*)*',
            name: 'NotFound',
            component: () => import('@/views/error/NotFound/index.vue')
        }
    ]
})

router.beforeEach((to, from, next) => {
    const store = useMainStore();
    if (to.meta.title) {
        document.title = to.meta.title
        store.setSubTitle(to.meta.subTitle)
    }
    store.checkNotFound(to.name)
    next()
})

export default router