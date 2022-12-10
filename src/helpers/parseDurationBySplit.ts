export function parseDurationBySplit(number, split = ',') {
  const str = number.toString();
  const len = str.length;
  if (len < 4) {
    return str;
  }
  const n = Math.ceil(len / 3);
  const arr = new Array(n);
  for(let i = n - 1; i >= 0; i-- ) {
    let cur = len - (n - i) * 3;
    let step = 3;
    if (cur < 0) {
      cur = 0;
      step = len % 3;
    }
    arr[i] = str.slice(cur, cur + step);
  }
  return arr.join(split);
}
