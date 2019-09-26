### Excel Online Editor
> 当你凝视着深渊的时候，深渊也在凝视着你，当你在玩框架的时候，框架也在玩你

#### 项目描述
```txt
一款纯html在线 Excel 编辑器 支持 上传 下载 编辑 查找 删除 重刷新  
缺限：
1.当前只支持单张Excel表
2.Excel样式问题
3.数据量大 建议少开浏览器窗口

谷歌浏览器使用体验更好
``` 

#### 构建
``` bash
# install node+git please

# install dependencies
$ npm install / cnpm install

# serve with hot reload at localhost:8080/happy-wind/excel
$ npm run dev

# build for production with minification
$ npm run build
```

#### 小结
```
1.说实话如果让我重新选UI 我肯定不会选antDesign 虽然他足够优秀 但是我只是想做个Table - -
2.写了Excel类 里面有上传 和下载 Excel的功能。学习了xlsx 框架 这真的是一个很好的框架 点赞！ 就是API太多
3.说说主要遇到的问题：
a.读取Excel后 如何转为 antD Table 需要的数据格式 （真的被框架玩了）  
首先上传完Excel；const workbook = XLSX.read(result, {type: 'binary'}) 拿到Excel Object  
其次对workbook做处理把其转成antDesign Tabel 需要的数据，取表的表头 转化为 Table需要的columns
这里的key 我用随机字母+数字做的。为了就是React 的key；也就是每一个vnode的唯一id，用字母当然会比汉字当key更友好  
紧接着就是 处理json数据 这里注意一个配置 XLSX.utils.sheet_to_json(wb, {raw: false,defval: '',header});  
defval当有空单元格时候，默认一个空；这个很关键。而header 就是我们需要设置表头的key
b.下载 + 重刷新：
这里用到的就是本地存储localStorage，但是注意的是 当我每次增删改查时候 存储的表格data 所以当你重刷新 再点下载时候 你需要本地取出Excel;  
我一开始思路就是直接存储 第一次读到的EXCEL对象 但是当你用JSON.parse(JSON.stringify(workbook))时候 重新取出序列化就会有问题 因为Excel有自己定义的数据类型  
所以直接上传完Excel 存储时候 用XLSX.write 存入一个string 当页面刷新 再拿出来XLSX.read 重新读成Excel；  
本项目还可以优化 本地存储Excel类的options，这样Excel内部就不要写那么多冗余的localStorage 但切记别直接存储类的实例 因为你存储的只是一个object 缺失了指向类的指针哦
c.自适应单元格宽度（automatic cell width）：
这个网上很多人都在问，我写了一个方法去做

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
参数：表格数组对象，汉话后的表头 去找每一个属性 就相当于Excel 每一列最大的那个长度值 作为单元格宽度。因为Excel 是行列形式 对应的就是数组对象的key value
getByteLength 是判断字符串字节长度 汉字为2 字母为1
4.剩下问题就多看看XLSX文档了 还是那句如果再写 我肯定不会选antDesigin. 框架的确会玩死你- -
```


#### 初衷
```txt
技术总是辅佐业务，不然就是一盘散沙 有人提需求 那就要做啦！！！其实就是从别人提出问题我总结出来。  
应该是需要一个在线编辑Excel的需求！纯前端做，其实最好这种Excel还是后端解析 或者用node更好。
```