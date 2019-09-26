import {saveAs} from 'file-saver';

const rABS = typeof FileReader !== 'undefined' && FileReader.prototype && FileReader.prototype.readAsBinaryString;
const useWorker = typeof Worker !== 'undefined';

// 字符串转字符流
function string2ArrayBuffer(s) {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
  return buf;
}

// 将指定的自然数转换为26进制表示。映射关系：[0-25] -> [A-Z]。
function getCharCol(n) {
  let s = "",
      m = 0;
  while (n > 0) {
    m = n % 26 + 1;
    s = String.fromCharCode(m + 64) + s;
    n = (n - m) / 26
  }
  return s
}


const getExcelHeader = (data, headerData) => {
  const condition = headerData && headerData.length > 0;
  const header = condition ? headerData[0] : data[0];
  const headKeys = Object.keys(header);
  let keys = condition ? Object.values(header) : headKeys;
  const firstRow = keys.reduce((firstRow, item) => {
    firstRow[item] = item;
    return firstRow;
  }, {});
  return {
    headKeys,
    keys,
    firstRow
  };
};

/**
 *@description The method is to turn the random key back to the Chinese character
 *  React table render
 * @param v
 * @param header
 * @return {*}
 */
function clearDataForExcel(v, header) {
  const data = JSON.parse(JSON.stringify(v));
  return data.reduce((arr, item) => {
    let obj = {};
    Object.values(item).forEach((val, index) => {
      obj[header[index]] = val;
    });
    arr.push(obj);
    return arr;
  }, []);
}

const sheetValueType = {
  boolean: 'b',
  number: 'n',
  string: 's'
};

// 非英文 占2个字符
// const isCodeLength = (val) => {
//   const len = val.length;
//   const pattern = new RegExp("[A-Za-z]+");
//   return pattern.test(val) ? len : 2 * len
// };

// 非英文 占2个字符 获取字符长度
function getByteLength(str) {
  return str.split('').reduce(function (len, val) {
    if (val.match(/[^\x00-\xff]/ig) != null) {
      len += 2;
    } else {
      len += 1;
    }
    return len;
  }, 0)
}

/**
 *@description Set the automatic width width of Excel cells
 *设置Excel 单元格自适应宽度
 */
function setExcelColsWidth(array, headerKeys) {
  const ar = JSON.parse(JSON.stringify(array));
  return headerKeys.reduce((list, key) => {
    // 获取json 对象 每一个key最大值
    const val = ar.sort(function (a, b) {
      return b[key].toString().length - a[key].toString().length;
    })[0][key];

    let obj = {wch: getByteLength(val)};
    list.push(obj);
    return list;
  }, []);
}

function getFileNameAndType(str) {
  const index = str.lastIndexOf('.');
  const name = str.substring(0, index);
  const type = str.substr(index + 1);
  return {
    name,
    type
  }
}

export class EasyExcel {
  constructor(options) {
    this.fileName = '表格'; // 文件前缀
    this.fileType = 'xlsx'; // 文件类型
    this.sheetName = localStorage.getItem('EXCEL_SHEET_NAME') || ''; // 当前表名字
    this.lastWb = null;
  }

  uploadExcel(event) {
    return new Promise((resolve, reject) => {
      if (!rABS) {
        reject({type: '', txt: '当前浏览器 不支持 FileReader 对象 请用谷歌浏览器吧~'});
      }
      const files = event.target.files[0];
      const {name, type} = getFileNameAndType(files.name);
      this.fileName = name;
      localStorage.setItem('EXCEL_FILE_NAME', this.fileName);
      this.fileType = type;

      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        try {
          const {result} = e.target;
          // 二进制 读Excel
          const workbook = XLSX.read(result, {type: 'binary'});

          const data = this.getWorkBookAndHeader(workbook);
          resolve(data);

        } catch (e) {
          reject({type: 'error', txt: e});
        }

      };
      fileReader.readAsBinaryString(files);
    });
  }

  /**
   *@description 当前id 为 0 表示 第一张表
   *@reference https://blog.csdn.net/juzipidemimi/article/details/90815730
   */
  getWorkBookAndHeader(workbook, idx = 0) {
    const wb = workbook;
    this.lastWb = wb;
    this.lastWbByLocal({wb: this.lastWb, type: 'write'});

    const sheetName = wb.SheetNames[idx]; // 表名
    this.sheetName = sheetName;

    localStorage.setItem('EXCEL_SHEET_NAME', this.sheetName);

    const workSheet = wb.Sheets; // 所有表
    const ws = workSheet[sheetName]; // id -> 对应的表 默认第一张
    const range = XLSX.utils.decode_range(ws['!ref']); // ws['!ref'] 为单元格范围

    // excel表头 => Ant Design column
    let columns = [], keyHeader = [];
    for (let c = 0; c <= range.e.c; c++) {
      let obj = {};
      const sheetCode = XLSX.utils.encode_col(c) + '1';
      const header = ws[sheetCode].v;
      obj.title = header;
      const keyVal = Math.random().toString(36).substr(2, 4);
      obj.dataIndex = obj.key = keyVal; // 表头 key 名称 翻译为拼音字母
      columns.push(obj);
      keyHeader.push(obj.key);
    }

    const json = this.toJson(wb, keyHeader)[sheetName];
    return {
      columns,
      json,
    };
  };

  /**
   *@description excel -> Json
   */
  toJson(workbook, header) {
    if (useWorker && workbook.SSF) {
      XLSX.SSF.load_table(workbook.SSF);
    }

    let result = {};
    workbook.SheetNames.forEach(function (sheetName) {
      const roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        raw: false,
        defval: '',
        header
      });
      if (roa.length > 0) {
        result[sheetName] = roa;
      }
    });
    return result;
  };


  lastWbByLocal({wb, type}) {
    if (type === 'write') {
      const file = XLSX.write(wb, {bookType: 'xlsx', bookSST: false, type: "binary"});
      localStorage.setItem('EXCEL_LAST_WB', file);
    } else if (type === 'read') {
      const wb = localStorage.getItem('EXCEL_LAST_WB');
      const file = XLSX.read(wb, {type: 'binary'});
      return file
    }
  };

  /**
   *@description download
   */
  download(val, headerTable) {
    const data = val;
    const {firstRow, headKeys, keys} = getExcelHeader(val, headerTable);
    const newData = clearDataForExcel(data, keys);
    const dataForCols = headerTable.concat(data);

    const cols = setExcelColsWidth(dataForCols, headKeys);
    if (headerTable) {
      newData.unshift(firstRow);
    }
    const content = {};
    // 把json格式的数据转为excel的行列形式
    const sheetsData = newData.map(function (item, rowIndex) {
      return keys.map(function (key, columnIndex) {
        return Object.assign({}, {
          value: item[key],
          position: (columnIndex > 25 ? getCharCol(columnIndex) : String.fromCharCode(65 + columnIndex)) + (rowIndex + 1),
        });
      });
    }).reduce(function (prev, next) {
      return prev.concat(next);
    });

    sheetsData.forEach(function (item) {
      content[item.position] = {v: item.value, t: sheetValueType[typeof item.value]};
    });

    const workBook = this.lastWb || this.lastWbByLocal({type: 'read'});
    const fileName = localStorage.getItem('EXCEL_FILE_NAME') || this.fileName;

    const oldSheets = workBook.Sheets[this.sheetName]; // 当前表 Excel 导入的时候 获得的属性和数据

    const beforeSheets = {
      '!autofilter': oldSheets['!autofilter'],
      '!margins': oldSheets['!margins'],
      '!ref': oldSheets['!ref'],
      '!objects': oldSheets['!objects'],
      '!rows': oldSheets['!rows']
    };
    workBook.Sheets[this.sheetName] = {...beforeSheets, ...content, ...{'!cols': cols}};

    //这里的数据是用来定义导出的格式类型
    const excelData = XLSX.write(workBook, {bookType: 'xlsx', bookSST: false, type: "binary"});

    const blob = new Blob([string2ArrayBuffer(excelData)], {type: ""});
    // saveAs(blob, this.fileName + '.' + this.fileType); // xls 文件 意外报错 默认 xlsx 吧
    saveAs(blob, fileName + '.xlsx');


  }
}
