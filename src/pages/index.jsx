import React, {Fragment, Component} from 'react'
import enhance from '@/vendors/enhance.js';
import {EasyExcel} from '../vendors/Excel';
import {PageHeader, Table, Popconfirm, Button, Icon} from 'antd';
import {EditableFormTable} from '../components/ExcelTable';


@enhance
class Index extends Component {
  state = {
    loading: false,
    dataSource: [],  // antD Table 数据
    column: [] // antD Table 表头
  };
  easyExcel = null;
  headerTable = null;


  setLoading = (val) => {
    this.setState({loading: val});
  };

  importFile = async (event) => {
    this.setLoading(true);
    try {
      const data = await this.easyExcel.uploadExcel(event);
      this.handleDataForTable(data);
    } catch (e) {
      const {type, txt} = e;
      if (type) {
        this.error('文件格式有误');
        console.log('uploadExcel----error:', e);
      } else {
        this.error(txt);
      }
      this.setLoading(false);
    }
  };

  /**
   * @description 清洗数据 提供给Table组件
   * @param json
   * @param columns
   */
  handleDataForTable = (data) => {
    const dataSource = JSON.parse(JSON.stringify(data.json));
    this.headerTable = dataSource.splice(0, 1);
    localStorage.setItem('EXCEL_HEADER', JSON.stringify(this.headerTable));
    const columns = data.columns;
    this.setState({
      dataSource,
      columns,
      loading: false
    }, () => {
      this.success('上传成功！');
      this.setDataAndSaveLocal({data: dataSource, columns});
      // this.saveEasyExcel();
    });
  };

  handleRemove = () => {
    this.setState({dataSource: [], columns: []}, () => {
      this.removeAllLocalData();
    });
  };

  downLoadExcel = () => {
    const header = this.headerTable;
    this.easyExcel.download(this.state.data, header);
  };

  // SET localStorage
  setDataAndSaveLocal = (obj) => {
    this.setState(obj, () => {
      const {data, columns} = obj;
      localStorage.setItem('EXCEL_DATA', JSON.stringify(data));
      if (columns && columns.length > 0) {
        localStorage.setItem('EXCEL_COLUMNS', JSON.stringify(columns));
      }
    });
  };

  removeAllLocalData = () => {
    localStorage.clear();
  };

  /**
   *@description 初始化数据
   */
  initTableByLocalData = () => {
    const dataSource = localStorage.getItem('EXCEL_DATA');
    const col = localStorage.getItem('EXCEL_COLUMNS');
    const headerTable = JSON.parse(localStorage.getItem('EXCEL_HEADER'));
    if (!dataSource || !col) {
      console.log('no localStorage Data');
      return
    }
    const data = JSON.parse(dataSource);
    const columns = JSON.parse(col);
    this.setDataAndSaveLocal({data, columns});
    this.headerTable = headerTable;
  };

  /**
   *@description save Class instance you should save instance option.
   * And new Again  not only save instance because It doesn't have a pointer to the class.
   * It is only a object;
   */
  saveEasyExcel = () => {
    if (!localStorage.getItem('EASY_EXCEL_OPTION')) {
      const option = JSON.stringify(this.easyExcel);
      localStorage.setItem('EASY_EXCEL_OPTION', option);
    }
  };

  render() {
    const {data, columns} = this.state;
    const conditions = columns && columns.length > 0;
    const key = conditions ? columns[0].key : 'key';

    return (
        <Fragment>
          <PageHeader
              title="Excel Online Editor"
              avatar={{src: 'https://avatars1.githubusercontent.com/u/8186664?s=460&v=4'}}>
            {
              conditions ? <div className="remove">
                <Popconfirm
                    title="是否确定重新上传Excel?(Are you sure Upload again)"
                    onConfirm={this.handleRemove}
                    okText="Ok"
                    cancelText="Cancel">
                  <a href="#">重新上传</a>
                </Popconfirm>
              </div> : <Button type="primary"
                               className="relative"
                               loading={this.state.loading}
                               style={{'float': 'right'}}>
                <span className="upload-text">上传Excel</span>
                <input type='file'
                       ref="file"
                       className="file-uploader"
                       accept='.xlsx, .xls'
                       onChange={this.importFile}/>
                <Icon type='upload'/>
              </Button>
            }

          </PageHeader>
          {
            conditions ? <EditableFormTable dataSource={data}
                                            setDataAndSaveLocal={this.setDataAndSaveLocal}
                                            download={this.downLoadExcel}
                                            columns={columns}
                                            rowKey={key}/> : <Table/>
          }
        </Fragment>
    )
  }

  componentDidMount() {
    this.easyExcel = new EasyExcel();
    this.initTableByLocalData();
  }

  componentWillUnmount() {
    this.easyExcel = null;
  }
}

export default Index;
