import React, { Component, PropTypes, } from 'react';
import { Link, } from 'react-router';
import * as rb from 're-bulma';
import moment from 'moment';
import numeral from 'numeral';
import utilities from '../../util';
import qs from 'querystring';
import debounce from 'debounce';
import flatten from 'flat';
import { getRenderedComponent, } from '../AppLayoutMap';
import capitalize from 'capitalize';
import pluralize from 'pluralize';
import FileReaderInput from 'react-file-reader-input';
import path from 'path';
import { csv2json, } from 'json-2-csv';
import RACodeMirror from '../RACodeMirror';
// import styles from '../styles';

const propTypes = {
  hasPagination: PropTypes.bool,
  hasHeader: PropTypes.bool,
  hasFooter: PropTypes.bool,
  limit: PropTypes.number,
  currentPage: PropTypes.number,
  numButtons: PropTypes.number,
  numPages: PropTypes.number,
  numItems: PropTypes.number,
  flattenRowData: PropTypes.bool,
  flattenRowDataOptions: PropTypes.object,
  selectedRow: PropTypes.object,
  searchTable:PropTypes.bool,
  filterSearch:PropTypes.bool,  
  headers:PropTypes.array,  
  rows:PropTypes.array,  
  tableFooter:PropTypes.bool,
  onChange:PropTypes.func,
  tableForm: PropTypes.bool,
  tableFormAddButtonProps: PropTypes.bool,
  selectEntireRow: PropTypes.bool,
  sortable: PropTypes.bool,
  suppressNullValues: PropTypes.bool,
  useInputRows: PropTypes.bool,
  replaceButton: PropTypes.bool,
  replaceButtonProps: PropTypes.any,
  replaceButtonLabel: PropTypes.string,
  uploadAddButton: PropTypes.bool,
  uploadAddButtonProps: PropTypes.any,
  uploadAddButtonLabel: PropTypes.string,
};

const defaultProps = {
  headers: [],
  rows: [],
  hasPagination: true,
  hasHeader: false,
  hasFooter: false,
  tableFooter: false,
  onChange: (event) => {
    console.debug(event);
  },
  limit: 50,
  currentPage: 1,
  numPages: 1,
  numItems: 0,
  numButtons: 1,
  flattenRowData: false,
  flattenRowDataOptions: {},
  searchTable:false,
  filterSearch:false,
  tableForm:false,
  filterAddonProps:{
    style:{
      marginBottom:'20px',
    },
  },
  filterButtonProps:{
  },
  searchButtonProps: {
    color:'isInfo',
  },
  filterSearchProps:{
    type:'text',
    placeholder:'Search',
    isExpanded:true, 
  },
  tableFormAddButtonProps: {
    color:'isPrimary',
  },
  selectEntireRow: false,
  useInputRows: false,
  selectOptionSortId: false,
  selectOptionSortIdLabel: false,
  sortable: true,
  suppressNullValues: false,
  addNewRows: true,
  fixCSVRow: true,
  insertSelectedRowHeaderIndex: 0,
  csvEOL: {
    // eol: '\r\n',
    trimHeaderValues: true,
    trimFieldValues: true,
  },
};

function getOptionsHeaders(props, propHeaders) {
  let headers = (propHeaders || props.headers || []).concat([]);
  // console.debug('original', { headers });
  if (props.selectOptionSortId) {
    headers.unshift({
      sortid: props.selectOptionSortId,
      label: props.selectOptionSortIdLabel || capitalize(props.selectOptionSortId),
      value:'x',
      selectedOptionRowHeader:true,
    });
  }
  // console.debug('modified', { headers });
  return headers;
}

class ResponsiveTable extends Component {
  constructor(props) {
    super(props);
    // console.debug('this.props.getState()',this.props.getState());
    let rows = props.rows || [];
    let headers = ((!props.headers || !props.headers.length) && rows[ 0 ])
      ? Object.keys(rows[ 0 ]).map(rowkey => {
        return {
          label: capitalize(pluralize(rowkey)),
          sortid: rowkey,
          sortable: props.sortable,
        };
      })
      : props.headers;
    headers = getOptionsHeaders(props, headers);
    if (props.flattenRowData) {
      rows = rows.map(row => Object.assign({}, row, flatten(row, props.flattenRowDataOptions)));
    }

    this.state = {
      headers: headers,
      rows:rows,
      hasPagination: props.hasPagination,
      hasHeader: props.hasHeader,
      hasFooter: props.hasFooter,
      limit: props.limit,
      currentPage: props.currentPage,
      numItems: props.numItems,
      numPages: Math.ceil(props.numItems / props.limit),
      numButtons: props.numButtons,
      isLoading: false,
      sortProp: false,
      sortOrder: '',
      newRowData: {},
      selectedRowData:{},
      selectedRowIndex:{},
    };
    this.searchFunction = debounce(this.updateTableData, 200);
    this.getRenderedComponent = getRenderedComponent.bind(this);
    this.addRow = this.updateByAddRow.bind(this);
    this.replaceRows = this.updateByReplacingRows.bind(this);
    this.addingRows = this.updateByAddingRows.bind(this);
    this.selectRow = this.updateSelectedRow.bind(this);
    this.deleteRow = this.updateByDeleteRow.bind(this);
    this.moveRowDown = this.updateByMoveRowDown.bind(this);
    this.moveRowUp = this.updateByMoveRowUp.bind(this);
    this.updateNewRowText = this.updateNewRowDataText.bind(this);
    this.updateInlineRowText = this.updateInlineRowDataText.bind(this);
    this.getFooterAddRow = this.updateGetFooterAddRow.bind(this);
  }
  componentWillReceiveProps(nextProps) {
    let rows = nextProps.rows || [];
    let headers = ((!nextProps.headers || !nextProps.headers.length) && rows[ 0 ])
      ? Object.keys(rows[ 0 ]).map(rowkey => {
        return {
          label: capitalize(pluralize(rowkey)),
          sortid: rowkey,
          sortable: true,
        };
      })
      : nextProps.headers;
    headers = getOptionsHeaders(nextProps);
    if (nextProps.flattenRowData) {
      rows = rows.map(row => Object.assign({}, row, flatten(row, nextProps.flattenRowDataOptions)));
    }
    // console.debug('nextProps.rows', nextProps.rows);

    this.setState({
      headers: headers,
      rows: rows,
      hasPagination: nextProps.hasPagination,
      hasHeader: nextProps.hasHeader,
      hasFooter: nextProps.hasFooter,
      limit: nextProps.limit,
      currentPage: nextProps.currentPage,
      numItems: nextProps.numItems,
      numPages: Math.ceil(nextProps.numItems / nextProps.limit),
      numButtons: nextProps.numButtons,
    });
  }
  updateSelectedRow(options) {
    // console.debug({ options });
    this.updateTableData(options);
  }
  updateByReplacingRows(newrows) {
    this.updateTableData({ rows:newrows.concat([]), clearNewRowData:true, });
  }
  updateByAddingRows(newrows) {
    let rows = this.state.rows.concat(newrows||[]);
    this.updateTableData({ rows, clearNewRowData:true, });
  }
  updateByAddRow() {
    let rows = this.state.rows.concat([]);
    let newRow = Object.assign({}, this.state.newRowData);
    rows.splice(rows.length, 0, newRow);
    // console.debug({ rowIndex, rows, deletedRow }, this.state.rows);
    // this.props.onChange({ rows, });
    this.updateTableData({ rows, clearNewRowData:true, });
  }
  updateByDeleteRow(rowIndex) {
    let rows = this.state.rows.concat([]);
    rows.splice(rowIndex, 1);
    // console.debug({ rowIndex, rows }, this.state.rows);
    // this.props.onChange({ rows, });
    this.updateTableData({ rows, });
  }
  updateByMoveRowUp(rowIndex) {
    let rows = this.state.rows.concat([]);
    let deletedRow = rows.splice(rowIndex, 1)[0];
    rows.splice(rowIndex - 1, 0, deletedRow);
    // console.debug({ rowIndex, rows, deletedRow }, this.state.rows);
    // this.props.onChange({ rows, });
    this.updateTableData({ rows, });
  }
  updateByMoveRowDown(rowIndex) {
    let rows = this.state.rows.concat([]);
    let deletedRow = rows.splice(rowIndex, 1)[0];
    rows.splice(rowIndex + 1, 0, deletedRow);
    // console.debug({ rowIndex, rows, deletedRow }, this.state.rows);
    // this.props.onChange({ rows, });
    this.updateTableData({ rows, });
  }
  updateNewRowDataText(options) {
    let { name, text, } = options;
    let updatedStateProp = {
      newRowData: Object.assign(
      {},
      this.state.newRowData,
      { [ name ]: text, }),
    };
    this.props.headers.forEach(header => {
      if (header.sortid!==name && header.formtype && header.defaultValue && !updatedStateProp.newRowData[ header.sortid ]) {
        updatedStateProp.newRowData[ header.sortid ] = header.defaultValue;
      }
    });
    // console.debug({ updatedStateProp, options });
    this.setState(updatedStateProp);
  }
  updateInlineRowDataText(options) {
    let { name, text, rowIndex, } = options;
    let rows = this.state.rows.concat([]);
    rows[ rowIndex ][ name ] = text;
    // console.debug({ rowIndex, rows, deletedRow }, this.state.rows);
    // this.props.onChange({ rows, });
    this.updateTableData({ rows, });
  }
  handleFileUpload(type) {
    return (e, results) => {
      let updatefunction = (type === 'replace')
        ? this.replaceRows
        : this.addingRows;
      try {
        console.debug({ e, results, });
        results.forEach(result => { 
          const [ e, file, ] = result;
          if (path.extname(file.name) === '.csv') {
            csv2json(e.target.result, (err, newRows) => {
              if (err) throw err;
              // console.debug({ newRows, }, 'e.target.result', e.target.result);
              updatefunction(newRows);
            }, {
              options: this.props.csvOptions,
              // keys: this.state.headers.map(header => header.sortid),  
            });
          } else {
            let newRows = JSON.parse(e.target.result);
            updatefunction(newRows);
          }
        });
      } catch (e) {
        this.props.errorNotification(e);
      }
    };
  }
  updateTableData(options) {
    let updatedState = {};
    let newSortOptions = {};
    if (options.clearNewRowData) {
      updatedState.newRowData = {};
    }
    if (typeof options.selectedRowIndex !== undefined) {
      updatedState.selectedRowIndex = options.selectedRowIndex;
    }
    if (typeof options.selectedRowData !== undefined) {
      updatedState.selectedRowData = options.selectedRowData;
    }
    if (!this.props.baseUrl) {
      // console.debug({options})
      updatedState.rows = (typeof options.rows !== 'undefined') ? options.rows : this.state.rows;
        // console.debug({ updatedState, });
      
      if (options.sort) {
        newSortOptions.sortProp = options.sort;
        if (this.state.sortProp === options.sort) {
          newSortOptions.sortOrder = (this.state.sortOrder !== 'desc') ? 'desc' : 'asc';
        } else {
          newSortOptions.sortOrder = 'desc';
        }
        updatedState.rows = updatedState.rows.sort(utilities.sortObject(newSortOptions.sortOrder, options.sort));
        updatedState.sortOrder = newSortOptions.sortOrder;
        updatedState.sortProp = options.sort;
      }
      if (this.props.tableSearch && this.props.searchField && options.search) {
        updatedState.rows = updatedState.rows.filter(row => row[ this.props.searchField ].indexOf(options.search) !== -1);
      }
      updatedState.numPages = Math.ceil(updatedState.rows.length / this.props.limit);
      updatedState.limit = this.props.limit;
      updatedState.currentPage = (typeof options.pagenum !== 'undefined')
        ? options.pagenum
        : (this.state.currentPage && this.state.currentPage <= updatedState.numPages)
          ? this.state.currentPage
          : 1;
      updatedState.isLoading = false;
      
      if (this.props.tableForm) {
        // console.debug('befroe', {updatedState})
        this.props.onChange(updatedState);
      }
      // else {
      this.setState(updatedState);
      // }
        
    } else {
      if (options.sort) {
        newSortOptions.sortProp = options.sort;
        if (this.state.sortProp === options.sort) {
          newSortOptions.sortOrder = (this.state.sortOrder === '') ? '-' : '';
        } else {
          newSortOptions.sortOrder = '';
        }
      }
      if (options.pagenum < 1) {
        options.pagenum = 1;
      }
      this.setState({ isLoading: true, });
      let stateProps = this.props.getState();
      let fetchURL = `${stateProps.settings.basename}${this.props.baseUrl}&${qs.stringify({
        limit: this.props.limit,
        sort: (newSortOptions.sortProp)
          ? `${newSortOptions.sortOrder}${newSortOptions.sortProp}`
          : undefined,
        search: options.search,
        allowSpecialCharacters: true,
        pagenum: options.pagenum || 1,
      })}`;
      // console.log({ options, fetchURL, },options.search.value);
      let headers = Object.assign({
        'x-access-token': stateProps.user.jwt_token,
      }, stateProps.settings.userprofile.options.headers);
      utilities.fetchComponent(fetchURL, { headers, })()  
        .then(response => { 
          this.props.dataMap.forEach(data => { 
            if (data.key === 'rows') {
              let rows = response[ data.value ] || [];
              if (this.props.flattenRowData) {
                updatedState[ data.key ] = rows.map(row => flatten(row, this.props.flattenRowDataOptions));
              }
            } else {
              updatedState[ data.key ] = response[ data.value ];
            }
          });
          updatedState.numPages = Math.ceil(updatedState.numItems / this.props.limit);
          updatedState.limit = this.props.limit;
          updatedState.currentPage = (typeof options.pagenum !=='undefined') ? options.pagenum : this.props.currentPage;
          updatedState.isLoading = false;

          if (options.sort) {
            updatedState.sortOrder = newSortOptions.sortOrder;
            updatedState.sortProp = options.sort;
          }

          if (this.props.tableForm) {
            this.props.onChange(updatedState);
          }
          this.setState(updatedState);
        }, e => {
          this.props.errorNotification(e);
        });
    }
  }
  formatValue(value, row, options, header) {
   
    try {
       // console.debug({ value, row, options, header, });
      // console.debug(options.rowIndex,this.state.selectedRowIndex)
      let returnValue = value;
      if (header && header.stringify) {
        value = JSON.stringify(value, null, 2);
        returnValue = JSON.stringify(value, null, 2);
      }
      if (header && header.tostring) {
        value = value.toString();
        returnValue = value.toString();
      }
      if (header && header.selectedOptionRowHeader) {
        return <input type="radio" checked={(options.rowIndex===this.state.selectedRowIndex)?true:false} />;
      } else if (this.props.useInputRows && header && header.formtype && header.formtype==='code') {
        let CodeMirrorProps = Object.assign({}, {
          codeMirrorProps: {
            lineNumbers: true,
            value: value, //formElement.value || this.state[ formElement.name ] || getPropertyAttribute({ element:formElement, property:this.state, });
            //value: this.state[ formElement.name ] || formElement.value,
            style: {
              minHeight:200,
            },
            lineWrapping:true,
            onChange: function (text){
              // console.log({ newvalue });
              let name = header.sortid;
              let rowIndex = options.rowIndex;
              this.updateInlineRowText({ name, text, rowIndex, });
            }.bind(this),
          },
        }, header.CodeMirrorProps);
        let codeProps = Object.assign({
          wrapperProps: {
            style: {
              overflow: 'auto',
              backgroundColor: 'white',
              border: '1px solid #d3d6db',
              borderRadius: 3,
              height: 'auto',
              boxShadow: 'inset 0 1px 2px rgba(17,17,17,.1)',
            },
          },
        }, header.codeProps);
        return <RACodeMirror
          {...CodeMirrorProps}
          {...codeProps}
        />;
      } else if (this.props.useInputRows && header && header.formtype && header.formtype==='textarea') {
        return <rb.Textarea
          {...header.textareaProps}
          value={value}
          onChange={(event) => {
            let text = event.target.value;
            let name = header.sortid;
            let rowIndex = options.rowIndex;
            this.updateInlineRowText({ name, text, rowIndex, });
          }}
        >{value}</rb.Textarea>;
      } else if (this.props.useInputRows && header && header.formtype && header.formtype==='text') {
        return <rb.Input
          value={value}
          {...header.inputProps}
          onChange={(event) => {
            let text = event.target.value;
            let name = header.sortid;
            let rowIndex = options.rowIndex;
            this.updateInlineRowText({ name, text, rowIndex, });
          }}
        >{value}</rb.Input>;
      } else if (this.props.useInputRows && header && header.formtype && header.formtype === 'select') {
        let selectOptions = header.formoptions || [];
        return <rb.Select
          value={value}
          {...header.selectProps}
          onChange={(event) => {
            let text = event.target.value;
            let name = header.sortid;
            let rowIndex = options.rowIndex;
            this.updateInlineRowText({ name, text, rowIndex, });
          }}>
          {selectOptions.map((opt, k) => {
            return <option key={k} disabled={opt.disabled} value={opt.value}>{opt.label || opt.value}</option>;
          })}
        </rb.Select>;
      } else if (typeof options.idx !=='undefined' && typeof returnValue==='string' && returnValue.indexOf('--idx--')!==-1) {
        returnValue = returnValue.replace('--idx--', options.idx);
      }
      if (typeof options.idx !=='undefined' && typeof returnValue==='string' && returnValue.indexOf('--idx-ctr--')!==-1) {
        returnValue = returnValue.replace('--idx-ctr--', (options.idx+1));
      }
      if (options.momentFormat) {
        returnValue = moment(value).format(options.momentFormat);
      } else if (options.numeralFormat) {
        returnValue = numeral(value).format(options.numeralFormat);
      } else if (header && header.wrapPreOutput) {
        returnValue = <pre {...header.wrapPreOutputProps}>{value}</pre>;
      } else if (options.icon && value) {
          // console.debug({value})
        if (typeof value !== 'string' && Array.isArray(value)) {
          let icons = value.map((val, i) => <rb.Icon key={i+Math.random()} {...options.iconProps} icon={val} />);
          return icons;
        } else {
          return <rb.Icon {...options.iconProps} icon={value} />;
        }
      } else if (options.image && value) {
        if (typeof value !== 'string' && Array.isArray(value)) {
          let images = value.map((val, i) => <rb.Image key={i} {...options.imageProps} src={val} />);
          return { images, };
        } else {
          return <rb.Image {...options.imageProps} src={value} />;
        }
      }
      if (typeof returnValue === 'undefined' || (returnValue === null && this.props.suppressNullValues)) {
        return '';
      // } else if (typeof returnValue !== 'object') {
      //   return JSON.stringify(returnValue);
    } else if (returnValue === null) {
      return 'null';
    } else {
        return returnValue.toString();
      }
    } catch (e) {
      console.log({ value, row, options, header, }, e);
      return 'invalid';
    }
  }
  getHeaderLinkURL(link, row) {
    let returnLink = link.baseUrl;
    if (link.params && link.params.length > 0) {
      link.params.forEach((param) => {
        returnLink = returnLink.replace(param.key, row[ param.val ]);
      });
    }
    return returnLink;
  }
  updateGetFooterAddRow(header) {
    if (header.selectedOptionRowHeader) return null;
    switch (header.formtype) {
    case 'select':
      return (<rb.Select
        {...header.footerFormElementPassProps}
        value={this.state.newRowData[ header.sortid ] || header.defaultValue}
        onChange={(event) => {
          let text = event.target.value;
          let name = header.sortid;
          this.updateNewRowText({ name, text, });
        }}>
        {header.formoptions.map((opt, k) => {
          return <option key={k} disabled={opt.disabled} value={opt.value}>{opt.label || opt.value}</option>;
        })}
      </rb.Select>);
      // break;  
    case 'textarea':
      return (<rb.Textarea
        {...header.footerFormElementPassProps}
        value={this.state.newRowData[ header.sortid ] || ''}
        onChange={(event) => {
          let text = event.target.value;
          let name = header.sortid;
          this.updateNewRowText({ name, text, });
        }}>
      </rb.Textarea>);    
      // break;  
    case 'code':
      var CodeMirrorProps = Object.assign({}, {
        codeMirrorProps: {
          lineNumbers: true,
          value: this.state.newRowData[ header.sortid ] || '', //formElement.value || this.state[ formElement.name ] || getPropertyAttribute({ element:formElement, property:this.state, });
          //value: this.state[ formElement.name ] || formElement.value,
          style: {
            minHeight:200,
          },
          lineWrapping:true,
          onChange: function (text){
            // console.log({ newvalue });
            let name = header.sortid;
            this.updateNewRowText({ name, text, });
          }.bind(this),
        },
      }, header.CodeMirrorProps);
      var codeProps = Object.assign({
        wrapperProps: {
          style: {
            overflow: 'auto',
            backgroundColor: 'white',
            border: '1px solid #d3d6db',
            borderRadius: 3,
            height: 'auto',
            boxShadow: 'inset 0 1px 2px rgba(17,17,17,.1)',
          },
        },
      }, header.codeProps);
      return (<RACodeMirror
        {...CodeMirrorProps}
        {...codeProps}
      />);  
    case 'text':
    default:
      return (<rb.Input
        {...header.footerFormElementPassProps}
        value={this.state.newRowData[ header.sortid ] || ''}
        onChange={(event) => {
          let text = event.target.value;
          let name = header.sortid;
          this.updateNewRowText({ name, text, });
        }}>
      </rb.Input>);  
      // break;  
    }
  }
  render() {
    // console.debug('render this.state', this.state);
    let calcStartIndex = ((this.state.currentPage - 1) * this.state.limit);
    let startIndex = (!this.props.baseUrl)
      ? calcStartIndex
      :0 ;
    let endIndex = (!this.props.baseUrl)
      ? ((this.state.limit * this.state.currentPage))
      : this.state.limit;
    let displayRows = this.state.rows.slice(startIndex, endIndex);
    const { numPages, currentPage, } = this.state;
    const pageButtons = [];
    const lastIndex = numPages - 1;

    let start = currentPage - 2;
    let end = currentPage;
    if (start < 0) {
      end += -start;
      start = 0;
    }
    if (end > lastIndex) {
      if (start > 0) {
        start -= (end - lastIndex);
        if (start < 0) {
          start = 0;
        }
      }
      end = lastIndex;
    }

    if (start > 0) {
      pageButtons.push((
        <li key={0}>
          <rb.PageButton isActive={currentPage === 1}
          onClick={()=>this.updateTableData({ pagenum: 1, })}
          >1
          </rb.PageButton>
        </li>
      ));
      pageButtons.push(<li key="dot-before">...</li>);
    }

    for (let index = start; index <= end; index += 1) {
      const inActive = ((index + 1) !== currentPage);
      if (inActive) {
        pageButtons.push((
          <li key={index}>
            <rb.PageButton
              onClick={()=>this.updateTableData({ pagenum: (index + 1), })}
            >{index + 1}</rb.PageButton>
          </li>
        ));
      } else {
        pageButtons.push((
          <li key={index}>
            <rb.PageButton color="isPrimary" isActive
              onClick={() => this.updateTableData({ pagenum: (index + 1), })}>
              {index + 1}
            </rb.PageButton>
          </li>
        ));
      }
    }

    if (end < lastIndex) {
      pageButtons.push(<li key="dot-after">...</li>);
      pageButtons.push((
        <li key={lastIndex}>
          <rb.PageButton onClick={()=>this.updateTableData({ pagenum: (lastIndex + 1), })}>
            {lastIndex + 1}
          </rb.PageButton>
        </li>
      ));
    }
    const footer = (
      <rb.Pagination>
        {(this.state.currentPage < 2)
          ? (<rb.Button state="isDisabled"> Previous </rb.Button>)
          : (<rb.PageButton onClick={()=>this.updateTableData({ pagenum: (this.state.currentPage - 1), })}>Previous</rb.PageButton>)}  
        <ul>
          {pageButtons}
        </ul>
        {(this.state.currentPage >= this.state.numPages)
          ? (<rb.Button state="isDisabled"> Next </rb.Button>)
          : (<rb.PageButton onClick={()=>this.updateTableData({ pagenum: (this.state.currentPage+1), })}>Next</rb.PageButton>)}  
      </rb.Pagination>);
    
    var fbts= <a/>;
    if(this.props.filterSearch){
      fbts = <rb.Button {...this.props.filterButtonProps}>Filters</rb.Button>;
    }
    return (
      <rb.Container {...this.props.containerProps}>
        
        {(this.props.tableSearch)
          ? (<rb.Addons
              {...this.props.filterAddonProps}
            >
              {fbts}
              <rb.Input {...this.props.filterSearchProps}
                onChange={(data) => {
                  this.searchFunction({ search: data.target.value, });
                  this.searchInputTextVal = data.target.value;  //TODO: this is janky fix it
                }}
                ref={(input) => {
                  this.searchTextInput = input;
                }}
              />
              <rb.Button {...this.props.searchButtonProps}
              onClick={() => {
                this.searchFunction({ search: this.searchInputTextVal, });
              }}
              >Search</rb.Button>
            </rb.Addons>)
          : null}
        <div style={{ overflow:'hidden', height:'100%', }}>
          {(this.state.isLoading)
            ? (<div style={{
              textAlign: 'center',
              position: 'absolute',
              height: '80%',
              width: '100%',
              opacity: '.9',
              background: 'white',
              display: 'flex',
              alignSelf: 'stretch',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <rb.Button color="isWhite" state="isLoading">Loading</rb.Button> 
          </div>)
            : null
          }   
          <rb.Table {...this.props.tableProps}>
            <rb.Thead>
              <rb.Tr>
                {this.state.headers.map((header, idx) => (
                  <rb.Th key={idx} {...header.headerColumnProps}>{(header.sortable)
                    ? (<a {...this.props.headerLinkProps} onClick={() => {
                      this.updateTableData({ sort: header.sortid, });
                    }}>{header.label}</a>)
                    : header.label
                    }</rb.Th>
                ))}
              </rb.Tr>
            </rb.Thead>
            {(this.props.tableForm && this.props.addNewRows)
              ? (<rb.Tfoot>
                <rb.Tr>
                  {this.state.headers.map((header, idx) => (
                    <rb.Th key={idx} {...header.headerColumnProps}> 
                      {(idx === this.state.headers.length - 1)
                        ? (<span className="__ra_rt_tf" style={{ display: 'flex', }} {...this.props.tableFormButtonWrapperProps}>
                          {(this.props.replaceButton)
                            ? <FileReaderInput as="text" onChange={this.handleFileUpload.call(this, 'replace')}>
                                <rb.Button {...this.props.replaceButtonProps}>{this.props.replaceButtonLabel||'Replace'}</rb.Button>  
                              </FileReaderInput>  
                            : null}
                          {(this.props.uploadAddButton)
                            ? <FileReaderInput as="text" onChange={this.handleFileUpload.call(this, 'add')}>
                                <rb.Button {...this.props.uploadAddButtonProps}>{this.props.uploadAddButtonLabel||'Upload'}</rb.Button>  
                              </FileReaderInput>   
                            :null}
                          <rb.Button
                          {...this.props.tableFormAddButtonProps}
                          style={{ width: '100%', }}
                          onClick={() => {
                            this.updateByAddRow();
                          }}>
                            {(this.props.formRowAddButtonLabel) ? this.props.formRowAddButtonLabel : 'Add'}
                          </rb.Button>
                          
                        </span>  
                        )
                        : this.updateGetFooterAddRow(header)}
                    </rb.Th>
                  ))}
                </rb.Tr>  
              </rb.Tfoot>)
              :null}
            <rb.Tbody>
              {displayRows.map((row, rowIndex) => (
                <rb.Tr key={`row${rowIndex}`} className={(this.props.selectEntireRow && rowIndex ===  this.state.selectedRowIndex)?'__selected':undefined} >
                  {this.state.headers.map((header, colIndex) => {
                    // console.debug({header});
                    if (header.link) {
                      return (
                        <rb.Td key={`row${rowIndex}col${colIndex}`} {...header.columnProps}>
                          <Link {...header.linkProps} to={this.getHeaderLinkURL(header.link, row)}>{
                            this.formatValue(
                              (typeof row[ header.sortid ] !=='undefined')
                              ? row[ header.sortid ]
                              : header.value,
                              row,
                              {
                                idx: rowIndex+calcStartIndex,
                                momentFormat: header.momentFormat,
                                image: header.image,
                                imageProps: header.imageProps,
                                icon: header.icon,
                                iconProps: header.iconProps,
                              })
                          }</Link>
                        </rb.Td>
                      );
                    } else if (header.formRowButtons) {
                      // console.debug({ row, header, });
                      //http://htmlarrows.com/arrows/
                      return (
                        <rb.Td key={`row${rowIndex}col${colIndex}`} style={{ textAlign:'right', }} {...header.columnProps}>
                          {(rowIndex !== 0)
                            ? <rb.Button {...this.props.formRowUpButton} onClick={() => {
                              this.moveRowUp(rowIndex);
                            }}>{(this.props.formRowUputtonLabel)?this.props.formRowUputtonLabel:'⇧'}</rb.Button>
                            : null
                          }
                          {(rowIndex < this.state.rows.length - 1)
                            ? <rb.Button  {...this.props.formRowDownButton} onClick={() => {
                              this.moveRowDown(rowIndex);
                            }}>{(this.props.formRowDownButtonLabel)?this.props.formRowDownButtonLabel:'⇩'}</rb.Button>
                            : null
                          }
                          <rb.Button {...this.props.formRowDeleteButton} onClick={() => {
                            this.deleteRow(rowIndex);
                          }}>{(this.props.formRowDeleteButtonLabel)?this.props.formRowDeleteButtonLabel:'⤫'}</rb.Button>
                        </rb.Td>
                      );
                    } else if (header.buttons && header.buttons.length) {
                      // console.debug({ row, header, });
                      return (
                        <rb.Td key={`row${rowIndex}col${colIndex}`} {...header.columnProps}>
                          {
                            header.buttons.map(button => {
                              return this.getRenderedComponent(Object.assign({
                                component: 'ResponsiveButton',
                                props: Object.assign({
                                  onclickPropObject: row,
                                  buttonProps: {},
                                }, button.passProps),
                                children: this.formatValue(
                                  (typeof row[ header.sortid ] !=='undefined')
                                  ? row[ header.sortid ]
                                  : header.value,
                                  row,
                                  {
                                    idx: rowIndex+calcStartIndex,
                                    momentFormat: header.momentFormat,
                                    image: header.image,
                                    imageProps: header.imageProps,
                                    icon: header.icon,
                                    iconProps: header.iconProps,
                                  }) || '',
                              }, button));
                            })
                            // Object.assign
                            
                          }
                        </rb.Td>
                      );
                    
                    } else {
                      return (
                        <rb.Td key={`row${rowIndex}col${colIndex}`} {...header.columnProps} onClick={() => {
                          if (this.props.selectEntireRow) {
                            this.selectRow({
                              selectedRowData: row,
                              selectedRowIndex: rowIndex,
                            });
                          }
                          // console.debug({ event, rowIndex });
                        }}>
                          {
                            this.formatValue.call(this,
                              (typeof row[ header.sortid ] !=='undefined')
                              ? row[ header.sortid ]
                              : header.value,
                              row,
                              {
                                rowIndex: rowIndex,
                                idx: rowIndex+calcStartIndex,
                                momentFormat: header.momentFormat,
                                image: header.image,
                                imageProps: header.imageProps,
                                icon: header.icon,
                                iconProps: header.iconProps,
                              },
                              header)
                          }
                        </rb.Td>
                      );
                      // return (
                      //   <rb.Td>{(row[ header.sortid ] && header.momentFormat)
                      //     ? moment(row[header.sortid]).format(header.momentFormat)
                      //     :row[ header.sortid ]}</rb.Td>
                      // );
                    }
                  })}
                </rb.Tr>
                ))}
            </rb.Tbody>
          </rb.Table>
        </div>  

          
        {(this.state.hasPagination && displayRows.length >0) ? footer : null}
      </rb.Container>
    );
  }
}
//tble

ResponsiveTable.propType = propTypes;
ResponsiveTable.defaultProps = defaultProps;

export default ResponsiveTable;
