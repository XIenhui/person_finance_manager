import {error} from "#utils/response.js";

/**
 * 将扁平数组转换为树形结构
 * @param {Array} items 分类项数组
 * @param id_name ID属性名
 * @param {string} parent_name 父ID属性名
 * @param {Number|null} rootParentId 根ID
 * @returns {Array} 树形结构
 */
export function buildTree(items, id_name = 'id', parent_name = 'parent_id', rootParentId = null) {
    const itemMap = new Map();
    const tree = [];
    const filterItems = items.filter(item => !!item[id_name])
    for (const item of filterItems) {
        itemMap.set(item[id_name], { ...item, children: [] });
    }
    try {
        for (const item of filterItems) {
            const id = item[id_name];
            const parentId = item[parent_name];
            const treeItem = itemMap.get(id);

            if (parentId === rootParentId || parentId == null) tree.push(treeItem);
            else {
                const parentItem = itemMap.get(parentId);
                if (parentItem) {
                    parentItem.children.push(treeItem);
                } else {

                }
            }
        }
    } catch (error) {
        throw error
    }
    return tree;
}


/**
 * 生成分类完整路径名称
 * @param {Array} items 分类项数组
 * @param {Object} category 当前分类
 * @param {String} separator 分隔符
 * @returns {String} 完整路径名称
 */
export function getFullCategoryName(items, category, separator = ' > ') {
    if (!category.parent_id) {
        return category.name;
    }

    const parent = items.find(item => item.id === category.parent_id);
    if (!parent) {
        return category.name;
    }

    return `${getFullCategoryName(items, parent, separator)}${separator}${category.name}`;
}