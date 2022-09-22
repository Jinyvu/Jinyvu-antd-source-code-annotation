import LeftOutlined from '@ant-design/icons/LeftOutlined';
import RightOutlined from '@ant-design/icons/RightOutlined';
import * as React from 'react';
import Button from '../button';
import type { DirectionType } from '../config-provider';

export interface TransferOperationProps {
  className?: string;
  leftArrowText?: string;
  rightArrowText?: string;
  moveToLeft?: React.MouseEventHandler<HTMLButtonElement>;
  moveToRight?: React.MouseEventHandler<HTMLButtonElement>;
  leftActive?: boolean;
  rightActive?: boolean;
  style?: React.CSSProperties;
  disabled?: boolean;
  direction?: DirectionType;
  oneWay?: boolean; // 只有一个方向的按钮
}

/** 返回两个向左和向右的两个按钮（设置了oneWay情况下是一个） 点击按钮触发moveToLeft/moveToRight事件，通知Transfer更新选项数组 */
const Operation = ({
  disabled,
  moveToLeft,
  moveToRight,
  leftArrowText = '',
  rightArrowText = '',
  leftActive,
  rightActive,
  className,
  style,
  direction,
  oneWay,
}: TransferOperationProps) => (
  <div className={className} style={style}>
    <Button
      type="primary"
      size="small"
      disabled={disabled || !rightActive}
      onClick={moveToRight}
      icon={direction !== 'rtl' ? <RightOutlined /> : <LeftOutlined />}
    >
      {rightArrowText}
    </Button>
    {!oneWay && (
      <Button
        type="primary"
        size="small"
        disabled={disabled || !leftActive}
        onClick={moveToLeft}
        icon={direction !== 'rtl' ? <LeftOutlined /> : <RightOutlined />}
      >
        {leftArrowText}
      </Button>
    )}
  </div>
);

export default Operation;
