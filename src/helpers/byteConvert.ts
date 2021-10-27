export function byteConvert(bytes) {
  if (isNaN(bytes)) {
    return '';
  }

  // 在这里定义了常用的字节，字节、千字节、兆字节、吉字节、太字节、拍字节、艾字节、Z字节、Y字节
  const symbols = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let exp = Math.floor(Math.log(Math.abs(bytes)) / Math.log(2));

  if (exp < 1) {
    exp = 0;
  }

  const i = Math.floor(exp / 10);

  bytes /= Math.pow(2, 10 * i);

  if (bytes.toString().length > bytes.toFixed(2).toString().length) {
    bytes = bytes.toFixed(2);
  }

  return bytes + ' ' + symbols[i];
}
