/**
 * Created by xy on 15/4/13.
 */

import deepcopy from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import React from 'react';
import PropTypes from 'prop-types';
import addEventListener from 'rc-util/lib/Dom/addEventListener';
import { hasClass } from 'rc-util/lib/Dom/class';
import EmptyData from 'uxcore-empty-data';
import Row from './Row';
import util from './util';


class Tbody extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
    };
  }

  componentDidMount() {
    const me = this;
    me.rootEl = me.root;
    me.scrollHandler = me.onScroll.bind(me);
    me.scrollListener = addEventListener(me.rootEl, 'scroll', me.scrollHandler);
    this.adjustMultilineFixedRowHeight();
  }

  componentDidUpdate(prevProps) {
    const isFixedTable = ['fixed', 'rightFixed'].indexOf(this.props.fixedColumn) !== -1;
    if (isFixedTable && !isEqual(prevProps.data, this.props.data)) {
      this.adjustMultilineFixedRowHeight();
    }
  }


  componentWillUnmount() {
    const me = this;
    me.scrollListener.remove();
  }


  onScroll() {
    const me = this;
    const { fixedColumn } = me.props;
    if (me.scrollEndTimer) {
      clearTimeout(me.scrollEndTimer);
    }
    me.scrollEndTimer = setTimeout(() => {
      me.props.onScroll(me.rootEl.scrollLeft, me.rootEl.scrollTop, fixedColumn);
    }, 500);
    me.props.onScroll(me.rootEl.scrollLeft, me.rootEl.scrollTop, fixedColumn);
  }

  getDom() {
    return this.root;
  }

  getRow(index) {
    return this[`row${index}`];
  }

  adjustMultilineFixedRowHeight() {
    const isFixedTable = ['fixed', 'rightFixed'].indexOf(this.props.fixedColumn) !== -1;
    if (isFixedTable) {
      const mainBody = this.props.root.getMainBody();
      if (mainBody) {
        this.props.data.forEach((item, index) => {
          const mainTableRow = mainBody.getRow(index);
          if (mainTableRow) {
            const mainTableRowNode = mainTableRow.getDom();

            if (hasClass(mainTableRowNode, 'multiline')) {
              const height = mainTableRowNode.clientHeight;
              const row = this.getRow(index);
              const rowNode = row.getInnerBox();
              rowNode.style.height = `${height}px`;
            }
          }
        });
      }
    }
  }

  saveRef(name) {
    const me = this;
    return function func(c) {
      me[name] = c;
    };
  }

  renderEmptyData() {
    if (this.props.data.length === 0 && !this.props.mask) {
      const style = {};
      if (typeof this.props.height === 'number') {
        style.lineHeight = `${this.props.height - 10}px`;
      }
      return (
        <EmptyData style={{ marginTop: '20px', marginBottom: '20px' }}>
          {this.props.emptyText}
        </EmptyData>
      );
    }
    return null;
  }

  render() {
    const me = this;
    const props = me.props;
    const data = props.data;
    const leftFixedType = ['checkboxSelector', 'radioSelector', 'treeIcon'];
    let style = {
      height: props.bodyHeight,
    };
    let columns = deepcopy(props.columns);
    let width = 0;
    let bodyWrapClassName;

    const scrollBarWidth = util.measureScrollbar();

    if (props.fixedColumn === 'fixed') {
      columns = props.columns.filter((item) => {
        if ((item.fixed && !item.hidden) || (leftFixedType.indexOf(item.type) !== -1)) {
          width = parseInt(item.width, 10) + width;
          return true;
        }
        return false;
      });
      style = {
        ...style,
        // paddingBottom: `${scrollBarWidth}px`,
        // marginBottom: `-${scrollBarWidth}px`,
        height: props.bodyHeight === 'auto' ? props.bodyHeight : `${props.bodyHeight - scrollBarWidth}px`,
      };

      bodyWrapClassName = 'kuma-uxtable-body-fixed';
    } else if (props.fixedColumn === 'rightFixed') {
      columns = props.columns.filter((item) => {
        if (item.rightFixed && !item.hidden) {
          return true;
        }
        return false;
      });
      bodyWrapClassName = 'kuma-uxtable-body-right-fixed';
      style = {
        ...style,
        // paddingBottom: `${scrollBarWidth}px`,
        // marginBottom: `-${scrollBarWidth}px`,
        height: props.bodyHeight === 'auto' ? props.bodyHeight : `${props.bodyHeight - scrollBarWidth}px`,
      };
    } else if (props.fixedColumn === 'scroll') {
      const leftFixedColumns = [];
      const normalColumns = [];
      const rightFixedColumns = [];
      props.columns.forEach((item) => {
        if (!item.hidden) {
          if (item.fixed || leftFixedType.indexOf(item.type) !== -1) {
            leftFixedColumns.push(item);
          } else if (item.rightFixed) {
            rightFixedColumns.push(item);
          } else {
            normalColumns.push(item);
          }
        }
      });

      columns = leftFixedColumns.concat(normalColumns, rightFixedColumns);
      bodyWrapClassName = 'kuma-uxtable-body-scroll';
    } else {
      bodyWrapClassName = 'kuma-uxtable-body-no';
    }
    const rows = data.map((item, index) => {
      const renderProps = {
        columns,
        index,
        data,
        rowIndex: item.jsxid, // tree mode, rowIndex need think more, so use jsxid
        rowData: deepcopy(data[index]),
        isHover: props.currentHoverRow === index,
        root: props.root,
        locale: props.locale,
        subComp: props.subComp,
        actions: props.actions,
        key: `row${index}`,
        ref: (c) => {
          this[`row${index}`] = c;
        },
        mode: props.mode,
        renderModel: props.renderModel,
        fixedColumn: props.fixedColumn,
        level: 1,
        levels: props.levels,
        expandedKeys: props.expandedKeys,
        renderSubComp: props.renderSubComp,
        changeSelected: me.props.changeSelected,
        checkboxColumnKey: props.checkboxColumnKey,
        addRowClassName: props.addRowClassName,
        rowSelection: props.rowSelection,
        handleDataChange: props.handleDataChange,
        attachCellField: props.attachCellField,
        detachCellField: props.detachCellField,
        visible: true,
        last: (index === data.length - 1),
      };
      return <Row {...renderProps} />;
    });
    // const content = util.getIEVer() >= 8 ? rows : <QueueAnim>{rows}</QueueAnim>;
    return (
      <div className={bodyWrapClassName} ref={this.saveRef('root')} style={style}>
        {this.renderEmptyData()}
        {data.length > 0 ? <ul className={this.props.jsxprefixCls}>
          {rows}
        </ul> : null}
      </div>
    );
  }
}

Tbody.propTypes = {
  jsxprefixCls: PropTypes.string,
  fixedColumn: PropTypes.string,
  data: PropTypes.array,
  emptyText: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ]),
  height: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  mask: PropTypes.bool,
  onScroll: PropTypes.func,
  root: PropTypes.any,
};

Tbody.defaultProps = {
  jsxprefixCls: 'kuma-uxtable-body',
  onScroll: () => {},
};

export default Tbody;
