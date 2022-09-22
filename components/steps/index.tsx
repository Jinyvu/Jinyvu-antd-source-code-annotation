import CheckOutlined from '@ant-design/icons/CheckOutlined';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import classNames from 'classnames';
import RcSteps from 'rc-steps';
import type { ProgressDotRender } from 'rc-steps/lib/Steps';
import * as React from 'react';
import { ConfigContext } from '../config-provider';
import useBreakpoint from '../grid/hooks/useBreakpoint';
import Progress from '../progress';

export interface StepsProps {
  type?: 'default' | 'navigation';
  className?: string;
  current?: number; // 指定当前步骤，从 0 开始记数。在子 Step 元素中，可以通过 status 属性覆盖状态
  direction?: 'horizontal' | 'vertical';
  iconPrefix?: string;
  initial?: number; // 起始序号，从 0 开始记数
  labelPlacement?: 'horizontal' | 'vertical'; // 指定标签放置位置，默认水平放图标右侧，可选 vertical 放图标下方
  prefixCls?: string;
  progressDot?: boolean | ProgressDotRender; // 点状步骤条，可以设置为一个 function，labelPlacement 将强制为 vertical
  responsive?: boolean; // 当屏幕宽度小于 532px 时自动变为垂直模式
  size?: 'default' | 'small'; // 指定大小
  status?: 'wait' | 'process' | 'finish' | 'error'; // 指定当前步骤的状态
  style?: React.CSSProperties;
  percent?: number; // 当前 process 步骤显示的进度条进度（只对基本类型的 Steps 生效）
  onChange?: (current: number) => void;
  children?: React.ReactNode;
}

export interface StepProps {
  className?: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLElement>;
  status?: 'wait' | 'process' | 'finish' | 'error';
  disabled?: boolean;
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  style?: React.CSSProperties;
}

interface StepsType extends React.FC<StepsProps> {
  Step: typeof RcSteps.Step;
}

/**
 * 就是rc-steps
 *
 * 1. 根据屏幕尺寸判断步骤条是水平还是垂直
 * 2. 渲染自定义节点图标，使用Progress组件包裹
 */
const Steps: StepsType = props => {
  const { percent, size, className, direction, responsive, ...restProps } = props;
  // 获取当前屏幕尺寸是否为xs
  const { xs } = useBreakpoint(responsive);
  const { getPrefixCls, direction: rtlDirection } = React.useContext(ConfigContext);

  // 判断步骤条是水平还是垂直
  const getDirection = React.useCallback(
    () => (responsive && xs ? 'vertical' : direction),
    [xs, direction],
  );

  const prefixCls = getPrefixCls('steps', props.prefixCls);
  const iconPrefix = getPrefixCls('', props.iconPrefix);
  const stepsClassName = classNames(
    {
      [`${prefixCls}-rtl`]: rtlDirection === 'rtl',
      [`${prefixCls}-with-progress`]: percent !== undefined,
    },
    className,
  );

  // 步骤条节点图标
  const icons = {
    finish: <CheckOutlined className={`${prefixCls}-finish-icon`} />,
    error: <CloseOutlined className={`${prefixCls}-error-icon`} />,
  };

  /** 渲染节点图标， 如果节点状态为process且指定了percent，则使用包裹Progress后再返回 否则直接返回 */
  const stepIconRender = ({
    node,
    status,
  }: {
    node: React.ReactNode;
    index: number;
    status: string;
    title: string | React.ReactNode;
    description: string | React.ReactNode;
  }) => {
    if (status === 'process' && percent !== undefined) {
      // currently it's hard-coded, since we can't easily read the actually width of icon
      const progressWidth = size === 'small' ? 32 : 40;
      const iconWithProgress = (
        <div className={`${prefixCls}-progress-icon`}>
          <Progress
            type="circle"
            percent={percent}
            width={progressWidth}
            strokeWidth={4}
            format={() => null}
          />
          {node}
        </div>
      );
      return iconWithProgress;
    }
    return node;
  };
  return (
    <RcSteps
      icons={icons}
      {...restProps}
      size={size}
      direction={getDirection()}
      stepIcon={stepIconRender}
      prefixCls={prefixCls}
      iconPrefix={iconPrefix}
      className={stepsClassName}
    />
  );
};

// Step与rc-steps-step相同
Steps.Step = RcSteps.Step;

Steps.defaultProps = {
  current: 0,
  responsive: true,
};

export default Steps;
