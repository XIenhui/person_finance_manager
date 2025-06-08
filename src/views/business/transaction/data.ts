export const columns = [
    {
        title: '交易编号',
        dataIndex: 'id',
        key: 'id',
        width: 100,
        slots: { customRender: 'id' }
    },
    {
        title: '交易时间',
        dataIndex: 'date',
        key: 'date',
        width: 150,
        slots: { customRender: 'date' }
    },
    {
        title: '账户',
        key: 'account',
        width: 180,
        slots: { customRender: 'account' }
    },
    {
        title: '账目',
        key: 'category',
        width: 150,
        slots: { customRender: 'category' }
    },
    {
        title: '金额',
        dataIndex: 'amount',
        key: 'amount',
        width: 120,
        align: 'right',
        slots: { customRender: 'amount' }
    },
    {
        title: '备注',
        key: 'note',
        slots: { customRender: 'note' }
    },
    {
        title: '操作',
        key: 'action',
        width: 150,
        slots: { customRender: 'action' }
    }
]

export const rowKey = (record:any) => `${record.id}-${record.amount}`