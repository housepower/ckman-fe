import { getIPRange } from 'get-ip-range';

export function lineFeed(str: string) {
  console.log(str)
  str = str.replace(/\r\n/g, '');
  str = str.replace(/\n/g, '');
  const isDotEnd = str.endsWith(',');
  const ipList = str.split(',');
  return isDotEnd ? ipList.slice(0, ipList.length - 1) : ipList;
}

export function getCirdOrRangeIps(arr: string[]) {
  let endArr = [];
  arr.forEach(item => {
    if (item.startsWith('CIRD')) {
      const ipv4CIDR = getIPRange(item.slice(5, item.length - 1));
      endArr = endArr.concat(ipv4CIDR);
    } else if (item.includes('-')) {
      const ipv4Range = getIPRange(item);
      endArr = endArr.concat(ipv4Range);
    } else {
      endArr.push(item);
    }
  });
  return [...new Set(endArr)];
}
