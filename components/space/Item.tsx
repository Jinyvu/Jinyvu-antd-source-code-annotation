import * as React from 'react';
import { SpaceContext } from '.';

export interface ItemProps {
  className: string;
  children: React.ReactNode;
  index: number; // 是第几个孩子
  direction?: 'horizontal' | 'vertical';
  marginDirection: 'marginLeft' | 'marginRight';
  split?: string | React.ReactNode; // 元素间的分隔符
  wrap?: boolean; // 是否自动换行
}

/** 使用一层div包裹元素，同时在元素之间插入分隔符（如果指定了spilt选项） */
export default function Item({
  className,
  direction,
  index,
  marginDirection,
  children,
  split,
  wrap,
}: ItemProps) {
  const { horizontalSize, verticalSize, latestIndex, supportFlexGap } =
    React.useContext(SpaceContext);

  let style: React.CSSProperties = {};

  if (!supportFlexGap) {
    if (direction === 'vertical') {
      if (index < latestIndex) {
        style = { marginBottom: horizontalSize / (split ? 2 : 1) };
      }
    } else {
      style = {
        ...(index < latestIndex && { [marginDirection]: horizontalSize / (split ? 2 : 1) }),
        ...(wrap && { paddingBottom: verticalSize }),
      };
    }
  }

  if (children === null || children === undefined) {
    return null;
  }

  return (
    <>
      <div className={className} style={style}>
        {children}
      </div>
      {index < latestIndex && split && (
        <span className={`${className}-split`} style={style}>
          {split}
        </span>
      )}
    </>
  );
}
