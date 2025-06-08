/**
 * 将扁平数组转换为树形结构
 * @param {Array} items 分类项数组
 * @param {Number|null} parentId 父ID
 * @returns {Array} 树形结构
 */
export function buildTree(items, parentId = null) {
    return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
            ...item,
            children: buildTree(items, item.id)
        }));
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