import classNames from 'classnames';
import * as React from 'react';
import { ConfigContext } from '../config-provider';
import useFlexGapSupport from '../_util/hooks/useFlexGapSupport';
import type { Breakpoint, ScreenMap } from '../_util/responsiveObserve';
import ResponsiveObserve, { responsiveArray } from '../_util/responsiveObserve';
import { tuple } from '../_util/type';
import RowContext from './RowContext';

const RowAligns = tuple('top', 'middle', 'bottom', 'stretch');
const RowJustify = tuple('start', 'end', 'center', 'space-around', 'space-between', 'space-evenly');

type Gap = number | undefined;
export type Gutter = number | undefined | Partial<Record<Breakpoint, number>>;
export interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  gutter?: Gutter | [Gutter, Gutter]; // 栅格间隔
  align?: typeof RowAligns[number]; // 垂直对齐方式
  justify?: typeof RowJustify[number]; // 水平排列方式
  prefixCls?: string;
  wrap?: boolean; // 是否自动换行
}

/** 用父盒子包裹子盒子，根据是否支持flex有两种设置栅格间距的方式 */
const Row = React.forwardRef<HTMLDivElement, RowProps>((props, ref) => {
  const {
    prefixCls: customizePrefixCls,
    justify,
    align,
    className,
    style,
    children,
    gutter = 0,
    wrap,
    ...others
  } = props;

  const { getPrefixCls, direction } = React.useContext(ConfigContext);

  const [screens, setScreens] = React.useState<ScreenMap>({
    xs: true,
    sm: true,
    md: true,
    lg: true,
    xl: true,
    xxl: true,
  });

  // 是否支持flex布局
  const supportFlexGap = useFlexGapSupport();

  // 获取栅格间隔ref
  const gutterRef = React.useRef<Gutter | [Gutter, Gutter]>(gutter);

  // ================================== Effect ==================================
  // 针对屏幕尺寸变化订阅事件，同步更新组件内记录的屏幕尺寸
  React.useEffect(() => {
    const token = ResponsiveObserve.subscribe(screen => {
      const currentGutter = gutterRef.current || 0;
      if (
        (!Array.isArray(currentGutter) && typeof currentGutter === 'object') ||
        (Array.isArray(currentGutter) &&
          (typeof currentGutter[0] === 'object' || typeof currentGutter[1] === 'object'))
      ) {
        setScreens(screen);
      }
    });
    return () => ResponsiveObserve.unsubscribe(token);
  }, []);

  // ================================== Render ==================================
  // 解构传入的gutter，获取当前屏幕尺寸对应的栅格间隔: [水平间距, 垂直间距]
  const getGutter = (): [Gap, Gap] => {
    const results: [Gap, Gap] = [undefined, undefined];
    // 格式化gutter为数组
    const normalizedGutter = Array.isArray(gutter) ? gutter : [gutter, undefined];
    normalizedGutter.forEach((g, index) => {
      if (typeof g === 'object') {
        for (let i = 0; i < responsiveArray.length; i++) {
          const breakpoint: Breakpoint = responsiveArray[i];
          if (screens[breakpoint] && g[breakpoint] !== undefined) {
            results[index] = g[breakpoint] as number;
            break;
          }
        }
      } else {
        results[index] = g;
      }
    });
    return results;
  };

  const prefixCls = getPrefixCls('row', customizePrefixCls);
  const gutters = getGutter();
  const classes = classNames(
    prefixCls,
    {
      [`${prefixCls}-no-wrap`]: wrap === false,
      [`${prefixCls}-${justify}`]: justify,
      [`${prefixCls}-${align}`]: align,
      [`${prefixCls}-rtl`]: direction === 'rtl',
    },
    className,
  );

  // Add gutter related style
  const rowStyle: React.CSSProperties = {};
  const horizontalGutter = gutters[0] != null && gutters[0] > 0 ? gutters[0] / -2 : undefined;
  const verticalGutter = gutters[1] != null && gutters[1] > 0 ? gutters[1] / -2 : undefined;

  if (horizontalGutter) {
    rowStyle.marginLeft = horizontalGutter;
    rowStyle.marginRight = horizontalGutter;
  }

  if (supportFlexGap) {
    // Set gap direct if flex gap support
    [, rowStyle.rowGap] = gutters;
  } else if (verticalGutter) {
    rowStyle.marginTop = verticalGutter;
    rowStyle.marginBottom = verticalGutter;
  }

  // "gutters" is a new array in each rendering phase, it'll make 'React.useMemo' effectless.
  // So we deconstruct "gutters" variable here.
  const [gutterH, gutterV] = gutters;
  const rowContext = React.useMemo(
    () => ({ gutter: [gutterH, gutterV] as [number, number], wrap, supportFlexGap }),
    [gutterH, gutterV, wrap, supportFlexGap],
  );

  return (
    <RowContext.Provider value={rowContext}>
      <div {...others} className={classes} style={{ ...rowStyle, ...style }} ref={ref}>
        {children}
      </div>
    </RowContext.Provider>
  );
});

if (process.env.NODE_ENV !== 'production') {
  Row.displayName = 'Row';
}

export default Row;
