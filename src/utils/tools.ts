
/**
 * 从数组中移除指定值
 * @param array 数组
 * @param value 值
 * @returns 移除后的数组
 */
export function removeFromArray(array: any[], value: any) {
  var idx = array.indexOf(value);
  if (idx !== -1) {
    array.splice(idx, 1);
  }
  return array;
};