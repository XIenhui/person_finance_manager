import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import duration from 'dayjs/plugin/duration';

// 扩展插件
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(duration);

// 添加日期范围验证函数
export function isDateBetween(date, start, end) {
  const day = dayjs(date);
  return day.isSameOrAfter(start) && day.isSameOrBefore(end);
}

// 默认格式化字符串
const DEFAULT_FORMAT = 'YYYY-MM-DD HH:mm:ss';

/**
 * 格式化日期
 * @param {Date|String|Number} date - 需要格式化的日期
 * @param {String} format - 格式字符串，默认为 'YYYY-MM-DD'
 * @returns {String} 格式化后的日期字符串
 */
export function formatDate(date: any, format = DEFAULT_FORMAT) {
  return dayjs(date).format(format);
}

export function formatDateDay(date: any, format = 'YYYY-MM-DD') {
  return dayjs(date).format(format);
}

export function formatDateMonth(date: any, format = 'YYYY-MM') {
  return dayjs(date).format(format);
}

export function formatDateYear(date: any, format = 'YYYY') {
  return dayjs(date).format(format);
}
/**
 * 获取当前日期
 * @param {String} format - 格式字符串，默认为 'YYYY-MM-DD'
 * @returns {String} 格式化后的当前日期
 */
export function getCurrentDate(format = DEFAULT_FORMAT) {
  return dayjs().format(format);
}

/**
 * 获取日期范围
 * @param {Number} days - 天数
 * @param {String} format - 格式字符串
 * @returns {Array} 包含开始和结束日期的数组
 */
export function getDateRange(days: number, format = DEFAULT_FORMAT) {
  const end = dayjs();
  const start = end.subtract(days, 'day');
  return [start.format(format), end.format(format)];
}

export default dayjs;
