import classNames from 'classnames';
import * as React from 'react';
import type { KeyWiseTransferItem } from '.';
import Pagination from '../pagination';
import type { ElementOf } from '../_util/type';
import { tuple } from '../_util/type';
import type { PaginationType } from './interface';
import type { RenderedItem, TransferListProps } from './list';
import ListItem from './ListItem';

export const OmitProps = tuple('handleFilter', 'handleClear', 'checkedKeys');
export type OmitProp = ElementOf<typeof OmitProps>;
type PartialTransferListProps<RecordType> = Omit<TransferListProps<RecordType>, OmitProp>;

export interface TransferListBodyProps<RecordType> extends PartialTransferListProps<RecordType> {
  filteredItems: RecordType[];
  filteredRenderItems: RenderedItem<RecordType>[];
  selectedKeys: string[];
}

/** 获取分页的配置 */
function parsePagination(pagination?: PaginationType) {
  if (!pagination) {
    return null;
  }

  const defaultPagination = {
    pageSize: 10,
    simple: true,
    showSizeChanger: false,
    showLessItems: false,
  };

  if (typeof pagination === 'object') {
    return {
      ...defaultPagination,
      ...pagination,
    };
  }

  return defaultPagination;
}

interface TransferListBodyState {
  current: number;
}

/** 返回（ul包裹的ListItem） + Pagination */
class ListBody<RecordType extends KeyWiseTransferItem> extends React.Component<
  TransferListBodyProps<RecordType>,
  TransferListBodyState
> {
  state = {
    current: 1,
  };

  /** 如果当前页 > 最大分页，返回{current: maxPageCount}，否则返回null */
  static getDerivedStateFromProps<T>(
    { filteredRenderItems, pagination }: TransferListBodyProps<T>,
    { current }: TransferListBodyState,
  ) {
    const mergedPagination = parsePagination(pagination);
    if (mergedPagination) {
      // Calculate the page number
      const maxPageCount = Math.ceil(filteredRenderItems.length / mergedPagination.pageSize);

      if (current > maxPageCount) {
        return { current: maxPageCount };
      }
    }

    return null;
  }

  /** 选项状态变化回调 获取当前选项的key和是否选中，传入Transfer传过来的onItemSelect，通知Transfer更新选项状态数组 */
  onItemSelect = (item: RecordType) => {
    const { onItemSelect, selectedKeys } = this.props;
    const checked = selectedKeys.indexOf(item.key) >= 0;
    onItemSelect(item.key, !checked);
  };

  /** 选项被移除回调 ，通知Transfer更新选项数组 */
  onItemRemove = (item: RecordType) => {
    const { onItemRemove } = this.props;
    onItemRemove?.([item.key]);
  };

  /** 翻页回调 */
  onPageChange = (current: number) => {
    this.setState({ current });
  };

  /** 获取当前页应展示元素 */
  getItems = () => {
    const { current } = this.state;
    const { pagination, filteredRenderItems } = this.props;

    const mergedPagination = parsePagination(pagination);

    let displayItems = filteredRenderItems;

    if (mergedPagination) {
      displayItems = filteredRenderItems.slice(
        (current - 1) * mergedPagination.pageSize,
        current * mergedPagination.pageSize,
      );
    }

    return displayItems;
  };

  render() {
    const { current } = this.state;
    const {
      prefixCls,
      onScroll,
      filteredRenderItems,
      selectedKeys,
      disabled: globalDisabled,
      showRemove,
      pagination,
    } = this.props;

    const mergedPagination = parsePagination(pagination);
    let paginationNode: React.ReactNode = null;

    // 如果设置了分页，则使用Pagination组件渲染分页栏
    if (mergedPagination) {
      paginationNode = (
        <Pagination
          simple={mergedPagination.simple}
          showSizeChanger={mergedPagination.showSizeChanger}
          showLessItems={mergedPagination.showLessItems}
          size="small"
          disabled={globalDisabled}
          className={`${prefixCls}-pagination`}
          total={filteredRenderItems.length}
          pageSize={mergedPagination.pageSize}
          current={current}
          onChange={this.onPageChange}
        />
      );
    }

    return (
      <>
        <ul
          className={classNames(`${prefixCls}-content`, {
            [`${prefixCls}-content-show-remove`]: showRemove,
          })}
          onScroll={onScroll}
        >
          {this.getItems().map(({ renderedEl, renderedText, item }: RenderedItem<RecordType>) => {
            const { disabled } = item;
            const checked = selectedKeys.indexOf(item.key) >= 0;

            return (
              <ListItem
                disabled={globalDisabled || disabled}
                key={item.key}
                item={item}
                renderedText={renderedText}
                renderedEl={renderedEl}
                checked={checked}
                prefixCls={prefixCls}
                onClick={this.onItemSelect}
                onRemove={this.onItemRemove}
                showRemove={showRemove}
              />
            );
          })}
        </ul>

        {paginationNode}
      </>
    );
  }
}

export default ListBody;
