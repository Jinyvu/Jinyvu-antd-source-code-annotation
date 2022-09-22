import classNames from 'classnames';
import type { SliderProps as RcSliderProps } from 'rc-slider';
import RcSlider from 'rc-slider';
import * as React from 'react';
import { ConfigContext } from '../config-provider';
import type { TooltipPlacement } from '../tooltip';
import SliderTooltip from './SliderTooltip';

export type SliderMarks = RcSliderProps['marks'];

interface HandleGeneratorInfo {
  value?: number;
  dragging?: boolean;
  index: number;
}

export type HandleGeneratorFn = (config: {
  tooltipPrefixCls?: string;
  prefixCls?: string;
  info: HandleGeneratorInfo;
}) => React.ReactElement;

export interface SliderBaseProps {
  prefixCls?: string;
  tooltipPrefixCls?: string;
  reverse?: boolean; // 反向坐标轴
  min?: number; // 最小值
  max?: number; // 最大值
  step?: null | number; // 步长，取值必须大于 0，并且可被 (max - min) 整除
  marks?: SliderMarks; // 刻度标记，key 的类型必须为 number 且取值在闭区间 [min, max] 内，每个标签可以单独设置样式
  dots?: boolean; // 是否只能拖拽到刻度上
  included?: boolean; // 	marks 不为空对象时有效，值为 true 时表示值为包含关系，false 表示并列
  disabled?: boolean;
  vertical?: boolean; // 值为 true 时，Slider 为垂直方向
  tipFormatter?: null | ((value?: number) => React.ReactNode); // Slider 会把当前值传给 formatter，并在 Tooltip 中显示 formatter 的返回值，若为 null，则隐藏 Tooltip
  className?: string;
  id?: string;
  style?: React.CSSProperties;
  tooltipVisible?: boolean;
  tooltipPlacement?: TooltipPlacement; // 设置 Tooltip 展示位置
  getTooltipPopupContainer?: (triggerNode: HTMLElement) => HTMLElement; // Tooltip 渲染父节点，默认渲染到 body 上
  autoFocus?: boolean;
}

export interface SliderSingleProps extends SliderBaseProps {
  range?: false;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  onAfterChange?: (value: number) => void;
  handleStyle?: React.CSSProperties;
  trackStyle?: React.CSSProperties;
}

export interface SliderRangeProps extends SliderBaseProps {
  range: true | SliderRange;
  value?: [number, number];
  defaultValue?: [number, number];
  onChange?: (value: [number, number]) => void;
  onAfterChange?: (value: [number, number]) => void;
  handleStyle?: React.CSSProperties[];
  trackStyle?: React.CSSProperties[];
}

interface SliderRange {
  draggableTrack?: boolean;
}

export type Visibles = { [index: number]: boolean };

/** 初始化SliderTooltip，并将它传给sc-slider的handleRender属性，从而实现提示功能 */
const Slider = React.forwardRef<unknown, SliderSingleProps | SliderRangeProps>(
  (props, ref: any) => {
    const { getPrefixCls, direction, getPopupContainer } = React.useContext(ConfigContext);
    const [visibles, setVisibles] = React.useState<Visibles>({});

    const toggleTooltipVisible = (index: number, visible: boolean) => {
      setVisibles((prev: Visibles) => ({ ...prev, [index]: visible }));
    };

    const getTooltipPlacement = (tooltipPlacement?: TooltipPlacement, vertical?: boolean) => {
      if (tooltipPlacement) {
        return tooltipPlacement;
      }
      if (!vertical) {
        return 'top';
      }
      return direction === 'rtl' ? 'left' : 'right';
    };

    const {
      prefixCls: customizePrefixCls,
      tooltipPrefixCls: customizeTooltipPrefixCls,
      range,
      className,
      ...restProps
    } = props;
    const prefixCls = getPrefixCls('slider', customizePrefixCls);
    const tooltipPrefixCls = getPrefixCls('tooltip', customizeTooltipPrefixCls);
    const cls = classNames(className, {
      [`${prefixCls}-rtl`]: direction === 'rtl',
    });

    // make reverse default on rtl direction
    if (direction === 'rtl' && !restProps.vertical) {
      restProps.reverse = !restProps.reverse;
    }

    // Range config
    const [mergedRange, draggableTrack] = React.useMemo(() => {
      if (!range) {
        return [false];
      }

      return typeof range === 'object' ? [true, range.draggableTrack] : [true, false];
    }, [range]);

    /** 渲染SliderTooltip，通过传入的tooltipVisible来决定是否显示提示 */
    const handleRender: RcSliderProps['handleRender'] = (node, info) => {
      const { index, dragging } = info;

      const rootPrefixCls = getPrefixCls();
      const { tipFormatter, tooltipVisible, tooltipPlacement, getTooltipPopupContainer, vertical } =
        props;

      const isTipFormatter = tipFormatter ? visibles[index] || dragging : false;
      const visible = tooltipVisible || (tooltipVisible === undefined && isTipFormatter);

      const passedProps = {
        ...node.props,
        onMouseEnter: () => toggleTooltipVisible(index, true),
        onMouseLeave: () => toggleTooltipVisible(index, false),
      };

      return (
        <SliderTooltip
          prefixCls={tooltipPrefixCls}
          title={tipFormatter ? tipFormatter(info.value) : ''}
          visible={visible}
          placement={getTooltipPlacement(tooltipPlacement, vertical)}
          transitionName={`${rootPrefixCls}-zoom-down`}
          key={index}
          overlayClassName={`${prefixCls}-tooltip`}
          getPopupContainer={getTooltipPopupContainer || getPopupContainer}
        >
          {React.cloneElement(node, passedProps)}
        </SliderTooltip>
      );
    };

    return (
      <RcSlider
        {...(restProps as SliderRangeProps)}
        step={restProps.step!}
        range={mergedRange}
        draggableTrack={draggableTrack}
        className={cls}
        ref={ref}
        prefixCls={prefixCls}
        handleRender={handleRender}
      />
    );
  },
);

if (process.env.NODE_ENV !== 'production') {
  Slider.displayName = 'Slider';
}

Slider.defaultProps = {
  tipFormatter(value: number) {
    return typeof value === 'number' ? value.toString() : '';
  },
};

export default Slider;
