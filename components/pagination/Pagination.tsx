import DoubleLeftOutlined from '@ant-design/icons/DoubleLeftOutlined';
import DoubleRightOutlined from '@ant-design/icons/DoubleRightOutlined';
import LeftOutlined from '@ant-design/icons/LeftOutlined';
import RightOutlined from '@ant-design/icons/RightOutlined';
import classNames from 'classnames';
import type { PaginationProps as RcPaginationProps } from 'rc-pagination';
import RcPagination, { PaginationLocale } from 'rc-pagination'; // rc-pagination组件
import enUS from 'rc-pagination/lib/locale/en_US';
import * as React from 'react';
import { ConfigContext } from '../config-provider';
import useBreakpoint from '../grid/hooks/useBreakpoint'; // 订阅屏幕尺寸变化事件
import LocaleReceiver from '../locale-provider/LocaleReceiver';
import { MiddleSelect, MiniSelect } from './Select';

export interface PaginationProps extends RcPaginationProps {
  showQuickJumper?: boolean | { goButton?: React.ReactNode }; // 是否可以快速跳转至某页
  size?: 'default' | 'small'; // 分页组件的尺寸样式
  responsive?: boolean; // 当 size 未指定时，根据屏幕宽度自动调整尺寸
  role?: string;
  totalBoundaryShowSizeChanger?: number;
}

export type PaginationPosition = 'top' | 'bottom' | 'both';

export interface PaginationConfig extends PaginationProps {
  position?: PaginationPosition;
}

export { PaginationLocale };

/**
 * 在rc-pagination基础上封装 根据页面大小选择不同尺寸类型的rc-pagination 对跳转按钮做一些基本封装再作为参数传给rc-pagination
 * 将Select组件传给rc-pagination
 */
const Pagination: React.FC<PaginationProps> = ({
  prefixCls: customizePrefixCls,
  selectPrefixCls: customizeSelectPrefixCls,
  className,
  size,
  locale: customLocale,
  selectComponentClass,
  responsive,
  showSizeChanger, // 是否展示 pageSize 切换器，当 total 大于 50 时默认为 true
  ...restProps
}) => {
  // 获取屏幕最新尺寸，判断是否为xs尺寸
  const { xs } = useBreakpoint(responsive);

  const { getPrefixCls, direction, pagination = {} } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('pagination', customizePrefixCls);

  // 考虑到可能有多级分页，继承式获取showSizeChanger
  const mergedShowSizeChanger = showSizeChanger ?? pagination.showSizeChanger;

  // 跳转按钮
  const getIconsProps = () => {
    const ellipsis = <span className={`${prefixCls}-item-ellipsis`}>•••</span>;

    // 后退按钮
    let prevIcon = (
      <button className={`${prefixCls}-item-link`} type="button" tabIndex={-1}>
        <LeftOutlined />
      </button>
    );

    // 前进按钮
    let nextIcon = (
      <button className={`${prefixCls}-item-link`} type="button" tabIndex={-1}>
        <RightOutlined />
      </button>
    );

    // 后导向按钮（直接回到在这之前的上一个位置）? 未确定
    let jumpPrevIcon = (
      <a className={`${prefixCls}-item-link`}>
        {/* You can use transition effects in the container :) */}
        <div className={`${prefixCls}-item-container`}>
          <DoubleLeftOutlined className={`${prefixCls}-item-link-icon`} />
          {ellipsis}
        </div>
      </a>
    );

    // 前导向按钮（直接回到在这之后的上一个位置）？ 未确定
    let jumpNextIcon = (
      <a className={`${prefixCls}-item-link`}>
        {/* You can use transition effects in the container :) */}
        <div className={`${prefixCls}-item-container`}>
          <DoubleRightOutlined className={`${prefixCls}-item-link-icon`} />
          {ellipsis}
        </div>
      </a>
    );
    // change arrows direction in right-to-left direction
    if (direction === 'rtl') {
      [prevIcon, nextIcon] = [nextIcon, prevIcon];
      [jumpPrevIcon, jumpNextIcon] = [jumpNextIcon, jumpPrevIcon];
    }
    return {
      prevIcon,
      nextIcon,
      jumpPrevIcon,
      jumpNextIcon,
    };
  };

  // 渲染分页组件
  const renderPagination = (contextLocale: PaginationLocale) => {
    const locale = { ...contextLocale, ...customLocale };
    // 判断是否要采用small型分页
    const isSmall = size === 'small' || !!(xs && !size && responsive);
    const selectPrefixCls = getPrefixCls('select', customizeSelectPrefixCls);
    const extendedClassName = classNames(
      {
        [`${prefixCls}-mini`]: isSmall,
        [`${prefixCls}-rtl`]: direction === 'rtl',
      },
      className,
    );

    return (
      <RcPagination
        {...getIconsProps()}
        {...restProps}
        prefixCls={prefixCls}
        selectPrefixCls={selectPrefixCls}
        className={extendedClassName}
        selectComponentClass={selectComponentClass || (isSmall ? MiniSelect : MiddleSelect)}
        locale={locale}
        showSizeChanger={mergedShowSizeChanger}
      />
    );
  };

  return (
    <LocaleReceiver componentName="Pagination" defaultLocale={enUS}>
      {renderPagination}
    </LocaleReceiver>
  );
};

export default Pagination;
