<template>
  <div class="page-wrapper">
    <!-- 筛选条件 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters" label-width="80px">
        <el-form-item label="类型">
          <el-select v-model="filters.type" clearable placeholder="全部">
            <el-option label="收入" value="income" />
            <el-option label="支出" value="expenditure" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="filters.category" clearable placeholder="全部">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 交易明细表格 -->
    <el-card class="table-card" shadow="never" style="margin-top: 20px;">
      <el-table :data="tableData" stripe border style="width: 100%;">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="type" label="类型" width="80" />
        <el-table-column prop="category" label="分类" />
        <el-table-column prop="amount" label="金额" width="120" />
        <el-table-column prop="account" label="账户" width="120" />
        <el-table-column prop="note" label="备注" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
            background
            layout="prev, pager, next"
            :total="total"
            :page-size="pageSize"
            @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

// 模拟分类
const categories = ["工资", "奖金", "餐饮", "购物", "交通", "房租"];

const filters = reactive({
  type: "",
  category: "",
  dateRange: []
});

const tableData = ref([]);
const total = ref(0);
const pageSize = 10;
const currentPage = ref(1);

// 模拟获取数据
const fetchData = () => {
  // 假设这是调用 API 后的数据
  tableData.value = [
    {
      id: 1,
      date: "2025-05-29",
      type: "支出",
      category: "购物",
      amount: "-200",
      account: "支付宝",
      note: "买衣服"
    },
    {
      id: 2,
      date: "2025-05-28",
      type: "收入",
      category: "工资",
      amount: "+5000",
      account: "银行卡",
      note: "5月工资"
    }
  ];
  total.value = 2;
};

const resetFilters = () => {
  filters.type = "";
  filters.category = "";
  filters.dateRange = [];
  fetchData();
};

const handlePageChange = (page) => {
  currentPage.value = page;
  fetchData();
};

const handleEdit = (row) => {
  ElMessage.info(`准备编辑记录 ID=${row.id}`);
  // 可跳转或打开弹窗编辑页面
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确认删除该交易记录？`, "提示", {
    type: "warning"
  })
      .then(() => {
        ElMessage.success("删除成功（模拟）");
        // 实际删除操作
      })
      .catch(() => {});
};

// 初次加载
fetchData();
</script>

<style scoped>
.page-wrapper {
  padding: 20px;
}

.filter-card {
  padding-bottom: 10px;
}

.table-card {
  margin-top: 20px;
}

.pagination-wrapper {
  text-align: right;
  margin-top: 20px;
}
</style>
