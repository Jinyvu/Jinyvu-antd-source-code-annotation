import BarsOutlined from '@ant-design/icons/BarsOutlined';
import LeftOutlined from '@ant-design/icons/LeftOutlined';
import RightOutlined from '@ant-design/icons/RightOutlined';
import classNames from 'classnames';
import omit from 'rc-util/lib/omit';
import * as React from 'react';
import { useContext, useEffect, useRef, useState } from 'react';

import { ConfigContext } from '../config-provider';
import isNumeric from '../_util/isNumeric';
import { LayoutContext } from './layout'; // 添加、删除侧边栏的方法

const dimensionMaxMap = {
  xs: '479.98px',
  sm: '575.98px',
  md: '767.98px',
  lg: '991.98px',
  xl: '1199.98px',
  xxl: '1599.98px',
};

export interface SiderContextProps {
  siderCollapsed?: boolean;
}

export const SiderContext: React.Context<SiderContextProps> = React.createContext({});

export type CollapseType = 'clickTrigger' | 'responsive'; // 触发侧边栏收缩的方式，点击触发/响应式

export type SiderTheme = 'light' | 'dark';

/** 侧边栏选项 */
export interface SiderProps extends React.HTMLAttributes<HTMLDivElement> {
  prefixCls?: string;
  collapsible?: boolean; // 是否可收起
  collapsed?: boolean; // 当前收起状态
  defaultCollapsed?: boolean; // 是否默认收起
  reverseArrow?: boolean; // 翻转折叠提示箭头的方向，当 Sider 在右边时可以使用
  onCollapse?: (collapsed: boolean, type: CollapseType) => void; // 展开-收起时的回调函数，有点击 trigger 以及响应式反馈两种方式可以触发
  zeroWidthTriggerStyle?: React.CSSProperties; // 指定当 collapsedWidth 为 0 时出现的特殊 trigger 的样式
  trigger?: React.ReactNode; // 自定义 trigger，设置为 null 时隐藏 trigger
  width?: number | string;
  collapsedWidth?: number | string; // 收缩宽度，设置为 0 会出现特殊 trigger
  breakpoint?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'; // 触发响应式布局的断点
  theme?: SiderTheme;
  onBreakpoint?: (broken: boolean) => void; // 触发响应式布局断点时的回调
}

export interface SiderState {
  collapsed?: boolean;
  below: boolean;
}

// 获取唯一id（unionId）
const generateId = (() => {
  let i = 0;
  return (prefix: string = '') => {
    i += 1;
    return `${prefix}${i}`;
  };
})();

const Sider = React.forwardRef<HTMLDivElement, SiderProps>(
  (
    {
      prefixCls: customizePrefixCls,
      className,
      trigger,
      children,
      defaultCollapsed = false,
      theme = 'dark',
      style = {},
      collapsible = false,
      reverseArrow = false,
      width = 200,
      collapsedWidth = 80,
      zeroWidthTriggerStyle,
      breakpoint,
      onCollapse,
      onBreakpoint,
      ...props
    },
    ref,
  ) => {
    const { siderHook } = useContext(LayoutContext); // 添加、删除侧边栏的方法

    const [collapsed, setCollapsed] = useState(
      'collapsed' in props ? props.collapsed : defaultCollapsed,
    );
    const [below, setBelow] = useState(false);

    // state中的collapsed与props中的collapsed保持一致
    useEffect(() => {
      if ('collapsed' in props) {
        setCollapsed(props.collapsed);
      }
    }, [props.collapsed]);

    // collapse时的回调函数
    const handleSetCollapsed = (value: boolean, type: CollapseType) => {
      if (!('collapsed' in props)) {
        setCollapsed(value);
      }
      onCollapse?.(value, type);
    };

    // ========================= Responsive =========================
    // MediaQueryListEvent和MediaQueryList都是媒体查询事件类，使用方法相同，媒体查询变化时会触发change事件，可监听，考虑是因为浏览器兼容性才两者都使用
    const responsiveHandlerRef = useRef<(mql: MediaQueryListEvent | MediaQueryList) => void>();
    responsiveHandlerRef.current = (mql: MediaQueryListEvent | MediaQueryList) => {
      setBelow(mql.matches);
      onBreakpoint?.(mql.matches);

      if (collapsed !== mql.matches) {
        handleSetCollapsed(mql.matches, 'responsive');
      }
    };

    /** 注册collapse时回调，侧边栏模式为响应式有效 如果breakpoint改变则重新注册 */
    useEffect(() => {
      function responsiveHandler(mql: MediaQueryListEvent | MediaQueryList) {
        return responsiveHandlerRef.current!(mql);
      }

      let mql: MediaQueryList;

      //注册媒体查询事件
      if (typeof window !== 'undefined') {
        const { matchMedia } = window;
        if (matchMedia! && breakpoint && breakpoint in dimensionMaxMap) {
          mql = matchMedia(`(max-width: ${dimensionMaxMap[breakpoint]})`);
          try {
            mql.addEventListener('change', responsiveHandler);
          } catch (error) {
            mql.addListener(responsiveHandler); // 为啥又注册？
          }
          responsiveHandler(mql);
        }
      }
      return () => {
        try {
          mql?.removeEventListener('change', responsiveHandler);
        } catch (error) {
          mql?.removeListener(responsiveHandler);
        }
      };
    }, [breakpoint]); // in order to accept dynamic 'breakpoint' property, we need to add 'breakpoint' into dependency array.

    /** 添加侧边栏 */
    useEffect(() => {
      const uniqueId = generateId('ant-sider-');
      siderHook.addSider(uniqueId);
      return () => siderHook.removeSider(uniqueId);
    }, []);

    /** 注册collapse时回调，侧边栏模式为手动点击触发时有效 */
    const toggle = () => {
      handleSetCollapsed(!collapsed, 'clickTrigger');
    };

    const { getPrefixCls } = useContext(ConfigContext);

    /**
     * 渲染侧边栏
     *
     * 1. 根据collapseWidth是否为0初始化特殊trigger或普通trigger
     * 2. 将侧边栏、trigger和children组合为JSX并返回
     */
    const renderSider = () => {
      const prefixCls = getPrefixCls('layout-sider', customizePrefixCls);
      const divProps = omit(props, ['collapsed']);
      const rawWidth = collapsed ? collapsedWidth : width;
      // use "px" as fallback unit for width
      const siderWidth = isNumeric(rawWidth) ? `${rawWidth}px` : String(rawWidth);
      // special trigger when collapsedWidth == 0
      const zeroWidthTrigger =
        parseFloat(String(collapsedWidth || 0)) === 0 ? (
          <span
            onClick={toggle}
            className={classNames(
              `${prefixCls}-zero-width-trigger`,
              `${prefixCls}-zero-width-trigger-${reverseArrow ? 'right' : 'left'}`,
            )}
            style={zeroWidthTriggerStyle}
          >
            {trigger || <BarsOutlined />}
          </span>
        ) : null;
      const iconObj = {
        expanded: reverseArrow ? <RightOutlined /> : <LeftOutlined />,
        collapsed: reverseArrow ? <LeftOutlined /> : <RightOutlined />,
      };
      const status = collapsed ? 'collapsed' : 'expanded';
      const defaultTrigger = iconObj[status];
      const triggerDom =
        trigger !== null
          ? zeroWidthTrigger || (
              <div
                className={`${prefixCls}-trigger`}
                onClick={toggle}
                style={{ width: siderWidth }}
              >
                {trigger || defaultTrigger}
              </div>
            )
          : null;
      const divStyle = {
        ...style,
        flex: `0 0 ${siderWidth}`,
        maxWidth: siderWidth, // Fix width transition bug in IE11
        minWidth: siderWidth, // https://github.com/ant-design/ant-design/issues/6349
        width: siderWidth,
      };
      const siderCls = classNames(
        prefixCls,
        `${prefixCls}-${theme}`,
        {
          [`${prefixCls}-collapsed`]: !!collapsed,
          [`${prefixCls}-has-trigger`]: collapsible && trigger !== null && !zeroWidthTrigger,
          [`${prefixCls}-below`]: !!below,
          [`${prefixCls}-zero-width`]: parseFloat(siderWidth) === 0,
        },
        className,
      );
      return (
        <aside className={siderCls} {...divProps} style={divStyle} ref={ref}>
          <div className={`${prefixCls}-children`}>{children}</div>
          {collapsible || (below && zeroWidthTrigger) ? triggerDom : null}
        </aside>
      );
    };

    /** 将侧边栏的collapse状态传给子组件，并实时更新 */
    const contextValue = React.useMemo(
      () => ({
        siderCollapsed: collapsed,
      }),
      [collapsed],
    );

    return <SiderContext.Provider value={contextValue}>{renderSider()}</SiderContext.Provider>;
  },
);

if (process.env.NODE_ENV !== 'production') {
  Sider.displayName = 'Sider';
}

export default Sider;
