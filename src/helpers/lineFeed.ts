import { getIPRange } from 'get-ip-range';

export function lineFeed(str: string) {
  str = str.replace(/\r\n/g, '');
  str = str.replace(/\n/g, '');
  const isDotEnd = str.endsWith(',');
  const ipList = str.split(',');
  return isDotEnd ? ipList.slice(0, ipList.length - 1) : ipList;
}

export function getCirdOrRangeIps(arr: string[]) {
  let endArr = [];
  arr.forEach(item => {
    if (item.includes('/') || item.includes('-')) {
      const ipv4CIDR = getIPRange(item);
      endArr = endArr.concat(ipv4CIDR);
    } else {
      endArr.push(item);
    }
  });
  return [...new Set(endArr)];
}
