import React, {Component} from 'react';
import {Table, Input, Popconfirm, Form, Icon, Button} from 'antd';
import Highlighter from 'react-highlight-words';
import PropTypes from 'prop-types';

const EditableContext = React.createContext();

class EditableCell extends Component {

  renderCell = ({getFieldDecorator}) => {
    const {
      editing,
      dataIndex,
      record,
      children,
      ...restProps
    } = this.props;
    return (
        <td {...restProps}>
          {editing ? (
              <Form.Item style={{margin: 0}}>
                {getFieldDecorator(dataIndex, {
                  initialValue: record[dataIndex],
                })(<Input/>)}
              </Form.Item>
          ) : (
              children
          )}
        </td>
    );
  };

  render() {
    return <EditableContext.Consumer>{this.renderCell}</EditableContext.Consumer>;
  }
}

class EditableTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editingKey: '',
      searchText: ''
    };
  }

  columns = [];

  components = {
    body: {
      cell: EditableCell,
    },
  };

  static propTypes = {
    dataSource: PropTypes.array,
    columns: PropTypes.array,
    rowKey: PropTypes.string,
    download: PropTypes.func,
    headerTable: PropTypes.array
  };

  isEditing = record => record[this.props.rowKey] === this.state.editingKey;

  cancel = () => {
    this.setState({editingKey: ''});
  };

  edit(key) {
    this.setState({editingKey: key});
  }

  save(form, key) {
    form.validateFields((error, row) => {
      if (error) {
        return;
      }
      const newData = [...this.props.dataSource];
      const index = newData.findIndex(item => key === item[this.props.rowKey]);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, {
          ...item,
          ...row,
        });
      } else {
        newData.push(row);
      }
      this.props.setDataAndSaveLocal({data: newData});
      this.setState({editingKey: ''});
    });
  }

  onDelete(index) {
    const data = [...this.props.dataSource];
    data.splice(index, 1);
    this.props.setDataAndSaveLocal({data})
  }

  /**
   *@description 搜索Props
   */
  getColumnSearchProps = (dataIndex, title) => ({
    filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters}) => (
        <div style={{padding: 8}}>
          <Input
              ref={node => {
                this.searchInput = node;
              }}
              placeholder={`Search ${title}`}
              value={selectedKeys[0]}
              onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              onPressEnter={() => this.handleSearch(selectedKeys, confirm)}
              style={{width: 188, marginBottom: 8, display: 'block'}}
          />
          <Button
              type="primary"
              onClick={() => this.handleSearch(selectedKeys, confirm)}
              icon="search"
              size="small"
              style={{width: 90, marginRight: 8}}>搜索
          </Button>
          <Button onClick={() => this.handleReset(clearFilters)} size="small" style={{width: 90}}>
            重置
          </Button>
        </div>
    ),
    filterIcon: filtered => (
        <Icon type="search" style={{color: filtered ? '#1890ff' : undefined}}/>
    ),
    onFilter: (value, record) => {
      if (!record[dataIndex]) {
        return ''
      } else {
        return record[dataIndex]
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase())
      }
    },
    onFilterDropdownVisibleChange: visible => {
      if (visible) {
        setTimeout(() => this.searchInput.select());
      }
    },
    render: text => {
      return (
          <Highlighter
              highlightStyle={{backgroundColor: '#ffc069', padding: 0}}
              searchWords={[this.state.searchText]}
              autoEscape
              textToHighlight={text ? text.toString() : ''}/>
      )
    },
  });

  handleSearch = (selectedKeys, confirm) => {
    confirm();
    this.setState({searchText: selectedKeys[0]});
  };

  handleReset = clearFilters => {
    clearFilters();
    this.setState({searchText: ''});
  };

  /**
   *@description 拓展 columns for antDesign
   */
  editColumn = (val) => {
    const columns = val;
    const operation = {
      title: 'Action',
      dataIndex: 'Action',
      width: 100,
      fixed: 'right',
      render: (text, record, index) => {
        const {editingKey} = this.state;
        const editable = this.isEditing(record);
        return editable ? (
            <span>
              <EditableContext.Consumer>
                {form => (
                    <a onClick={() => this.save(form, record[this.props.rowKey])}
                       style={{marginRight: 8}}>保存</a>
                )}
              </EditableContext.Consumer>
                <a onClick={() => this.cancel(record[this.props.rowKey])}>取消</a>
            </span>
        ) : (
            <span>
                  <a disabled={editingKey !== ''} onClick={() => this.edit(record[this.props.rowKey])}>编辑</a>
                 <Popconfirm title="删除不可恢复，你确定要删除吗?" onConfirm={this.onDelete.bind(this, index)}>
                                <a title="删除" style={{marginLeft: 10}}>删除</a>
                     </Popconfirm>
              </span>
        );
      },
    };
    const searchFunc = (key, title) => this.getColumnSearchProps(key, title);
    const newColumns = columns.reduce((total, item) => {
      let obj = {
        ...item, editable: true, ...searchFunc(item.key, item.title), onCell: record => {
          return {
            record,
            dataIndex: item.dataIndex,
            title: item.title,
            editing: this.isEditing(record),
          }
        }
      };
      total.push(obj);
      return total
    }, []);
    newColumns.push(operation);
    return newColumns;
  };

  tableChange = (pagination, filters, sorter) => {
    console.log('filters------------', filters);
  };

  setClass = (record, index) => {
    return index === 0 ? 'editable-row none' : 'editable-row'
  };

  totalRender = (total) => (
      <div className="total">总计{total}条</div>
  );

  render() {
    const {columns} = this.props;
    this.columns = this.editColumn(columns);
    return (
        <div className="relative">
          <EditableContext.Provider value={this.props.form}>
            <Table
                components={this.components}
                dataSource={this.props.dataSource}
                bordered
                columns={this.columns}
                rowClassName="editable-row"
                onChange={this.tableChange}
                scroll={{x: 1600}}
                rowKey={this.props.rowKey}
                pagination={{onChange: this.cancel, defaultPageSize: 20, showTotal: total => this.totalRender(total)}}
            />
            <div className="download" onClick={this.props.download}>
              <Button type="primary">导出</Button>
            </div>
          </EditableContext.Provider>
        </div>
    );
  }

  componentDidMount() {
    // this.columns = this.editColumn(this.props.columns); //初始化 先render 再 DidMount 不能再Mount 赋值呀！！！
    console.log('componentDidMount data------------', this.props.dataSource)
  }
}

export const EditableFormTable = Form.create()(EditableTable);


