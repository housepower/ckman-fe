
import { get, isEqual } from 'lodash-es';

function isEmptyObj(obj){
  if(Object.keys(obj).length === 0){
    return !0;
  }else{
    return !1;
  }
}

/**
 * param [object] 等价于with对象，不能为undefined
 * global [object] 函数块中this对象，默认是param
 * func [function | string] 等价于with代码块
 */
export function catWith( param, func, global ){
  if( !param ) return;
  if( typeof(global) == 'function' ){
    func = global;
    global = param;
  }

  // 动态生成 变量声明代码。  _$_$_bugcat_with 是param的形参名，为了避免命名冲突，故意写得很奇葩，越奇葩越好，冲突的概率越小
  let head = '"use strict";'; let foot = ';';
  // eslint-disable-next-line guard-for-in
  for(const key in param){
    head = head + 'var ' + key + ' = _$_$_bugcat_with["' + key + '"];';
    foot = foot + '_$_$_bugcat_with["' + key + '"] = ' + key + ';';
  }

  head = head + 'var $$set = function(key, value){_$_$_bugcat_with[key]=value;};'; // 添加内置方法 $$set，在函数块中给param赋值
  head = head + 'try { ';
  foot = '} finally {' + foot + '}';

  let funStr = '';
  if( typeof(func) === 'string' ){

    // 如果是字符串，直接使用
    funStr = func;

  } else {

    // 将with代码块转换成字符串，只保留代码块，去掉多余的字符"function(){}"
    funStr = func.toString();
    const start = funStr.indexOf('{') + 1; const last = funStr.lastIndexOf('}');
    funStr = funStr.substring(start, last);

  }

  // 在代码块的前后追加代码声明（mark1），和变量赋值（mark2），生成新的函数。函数的this指向param！！
  // console.log('_$_$_bugcat_with', head + funStr + foot);
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const nf = new Function('_$_$_bugcat_with', head + funStr + foot).bind(global);
  // 执行代码块并且返回结果
  return nf(param);
}

export function getDefaultFormData(formModel, schema) {
  const formData = {};

  function cacadeFormat(formData, schema, prev) {
    Object.entries(schema).forEach(([name, config]) => {
      const { type, default: value } = config;
      // 对默认值格式进行转换
      let defaultValue = null;
      if (typeof value !== 'undefined' && value != null) {
        switch(type) {
          case 'string':
            defaultValue = String(value);
            break;
          case 'int':
          case 'float':
            defaultValue = Number(value);
            break;
        }
      }
      const propsName = prev ? `${prev}.${name}` : name;
      const fieldValue = get(formModel, propsName);
      switch(type) {
        case 'struct':
          formData[name] = fieldValue || {};
          cacadeFormat(formData[name], config.struct, propsName);
          break;
        case 'list':
          formData[name] = fieldValue || [];
          break;
        case 'list-struct':
          formData[name] = fieldValue || [];
          break;
        case 'list-string':
          formData[name] = fieldValue || [];
          break;
        case 'map':
          formData[name] = fieldValue || {};
          break;
        case 'map-struct':
          formData[name] = fieldValue || {};
          break;
        default:
          formData[name] = fieldValue || defaultValue;
      }
    })
  }
  cacadeFormat(formData, schema, '');
  // console.log(formData);
  return formData;
}

/**
 * 精简字段值，保留用户输入的值，required的默认值，清除空值、visible=false的字段
 * @param {*} data 
 * @returns 
 */
export function getPostData(formModel, schema) {
  const formData = {};

  function cacadeFormat(formData, schema, prev) {
    Object.entries(schema).forEach(([name, config]) => {
      const { type, default: value } = config;

      // 对默认值格式进行转换
      let defaultValue = null;
      if (typeof value !== 'undefined' && value != null) {
        switch(type) {
          case 'string':
            defaultValue = String(value);
            break;
          case 'int':
          case 'float':
            defaultValue = Number(value);
            break;
        }
      }

      const propsName = prev ? `${prev}.${name}` : name;
      const fieldValue = get(formModel, propsName);
      console.log(propsName, fieldValue);

      if (typeof fieldValue === 'undefined' || fieldValue === null || fieldValue === '') {
        delete formData[name];
        return;
      }
      switch(type) {
        case 'struct':
          formData[name] = fieldValue || {};
          cacadeFormat(formData[name], config.struct, propsName);
          if (isEqual(formData[name], {})) {
            delete formData[name];
          }
          break;
        case 'list-struct':
          if (fieldValue) {
            fieldValue.forEach(x => delete x.$$id);
          }
          formData[name] = fieldValue || [];
          formData[name].forEach((x, index) => {
            cacadeFormat(x, config.struct, propsName + '.' + index);
            if (isEqual(x, {})) {
              delete formData[name][index];
            }
          });
          formData[name] = formData[name].filter(x => x);
          if (isEqual(formData[name], [])) {
            delete formData[name];
          }
          break;
        case 'list-string':
          formData[name] = fieldValue || [];
          if (isEqual(formData[name], [])) {
            delete formData[name];
          }
          break;
        case 'map':
          formData[name] = fieldValue || {};
          if (isEqual(formData[name], {})) {
            delete formData[name];
          }
          break;
        default:
          formData[name] = fieldValue || defaultValue;
      }
    })
  }
  cacadeFormat(formData, schema, '');
  // console.log(formData);
  return formData;
}

/**
 * 递归对字段进行校验
 * @param {*} data 
 * @returns 
 */
export function cascadeValidate(formModel, schema) {
  const value = getPostData(formModel, schema);

  return value;
}
/**
 * 将字段进行排序
 */
export function sourceDataSort(data) {
  const startData = data.filter(ele => !ele.required).sort((a,b) => a.label.localeCompare(b.label));
  const endData = data.filter(ele => ele.required);
  return [...startData, ...endData];
}