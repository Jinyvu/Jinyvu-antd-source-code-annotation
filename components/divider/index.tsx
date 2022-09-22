import classNames from 'classnames';
import * as React from 'react';
import { ConfigContext } from '../config-provider';

export interface DividerProps {
  prefixCls?: string;
  type?: 'horizontal' | 'vertical';
  orientation?: 'left' | 'right' | 'center'; // 分割线标题的位置
  orientationMargin?: string | number; // 标题和最近 left/right 边框之间的距离，去除了分割线，同时 orientation 必须为 left 或 right
  className?: string;
  children?: React.ReactNode; // 嵌套的标题
  dashed?: boolean; // 是否虚线
  style?: React.CSSProperties;
  plain?: boolean; // 文字是否显示为普通正文样式
}

/**
 * Div里面包裹span组成分割线 div使用flex布局，通过设置div::before和::after的宽度来控制文字的位置
 * div::before和div::after向下偏移50%，再设置border，形成分割线 span里包裹文字
 */
const Divider: React.FC<DividerProps> = props => {
  const { getPrefixCls, direction } = React.useContext(ConfigContext);

  const {
    prefixCls: customizePrefixCls,
    type = 'horizontal',
    orientation = 'center',
    orientationMargin,
    className,
    children,
    dashed,
    plain,
    ...restProps
  } = props;
  const prefixCls = getPrefixCls('divider', customizePrefixCls);
  const orientationPrefix = orientation.length > 0 ? `-${orientation}` : orientation;
  const hasChildren = !!children;
  const hasCustomMarginLeft = orientation === 'left' && orientationMargin != null;
  const hasCustomMarginRight = orientation === 'right' && orientationMargin != null;
  const classString = classNames(
    prefixCls,
    `${prefixCls}-${type}`,
    {
      [`${prefixCls}-with-text`]: hasChildren,
      [`${prefixCls}-with-text${orientationPrefix}`]: hasChildren,
      [`${prefixCls}-dashed`]: !!dashed,
      [`${prefixCls}-plain`]: !!plain,
      [`${prefixCls}-rtl`]: direction === 'rtl',
      [`${prefixCls}-no-default-orientation-margin-left`]: hasCustomMarginLeft,
      [`${prefixCls}-no-default-orientation-margin-right`]: hasCustomMarginRight,
    },
    className,
  );

  const innerStyle = {
    ...(hasCustomMarginLeft && { marginLeft: orientationMargin }),
    ...(hasCustomMarginRight && { marginRight: orientationMargin }),
  };

  return (
    <div className={classString} {...restProps} role="separator">
      {children && (
        <span className={`${prefixCls}-inner-text`} style={innerStyle}>
          {children}
        </span>
      )}
    </div>
  );
};

export default Divider;
