import classNames from 'classnames';
import * as React from 'react';
import type { ConfigConsumerProps, RenderEmptyHandler } from '../config-provider';
import { ConfigConsumer } from '../config-provider';
import defaultRenderEmpty from '../config-provider/defaultRenderEmpty';
import { FormItemInputContext } from '../form/context';
import LocaleReceiver from '../locale-provider/LocaleReceiver';
import defaultLocale from '../locale/default';
import type { InputStatus } from '../_util/statusUtils';
import { getMergedStatus, getStatusClassNames } from '../_util/statusUtils';
import warning from '../_util/warning';
import type { PaginationType } from './interface';
import type { TransferListProps } from './list';
import List from './list';
import type { TransferListBodyProps } from './ListBody';
import Operation from './operation';
import Search from './search';

export { TransferListProps } from './list';
export { TransferOperationProps } from './operation';
export { TransferSearchProps } from './search';

export type TransferDirection = 'left' | 'right';

export interface RenderResultObject {
  label: React.ReactElement;
  value: string;
}

export type RenderResult = React.ReactElement | RenderResultObject | string | null;

export interface TransferItem {
  key?: string;
  title?: string;
  description?: string;
  disabled?: boolean;
  [name: string]: any;
}

export type KeyWise<T> = T & { key: string };

export type KeyWiseTransferItem = KeyWise<TransferItem>;

type TransferRender<RecordType> = (item: RecordType) => RenderResult;

export interface ListStyle {
  direction: TransferDirection;
}

export type SelectAllLabel =
  | React.ReactNode
  | ((info: { selectedCount: number; totalCount: number }) => React.ReactNode);

export interface TransferLocale {
  titles: React.ReactNode[];
  notFoundContent?: React.ReactNode | React.ReactNode[];
  searchPlaceholder: string;
  itemUnit: string;
  itemsUnit: string;
  remove: string;
  selectAll: string;
  selectCurrent: string;
  selectInvert: string;
  removeAll: string;
  removeCurrent: string;
}

export interface TransferProps<RecordType> {
  prefixCls?: string;
  className?: string;
  disabled?: boolean;
  dataSource: RecordType[]; // 数据源，其中的数据将会被渲染到左边一栏中，targetKeys 中指定的除外
  targetKeys?: string[]; // 显示在右侧框数据的 key 集合
  selectedKeys?: string[]; // 设置哪些项应该被选中
  render?: TransferRender<RecordType>; // 每行数据渲染函数，该函数的入参为 dataSource 中的项，返回值为 ReactElement。或者返回一个普通对象，其中 label 字段为 ReactElement，value 字段为 title
  onChange?: (targetKeys: string[], direction: TransferDirection, moveKeys: string[]) => void; // 选项在两栏之间转移时的回调函数
  onSelectChange?: (sourceSelectedKeys: string[], targetSelectedKeys: string[]) => void; // 选中项发生改变时的回调函数
  style?: React.CSSProperties;
  listStyle?: ((style: ListStyle) => React.CSSProperties) | React.CSSProperties; // 两个穿梭框的自定义样式
  operationStyle?: React.CSSProperties; // 操作栏的自定义样式
  titles?: React.ReactNode[]; // 标题集合，顺序从左至右
  operations?: string[]; // 操作文案集合，顺序从上至下
  showSearch?: boolean; // 是否显示搜索框
  filterOption?: (inputValue: string, item: RecordType) => boolean; // 接收 inputValue option 两个参数，当 option 符合筛选条件时，应返回 true，反之则返回 false
  locale?: Partial<TransferLocale>; // 各种语言
  footer?: (
    // footer渲染函数，direction表示是左穿梭框还是右穿梭框
    props: TransferListProps<RecordType>,
    info?: {
      direction: TransferDirection;
    },
  ) => React.ReactNode;
  rowKey?: (record: RecordType) => string; // 为每个选项生成key
  onSearch?: (direction: TransferDirection, value: string) => void; // 搜索框内容时改变时的回调函数
  onScroll?: (direction: TransferDirection, e: React.SyntheticEvent<HTMLUListElement>) => void; // 选项列表滚动时的回调函数
  children?: (props: TransferListBodyProps<RecordType>) => React.ReactNode;
  showSelectAll?: boolean; // 是否展示全选勾选框
  selectAllLabels?: SelectAllLabel[]; // 自定义顶部多选框标题的集合
  oneWay?: boolean; // 	展示为单向样式
  pagination?: PaginationType; // 使用分页样式，自定义渲染列表下无效
  status?: InputStatus; // 设置校验状态
}

interface TransferState {
  sourceSelectedKeys: string[];
  targetSelectedKeys: string[];
}

/** 由List + Operator + List组成 List主要控制选项状态的改变（是否被选中） Operator主要控制选项的迁移 */
class Transfer<RecordType extends TransferItem = TransferItem> extends React.Component<
  TransferProps<RecordType>,
  TransferState
> {
  // For high-level customized Transfer @dqaria
  static List = List;

  static Operation = Operation;

  static Search = Search;

  static defaultProps = {
    dataSource: [],
    locale: {},
    showSearch: false,
    listStyle: () => {},
  };

  /** 在被选中的选项中，区分出在左边选框和右边选框的两部分 主要功能是维护左右两个选框的选项的位置和状态 */
  static getDerivedStateFromProps<T>({
    selectedKeys,
    targetKeys,
    pagination,
    children,
  }: TransferProps<T>) {
    if (selectedKeys) {
      const mergedTargetKeys = targetKeys || [];
      return {
        sourceSelectedKeys: selectedKeys.filter(key => !mergedTargetKeys.includes(key)),
        targetSelectedKeys: selectedKeys.filter(key => mergedTargetKeys.includes(key)),
      };
    }

    warning(
      !pagination || !children,
      'Transfer',
      '`pagination` not support customize render list.',
    );

    return null;
  }

  separatedDataSource: {
    leftDataSource: RecordType[];
    rightDataSource: RecordType[];
  } | null = null;

  constructor(props: TransferProps<RecordType>) {
    super(props);

    const { selectedKeys = [], targetKeys = [] } = props;

    // state初始化为左边选框选中的选项和右边选框选中的选项
    this.state = {
      sourceSelectedKeys: selectedKeys.filter(key => targetKeys.indexOf(key) === -1),
      targetSelectedKeys: selectedKeys.filter(key => targetKeys.indexOf(key) > -1),
    };
  }

  /** 根据传入的keys和direction来更新左选框或右选框中被选中的选项 */
  setStateKeys = (
    direction: TransferDirection,
    keys: string[] | ((prevKeys: string[]) => string[]),
  ) => {
    if (direction === 'left') {
      this.setState(({ sourceSelectedKeys }) => ({
        sourceSelectedKeys: typeof keys === 'function' ? keys(sourceSelectedKeys || []) : keys,
      }));
    } else {
      this.setState(({ targetSelectedKeys }) => ({
        targetSelectedKeys: typeof keys === 'function' ? keys(targetSelectedKeys || []) : keys,
      }));
    }
  };

  /** 获取选框标题（左选框、右选框） */
  getTitles(transferLocale: TransferLocale): React.ReactNode[] {
    return this.props.titles ?? transferLocale.titles;
  }

  /** 获取语言本地化对象 */
  getLocale = (transferLocale: TransferLocale, renderEmpty: RenderEmptyHandler) => ({
    ...transferLocale,
    notFoundContent: renderEmpty('Transfer'),
    ...this.props.locale,
  });

  /** 将某一边（与direction相反）选框中被选中的选项移入direction指定的方向 */
  moveTo = (direction: TransferDirection) => {
    const { targetKeys = [], dataSource = [], onChange } = this.props;
    const { sourceSelectedKeys, targetSelectedKeys } = this.state;
    const moveKeys = direction === 'right' ? sourceSelectedKeys : targetSelectedKeys;
    // filter the disabled options
    const newMoveKeys = moveKeys.filter(
      (key: string) => !dataSource.some(data => !!(key === data.key && data.disabled)),
    );
    // move items to target box
    const newTargetKeys =
      direction === 'right'
        ? newMoveKeys.concat(targetKeys)
        : targetKeys.filter(targetKey => newMoveKeys.indexOf(targetKey) === -1);

    // empty checked keys
    const oppositeDirection = direction === 'right' ? 'left' : 'right';
    // 将选项来源一方所有被选中的选项转换为未选中状态
    this.setStateKeys(oppositeDirection, []);
    // 触发选项状态变化回调
    this.handleSelectChange(oppositeDirection, []);

    // 触发选项转移回调
    onChange?.(newTargetKeys, direction, newMoveKeys);
  };

  // 往左边移
  moveToLeft = () => this.moveTo('left');

  // 往右移
  moveToRight = () => this.moveTo('right');

  // 将某一边所有选项状态置为全选中/全不选中
  onItemSelectAll = (direction: TransferDirection, selectedKeys: string[], checkAll: boolean) => {
    this.setStateKeys(direction, prevKeys => {
      let mergedCheckedKeys = [];
      if (checkAll) {
        // Merge current keys with origin key
        mergedCheckedKeys = Array.from(new Set([...prevKeys, ...selectedKeys]));
      } else {
        // Remove current keys from origin keys
        mergedCheckedKeys = prevKeys.filter((key: string) => selectedKeys.indexOf(key) === -1);
      }

      // 触发选项状态变化回调
      this.handleSelectChange(direction, mergedCheckedKeys);

      return mergedCheckedKeys;
    });
  };

  // 左边全选/全不选
  onLeftItemSelectAll = (selectedKeys: string[], checkAll: boolean) =>
    this.onItemSelectAll('left', selectedKeys, checkAll);

  // 右边全选/全不选
  onRightItemSelectAll = (selectedKeys: string[], checkAll: boolean) =>
    this.onItemSelectAll('right', selectedKeys, checkAll);

  // 搜索框改变回调
  handleFilter = (direction: TransferDirection, e: React.ChangeEvent<HTMLInputElement>) => {
    const { onSearch } = this.props;
    const { value } = e.target;
    onSearch?.(direction, value);
  };

  // 左搜索框改变回调
  handleLeftFilter = (e: React.ChangeEvent<HTMLInputElement>) => this.handleFilter('left', e);

  // 右搜索框改变回调
  handleRightFilter = (e: React.ChangeEvent<HTMLInputElement>) => this.handleFilter('right', e);

  // 清空搜索框回调
  handleClear = (direction: TransferDirection) => {
    const { onSearch } = this.props;
    onSearch?.(direction, '');
  };

  // 清空左搜索框回调
  handleLeftClear = () => this.handleClear('left');

  // 清空右搜索框回调
  handleRightClear = () => this.handleClear('right');

  /** 点击选项回调（选中/取消选中） */
  onItemSelect = (direction: TransferDirection, selectedKey: string, checked: boolean) => {
    const { sourceSelectedKeys, targetSelectedKeys } = this.state;
    const holder = direction === 'left' ? [...sourceSelectedKeys] : [...targetSelectedKeys];
    const index = holder.indexOf(selectedKey);
    if (index > -1) {
      holder.splice(index, 1);
    }
    if (checked) {
      holder.push(selectedKey);
    }
    // 触发选项状态变化回调
    this.handleSelectChange(direction, holder);

    // 初次选中选项需要渲染
    if (!this.props.selectedKeys) {
      this.setStateKeys(direction, holder);
    }
  };

  /** 左选框点击选项回调 */
  onLeftItemSelect = (selectedKey: string, checked: boolean) =>
    this.onItemSelect('left', selectedKey, checked);

  /** 右选框点击选项回调 */
  onRightItemSelect = (selectedKey: string, checked: boolean) =>
    this.onItemSelect('right', selectedKey, checked);

  /** 清空右选框被选中的选项 */
  onRightItemRemove = (selectedKeys: string[]) => {
    const { targetKeys = [], onChange } = this.props;

    this.setStateKeys('right', []);

    onChange?.(
      targetKeys.filter(key => !selectedKeys.includes(key)),
      'left',
      [...selectedKeys],
    );
  };

  /** 选框滚动回调 */
  handleScroll = (direction: TransferDirection, e: React.SyntheticEvent<HTMLUListElement>) => {
    const { onScroll } = this.props;
    onScroll?.(direction, e);
  };

  /** 左选框滚动回调 */
  handleLeftScroll = (e: React.SyntheticEvent<HTMLUListElement>) => this.handleScroll('left', e);

  /** 右选框滚动回调 */
  handleRightScroll = (e: React.SyntheticEvent<HTMLUListElement>) => this.handleScroll('right', e);

  /** 选项状态变化回调 */
  handleSelectChange(direction: TransferDirection, holder: string[]) {
    const { sourceSelectedKeys, targetSelectedKeys } = this.state;
    const { onSelectChange } = this.props;
    if (!onSelectChange) {
      return;
    }

    if (direction === 'left') {
      onSelectChange(holder, targetSelectedKeys);
    } else {
      onSelectChange(sourceSelectedKeys, holder);
    }
  }

  // eslint-disable-next-line class-methods-use-this 处理两个穿梭框的自定义样式
  handleListStyle = (
    listStyle: TransferProps<RecordType>['listStyle'],
    direction: TransferDirection,
  ) => {
    if (typeof listStyle === 'function') {
      return listStyle({ direction });
    }
    return listStyle;
  };

  /** 根据dataSource和targetKeys将选项分为左右两部分 */
  separateDataSource() {
    const { dataSource, rowKey, targetKeys = [] } = this.props;

    const leftDataSource: KeyWise<RecordType>[] = [];
    const rightDataSource: KeyWise<RecordType>[] = new Array(targetKeys.length);
    dataSource.forEach((record: KeyWise<RecordType>) => {
      if (rowKey) {
        record = {
          ...record,
          key: rowKey(record),
        };
      }

      // rightDataSource should be ordered by targetKeys
      // leftDataSource should be ordered by dataSource
      const indexOfKey = targetKeys.indexOf(record.key);
      if (indexOfKey !== -1) {
        rightDataSource[indexOfKey] = record;
      } else {
        leftDataSource.push(record);
      }
    });

    return {
      leftDataSource,
      rightDataSource,
    };
  }

  renderTransfer = (transferLocale: TransferLocale) => (
    <ConfigConsumer>
      {({ getPrefixCls, renderEmpty, direction }: ConfigConsumerProps) => (
        <FormItemInputContext.Consumer>
          {({ hasFeedback, status: contextStatus }) => {
            const {
              prefixCls: customizePrefixCls,
              className,
              disabled,
              operations = [],
              showSearch,
              footer,
              style,
              listStyle,
              operationStyle,
              filterOption,
              render,
              children,
              showSelectAll,
              oneWay,
              pagination,
              status: customStatus,
            } = this.props;
            const prefixCls = getPrefixCls('transfer', customizePrefixCls);
            const locale = this.getLocale(transferLocale, renderEmpty || defaultRenderEmpty);
            const { sourceSelectedKeys, targetSelectedKeys } = this.state;
            const mergedStatus = getMergedStatus(contextStatus, customStatus);

            const mergedPagination = !children && pagination;

            const { leftDataSource, rightDataSource } = this.separateDataSource();
            const leftActive = targetSelectedKeys.length > 0;
            const rightActive = sourceSelectedKeys.length > 0;

            const cls = classNames(
              prefixCls,
              {
                [`${prefixCls}-disabled`]: disabled,
                [`${prefixCls}-customize-list`]: !!children,
                [`${prefixCls}-rtl`]: direction === 'rtl',
              },
              getStatusClassNames(prefixCls, mergedStatus, hasFeedback),
              className,
            );

            const titles = this.getTitles(locale);
            const selectAllLabels = this.props.selectAllLabels || [];
            return (
              <div className={cls} style={style}>
                <List<KeyWise<RecordType>>
                  prefixCls={`${prefixCls}-list`}
                  titleText={titles[0]}
                  dataSource={leftDataSource}
                  filterOption={filterOption}
                  style={this.handleListStyle(listStyle, 'left')}
                  checkedKeys={sourceSelectedKeys}
                  handleFilter={this.handleLeftFilter}
                  handleClear={this.handleLeftClear}
                  onItemSelect={this.onLeftItemSelect}
                  onItemSelectAll={this.onLeftItemSelectAll}
                  render={render}
                  showSearch={showSearch}
                  renderList={children}
                  footer={footer}
                  onScroll={this.handleLeftScroll}
                  disabled={disabled}
                  direction={direction === 'rtl' ? 'right' : 'left'}
                  showSelectAll={showSelectAll}
                  selectAllLabel={selectAllLabels[0]}
                  pagination={mergedPagination}
                  {...locale}
                />
                <Operation
                  className={`${prefixCls}-operation`}
                  rightActive={rightActive}
                  rightArrowText={operations[0]}
                  moveToRight={this.moveToRight}
                  leftActive={leftActive}
                  leftArrowText={operations[1]}
                  moveToLeft={this.moveToLeft}
                  style={operationStyle}
                  disabled={disabled}
                  direction={direction}
                  oneWay={oneWay}
                />
                <List<KeyWise<RecordType>>
                  prefixCls={`${prefixCls}-list`}
                  titleText={titles[1]}
                  dataSource={rightDataSource}
                  filterOption={filterOption}
                  style={this.handleListStyle(listStyle, 'right')}
                  checkedKeys={targetSelectedKeys}
                  handleFilter={this.handleRightFilter}
                  handleClear={this.handleRightClear}
                  onItemSelect={this.onRightItemSelect}
                  onItemSelectAll={this.onRightItemSelectAll}
                  onItemRemove={this.onRightItemRemove}
                  render={render}
                  showSearch={showSearch}
                  renderList={children}
                  footer={footer}
                  onScroll={this.handleRightScroll}
                  disabled={disabled}
                  direction={direction === 'rtl' ? 'left' : 'right'}
                  showSelectAll={showSelectAll}
                  selectAllLabel={selectAllLabels[1]}
                  showRemove={oneWay}
                  pagination={mergedPagination}
                  {...locale}
                />
              </div>
            );
          }}
        </FormItemInputContext.Consumer>
      )}
    </ConfigConsumer>
  );

  render() {
    return (
      <LocaleReceiver componentName="Transfer" defaultLocale={defaultLocale.Transfer}>
        {this.renderTransfer}
      </LocaleReceiver>
    );
  }
}

export default Transfer;
