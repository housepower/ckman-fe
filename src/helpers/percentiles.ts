export function percentiles(num) {
    if (isNaN(num)) {
      return '';
    }
  
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); // 加入数字千分位分隔符
  }
  