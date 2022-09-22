import classNames from 'classnames';
import * as React from 'react';
import { ConfigContext } from '../config-provider';

export interface GeneratorProps {
  suffixCls: string;
  tagName: 'header' | 'footer' | 'main' | 'section';
  displayName: string; // 组件调试时的名称
}
export interface BasicProps extends React.HTMLAttributes<HTMLDivElement> {
  prefixCls?: string;
  hasSider?: boolean;
}

export interface LayoutContextProps {
  siderHook: {
    addSider: (id: string) => void;
    removeSider: (id: string) => void;
  };
}
export const LayoutContext = React.createContext<LayoutContextProps>({
  siderHook: {
    addSider: () => null,
    removeSider: () => null,
  },
});

interface BasicPropsWithTagName extends BasicProps {
  tagName: 'header' | 'footer' | 'main' | 'section';
}

/** 返回用用React.forwardRef包裹后的组件 计算当前组件的样式前缀 */
function generator({ suffixCls, tagName, displayName }: GeneratorProps) {
  return (BasicComponent: any) => {
    // 用React.forwardRef包裹传入的组件，保证ref的传递
    const Adapter = React.forwardRef<HTMLElement, BasicProps>((props, ref) => {
      const { getPrefixCls } = React.useContext(ConfigContext);
      const { prefixCls: customizePrefixCls } = props; // 获取props中的自定义前缀
      const prefixCls = getPrefixCls(suffixCls, customizePrefixCls); // 当前组件less样式前缀

      return <BasicComponent ref={ref} prefixCls={prefixCls} tagName={tagName} {...props} />;
    });
    if (process.env.NODE_ENV !== 'production') {
      Adapter.displayName = displayName;
    }
    return Adapter;
  };
}

/** 根据tagname生成对应dom元素，Header/Footer/Content组件基础 */
const Basic = React.forwardRef<HTMLElement, BasicPropsWithTagName>((props, ref) => {
  const { prefixCls, className, children, tagName, ...others } = props;
  const classString = classNames(prefixCls, className); // 将前缀和样式名组合，形成最终样式名
  return React.createElement(tagName, { className: classString, ...others, ref }, children);
});

/** Layout组件的基础 注册添加/删除侧边栏方法，并利用useContext传递给子组件 */
const BasicLayout = React.forwardRef<HTMLElement, BasicPropsWithTagName>((props, ref) => {
  const { direction } = React.useContext(ConfigContext);

  const [siders, setSiders] = React.useState<string[]>([]);

  const { prefixCls, className, children, hasSider, tagName: Tag, ...others } = props;
  const classString = classNames(
    // 生成类名
    prefixCls,
    {
      [`${prefixCls}-has-sider`]: typeof hasSider === 'boolean' ? hasSider : siders.length > 0,
      [`${prefixCls}-rtl`]: direction === 'rtl',
    },
    className,
  );

  const contextValue = React.useMemo(
    () => ({
      siderHook: {
        addSider: (id: string) => {
          setSiders(prev => [...prev, id]);
        },
        removeSider: (id: string) => {
          setSiders(prev => prev.filter(currentId => currentId !== id));
        },
      },
    }),
    [],
  );

  return (
    // 将siderHook（添加/删除Sider）传递给子组件
    <LayoutContext.Provider value={contextValue}>
      <Tag ref={ref} className={classString} {...others}>
        {children}
      </Tag>
    </LayoutContext.Provider>
  );
});

const Layout = generator({
  suffixCls: 'layout',
  tagName: 'section',
  displayName: 'Layout',
})(BasicLayout);

const Header = generator({
  suffixCls: 'layout-header',
  tagName: 'header',
  displayName: 'Header',
})(Basic);

const Footer = generator({
  suffixCls: 'layout-footer',
  tagName: 'footer',
  displayName: 'Footer',
})(Basic);

const Content = generator({
  suffixCls: 'layout-content',
  tagName: 'main',
  displayName: 'Content',
})(Basic);

export { Header, Footer, Content };

export default Layout;
