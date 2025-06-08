import { h } from "vue"
import {
    Monitor,
    List,
    TrendCharts,
    PieChart,
    CreditCard,
    Wallet,
    Setting,
    PriceTag, UserFilled
} from '@element-plus/icons-vue'
const iconStyle = {
    width: '24px',
    height: '18px',
    minWidth: '24px',
    display: 'inline-block',
    verticalAlign: 'middle',
}
export const basicMenu = [
    {
        path: "/home/dashboard",
        label: "首页",
        icon: () => h(Monitor, { style: iconStyle }),
    },

    {
        path: "/business/",
        label: "业务管理",
        icon: () => h(TrendCharts, { style: iconStyle }),
        children: [
            {
                path: "/business/transaction",
                label: "交易明细",
                icon: () => h(List, { style: iconStyle }),
            },
            {
                path: "/business/income",
                label: "收入记录",
                icon: () => h(TrendCharts, { style: iconStyle }),
            },
            {
                path: "/business/expenditure",
                label: "支出记录",
                icon: () => h(TrendCharts, { style: iconStyle }),
            },
            {
                path: "/business/transfer",
                label: "转账记录",
                icon: () => h(TrendCharts, { style: iconStyle }),
            },
        ],
    },

    {
        path: "/account",
        label: "账户管理",
        icon: () => h(CreditCard, { style: iconStyle }),
        children: [
            {
                path: "/account/manage",
                label: "账户数据",
                icon: () => h(CreditCard, { style: iconStyle }),
            },
            {
                path: "/account/budget",
                label: "预算管理",
                icon: () => h(CreditCard, { style: iconStyle }),
            },
            {
                path: "/account/goal",
                label: "目标储蓄",
                icon: () => h(CreditCard, { style: iconStyle }),
            },
        ],
    },
    {
        path: "/report",
        label: "统计报表",
        icon: () => h(PieChart, { style: iconStyle }),
        children: [
            {
                path: "/report/custom",
                label: "交易统计表",
                icon: () => h(CreditCard, { style: iconStyle }),
            },
            {
                path: "/report/category",
                label: "账目趋势表",
                icon: () => h(CreditCard, { style: iconStyle }),
            },
            {
                path: "/report/account",
                label: "账户趋势表",
                icon: () => h(CreditCard, { style: iconStyle }),
            },
            {
                path: "/report/budget",
                label: "预算趋势表",
                icon: () => h(CreditCard, { style: iconStyle }),
            },
        ],
    },
    {
        path: "/setting",
        label: "系统管理",
        icon: () => h(Setting, { style: iconStyle }),
        children: [
            {
                path: "/setting/accountType",
                label: "账户类型",
                icon: () => h(CreditCard, { style: iconStyle }),
            },
            {
                path: "/setting/account",
                label: "基础账户",
                icon: () => h(Wallet, { style: iconStyle }),
            },
            {
                path: "/setting/category",
                label: "基础账目",
                icon: () => h(PriceTag, { style: iconStyle }),
            },
            {
                path: "/setting/user",
                label: "用户列表",
                icon: () => h(UserFilled, { style: iconStyle }),
            },
            {
                path: "/setting/log",
                label: "操作日志",
                icon: () => h(UserFilled, { style: iconStyle }),
            },
            {
                path: "/setting/system",
                label: "系统设置",
                icon: () => h(Setting, { style: iconStyle }),
            },
        ],
    },
];

export const getMenu = (path) => {
    if(!path) return basicMenu
}