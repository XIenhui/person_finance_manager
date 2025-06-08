<template>
  <el-table class="com-table" v-bind="attrs">
    <el-table-column
        v-for="column in columns"
        :key="column.key"
        :label="column.title"
        :width="column.width"
        :prop="column.dataIndex"
        :fixed="column.fixed ? column.fixed : false"
        :attrs="column.attrs"
    >
      <template #default="scope">
        <slot v-if="column.slots?.customRender" :name="column.slots.customRender" :scope="scope">
          <component
              v-if="column.customRender"
              :is="customRenderAdaptor(column.customRender, scope, column)"
          />
        </slot>
      </template>
    </el-table-column>
  </el-table>
</template>
<script>
  import {ref, defineComponent, h} from 'vue';
  export default defineComponent({
    name: 'BasicTable.vue',
    props: {
      columns: {
        type: Array,
        default: () => [],
      },
      attrs: {
        type: Object,
        default: () => {},
      }
    },
    setup() {
      const tableRef = ref();
      const customRenderAdaptor = (render, scope, column) => {
        const r = render({
          column: scope.column,
          record: scope.row,
          text: scope.row[column.dataIndex],
          index: scope.$index
        })
        return h('div', r.attrs, r.children);
      }
      return {
        tableRef,
        customRenderAdaptor,
      };
    },
  });
</script>
<style scoped>

</style>
