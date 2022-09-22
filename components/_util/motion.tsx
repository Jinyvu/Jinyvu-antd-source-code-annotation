import type { CSSMotionProps, MotionEndEventHandler, MotionEventHandler } from 'rc-motion';
import type { MotionEvent } from 'rc-motion/lib/interface';
import { tuple } from './type';

// ================== Collapse Motion ==================
// 获取塌陷后的高度
const getCollapsedHeight: MotionEventHandler = () => ({ height: 0, opacity: 0 });

// 获取元素真实高度
const getRealHeight: MotionEventHandler = node => {
  const { scrollHeight } = node;
  return { height: scrollHeight, opacity: 1 };
};

// 获取元素当前高度
const getCurrentHeight: MotionEventHandler = node => ({ height: node ? node.offsetHeight : 0 });

// 判断是否要跳过透明度的渐变（事件的截止时间已到/渐变的对象是高度，则跳过）
const skipOpacityTransition: MotionEndEventHandler = (_, event: MotionEvent) =>
  event?.deadline === true || (event as TransitionEvent).propertyName === 'height';

// 塌陷动画
const collapseMotion: CSSMotionProps = {
  motionName: 'ant-motion-collapse',
  onAppearStart: getCollapsedHeight,
  onEnterStart: getCollapsedHeight,
  onAppearActive: getRealHeight,
  onEnterActive: getRealHeight,
  onLeaveStart: getCurrentHeight,
  onLeaveActive: getCollapsedHeight,
  onAppearEnd: skipOpacityTransition,
  onEnterEnd: skipOpacityTransition,
  onLeaveEnd: skipOpacityTransition,
  motionDeadline: 500,
};

// 位置描述
const SelectPlacements = tuple('bottomLeft', 'bottomRight', 'topLeft', 'topRight');
export type SelectCommonPlacement = typeof SelectPlacements[number];

// 渐变（过渡）的方向
const getTransitionDirection = (placement: SelectCommonPlacement | undefined) => {
  if (placement !== undefined && (placement === 'topLeft' || placement === 'topRight')) {
    return `slide-down`;
  }
  return `slide-up`;
};

// 获取渐变的类名
const getTransitionName = (rootPrefixCls: string, motion: string, transitionName?: string) => {
  if (transitionName !== undefined) {
    return transitionName;
  }
  return `${rootPrefixCls}-${motion}`;
};
export { getTransitionName, getTransitionDirection };
export default collapseMotion;
