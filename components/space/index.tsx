import classNames from 'classnames';
import toArray from 'rc-util/lib/Children/toArray';
import * as React from 'react';
import { ConfigContext } from '../config-provider';
import type { SizeType } from '../config-provider/SizeContext';
import useFlexGapSupport from '../_util/hooks/useFlexGapSupport';
import Item from './Item';

export const SpaceContext = React.createContext({
  latestIndex: 0,
  horizontalSize: 0,
  verticalSize: 0,
  supportFlexGap: false,
});

export type SpaceSize = SizeType | number;

export interface SpaceProps extends React.HTMLAttributes<HTMLDivElement> {
  prefixCls?: string;
  className?: string;
  style?: React.CSSProperties;
  size?: SpaceSize | [SpaceSize, SpaceSize]; // 间距大小
  direction?: 'horizontal' | 'vertical'; // 间距方向
  // No `stretch` since many components do not support that.
  align?: 'start' | 'end' | 'center' | 'baseline'; // 对其方式
  split?: React.ReactNode; // 设置拆分
  wrap?: boolean; // 是否自动换行
}

const spaceSize = {
  small: 8,
  middle: 16,
  large: 24,
};

// 获取间距大小具体数值
function getNumberSize(size: SpaceSize) {
  return typeof size === 'string' ? spaceSize[size] : size || 0;
}

/** 使用Item组件一个一个包裹传入的children，生成的数组再加上一层上下文、div */
const Space: React.FC<SpaceProps> = props => {
  const { getPrefixCls, space, direction: directionConfig } = React.useContext(ConfigContext);

  const {
    size = space?.size || 'small',
    align,
    className,
    children,
    direction = 'horizontal',
    prefixCls: customizePrefixCls,
    split,
    style,
    wrap = false,
    ...otherProps
  } = props;

  const supportFlexGap = useFlexGapSupport();

  // 计算[水平间距，竖直间距]
  const [horizontalSize, verticalSize] = React.useMemo(
    () =>
      ((Array.isArray(size) ? size : [size, size]) as [SpaceSize, SpaceSize]).map(item =>
        getNumberSize(item),
      ),
    [size],
  );

  // ?
  const childNodes = toArray(children, { keepEmpty: true });

  const mergedAlign = align === undefined && direction === 'horizontal' ? 'center' : align;
  const prefixCls = getPrefixCls('space', customizePrefixCls);
  const cn = classNames(
    prefixCls,
    `${prefixCls}-${direction}`,
    {
      [`${prefixCls}-rtl`]: directionConfig === 'rtl',
      [`${prefixCls}-align-${mergedAlign}`]: mergedAlign,
    },
    className,
  );

  const itemClassName = `${prefixCls}-item`;

  const marginDirection = directionConfig === 'rtl' ? 'marginLeft' : 'marginRight';

  // Calculate latest one
  let latestIndex = 0;
  // 使用Item组件包裹每个传入的子组件，得到包裹后的组件数组
  const nodes = childNodes.map((child, i) => {
    if (child !== null && child !== undefined) {
      latestIndex = i;
    }

    const key = (child && child.key) || `${itemClassName}-${i}`;

    return (
      <Item
        className={itemClassName}
        key={key}
        direction={direction}
        index={i}
        marginDirection={marginDirection}
        split={split}
        wrap={wrap}
      >
        {child}
      </Item>
    );
  });

  /** 记忆horizontalSize, verticalSize, latestIndex, supportFlexGap */
  const spaceContext = React.useMemo(
    () => ({ horizontalSize, verticalSize, latestIndex, supportFlexGap }),
    [horizontalSize, verticalSize, latestIndex, supportFlexGap],
  );

  // =========================== Render ===========================
  if (childNodes.length === 0) {
    return null;
  }

  const gapStyle: React.CSSProperties = {};

  if (wrap) {
    gapStyle.flexWrap = 'wrap';

    // Patch for gap not support
    if (!supportFlexGap) {
      gapStyle.marginBottom = -verticalSize;
    }
  }

  if (supportFlexGap) {
    gapStyle.columnGap = horizontalSize;
    gapStyle.rowGap = verticalSize;
  }

  return (
    <div
      className={cn}
      style={{
        ...gapStyle,
        ...style,
      }}
      {...otherProps}
    >
      <SpaceContext.Provider value={spaceContext}>{nodes}</SpaceContext.Provider>
    </div>
  );
};

export default Space;
