import classNames from 'classnames';
import { SubMenu as RcSubMenu, useFullPath } from 'rc-menu';
import omit from 'rc-util/lib/omit';
import * as React from 'react';
import { cloneElement, isValidElement } from '../_util/reactNode';
import type { MenuTheme } from './MenuContext';
import MenuContext from './MenuContext';

interface TitleEventEntity {
  key: string;
  domEvent: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>;
}

export interface SubMenuProps {
  className?: string;
  disabled?: boolean;
  level?: number; // 子菜单所处层级
  title?: React.ReactNode;
  icon?: React.ReactNode; // 菜单图标
  style?: React.CSSProperties;
  onTitleClick?: (e: TitleEventEntity) => void;
  onTitleMouseEnter?: (e: TitleEventEntity) => void;
  onTitleMouseLeave?: (e: TitleEventEntity) => void;
  popupOffset?: [number, number]; // 子菜单偏移量，mode="inline" 时无效
  popupClassName?: string; // 子菜单样式，mode="inline" 时无效
  children?: React.ReactNode;
  theme?: MenuTheme;
}

/** 就是rc-menu-submenu上面套一层上下文 */
function SubMenu(props: SubMenuProps) {
  const { popupClassName, icon, title, theme } = props;
  const context = React.useContext(MenuContext);
  const { prefixCls, inlineCollapsed, antdMenuTheme } = context;

  // 获取底层级路径
  const parentPath = useFullPath();

  let titleNode: React.ReactNode;

  // 渲染子菜单标题
  if (!icon) {
    titleNode =
      inlineCollapsed && !parentPath.length && title && typeof title === 'string' ? (
        <div className={`${prefixCls}-inline-collapsed-noicon`}>{title.charAt(0)}</div>
      ) : (
        <span className={`${prefixCls}-title-content`}>{title}</span>
      );
  } else {
    // inline-collapsed.md demo 依赖 span 来隐藏文字,有 icon 属性，则内部包裹一个 span
    // ref: https://github.com/ant-design/ant-design/pull/23456
    const titleIsSpan = isValidElement(title) && title.type === 'span';
    titleNode = (
      <>
        {cloneElement(icon, {
          className: classNames(
            isValidElement(icon) ? icon.props?.className : '',
            `${prefixCls}-item-icon`,
          ),
        })}
        {titleIsSpan ? title : <span className={`${prefixCls}-title-content`}>{title}</span>}
      </>
    );
  }

  const contextValue = React.useMemo(
    () => ({
      ...context,
      firstLevel: false,
    }),
    [context],
  );

  return (
    <MenuContext.Provider value={contextValue}>
      <RcSubMenu
        {...omit(props, ['icon'])}
        title={titleNode}
        popupClassName={classNames(
          prefixCls,
          `${prefixCls}-${theme || antdMenuTheme}`,
          popupClassName,
        )}
      />
    </MenuContext.Provider>
  );
}

export default SubMenu;
