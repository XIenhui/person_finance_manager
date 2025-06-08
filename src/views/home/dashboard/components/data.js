export const defaultSearch = {
    business_ids: [''],
    page: 1,
}
export const defaultUpdate = {
    business_id: '',
    extented_info: '',
}
export const detailData = {
    basic: {
        index_id: {
            label: '索引号',
            value: 'index_id',
        },
        business_data_id: {
            label: '业务数据ID',
            value: 'business_data_id'
        },
        source_enterprise_name: {
            label: '源企业ID',
            value: 'source_enterprise_name'
        },
        dest_enterprise_name: {
            label: '目的企业ID',
            value: 'dest_enterprise_name'
        },
        ip_addrss_type: {
            label: 'IP地址类型',
            value: 'ip_addrss_type'
        },
        source_enterprise_ip: {
            label: '源企业IP',
            value: 'source_enterprise_ip'
        },
        destination_enterprise_ip: {
            label: '目的企业IP',
            value: 'destination_enterprise_ip'
        },
        source_business_data_id: {
            label: '源业务数据ID',
            value: 'source_business_data_id'
        },
        label_version: {
            label: '标签版本号',
            value: 'label_version'
        },
        label_create_time: {
            label: '标签生产时间',
            value: 'label_create_time'
        },
        transmission_or_not: {
            label: '是否已传输',
            value: 'transmission_or_not'
        },
    },
    manage: {
        reporting_party: {
            label: '报备方',
            value: 'reporting_party'
        },
        reporting_person_in_charge: {
            label: '报备方负责人',
            value: 'reporting_person_in_charge'
        },
        declaration_region: {
            label: '申报地区',
            value: 'declaration_region'
        },
        reporting_time: {
            label: '报备时间',
            value: 'reporting_time'
        },
        auditing_party: {
            label: '审核方',
            value: 'auditing_party'
        },
        auditing_person_in_charge: {
            label: '审核方负责人',
            value: 'auditing_person_in_charge'
        },
        auditing_time: {
            label: '审核时间',
            value: 'auditing_time'
        },
        domestic_system_name: {
            label: '境内信息系统名称',
            value: 'domestic_system_name'
        },
        domestic_system_type: {
            label: '境内信息系统类型',
            value: 'domestic_system_type'
        },
    },
    crossBorder: {
        data_exit_time: {
            label: '数据备案出口时间',
            value: 'data_exit_time'
        },
        business_data_type: {
            label: '业务数据类型',
            value: 'business_data_type'
        },
        data_export_mode: {
            label: '数据出境模式',
            value: 'data_export_mode'
        },
        data_sensitivity_level: {
            label: '数据敏感等级',
            value: 'data_sensitivity_level',
            editable: true,
        },
        validity_period: {
            label: '时效',
            value: 'validity_period',
            editable: true,
        },
        data_type: {
            label: '数据类型',
            value: 'data_type',
        },
        data_subtype: {
            label: '数据子类型',
            value: 'data_subtype'
        },
        data_encoding_type: {
            label: '数据编码类型',
            value: 'data_encoding_type',
            detailed: true,
        },
        data_scale: {
            label: '数据规模',
            value: 'data_scale'
        },
        data_sources: {
            label: '数据来源',
            value: 'data_sources'
        },
        data_protectin_status: {
            label: '数据保护情况',
            value: 'data_protectin_status'
        },
        data_plaintext_summary: {
            label: '数据明文摘要',
            value: 'data_plaintext_summary'
        },
        data_export_agreement: {
            label: '数据备案出境协议',
            value: 'data_export_agreement'
        },
    },
    extend: {
        extented_info: {
            label: '备注',
            value: 'extented_info'
        }
    }
}