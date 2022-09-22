import classNames from 'classnames';
import type { MenuItemProps as RcMenuItemProps } from 'rc-menu';
import { Item } from 'rc-menu';
import toArray from 'rc-util/lib/Children/toArray';
import * as React from 'react';
import type { SiderContextProps } from '../layout/Sider'; // 侧边栏上下文属性
import { SiderContext } from '../layout/Sider'; // 侧边栏上下文
import type { TooltipProps } from '../tooltip'; // 文字提示属性
import Tooltip from '../tooltip'; // 文字提示
import { cloneElement, isValidElement } from '../_util/reactNode';
import type { MenuContextProps } from './MenuContext'; // 菜单上下文属性
import MenuContext from './MenuContext'; // 菜单上下文

export interface MenuItemProps extends Omit<RcMenuItemProps, 'title'> {
  icon?: React.ReactNode; // 菜单图标
  danger?: boolean; // 展示错误状态样式
  title?: React.ReactNode; // 设置收缩时展示的悬浮标题
}

/** 本质使用rc-menu-item生成菜单项 如果设置了提示信息，则再在外面包一层Tooltip用于显示提示信息 */
export default class MenuItem extends React.Component<MenuItemProps> {
  static contextType = MenuContext;

  context: MenuContextProps;

  // 渲染菜单项内的元素，使用span或div包裹，便于收缩控制
  renderItemChildren(inlineCollapsed: boolean) {
    const { prefixCls, firstLevel } = this.context;
    const { icon, children } = this.props;

    // 使用span包裹children（行内元素）
    const wrapNode = <span className={`${prefixCls}-title-content`}>{children}</span>;
    // inline-collapsed.md demo 依赖 span 来隐藏文字,有 icon 属性，则内部包裹一个 span
    // ref: https://github.com/ant-design/ant-design/pull/23456
    // 用div约束children在菜单收起时的样式（比如控制元素宽度、显示文字的数量）
    if (!icon || (isValidElement(children) && children.type === 'span')) {
      if (children && inlineCollapsed && firstLevel && typeof children === 'string') {
        return <div className={`${prefixCls}-inline-collapsed-noicon`}>{children.charAt(0)}</div>;
      }
    }
    return wrapNode;
  }

  renderItem = ({ siderCollapsed }: SiderContextProps) => {
    const { prefixCls, firstLevel, inlineCollapsed, direction, disableMenuItemTitleTooltip } =
      this.context;
    const { className, children } = this.props;
    const { title, icon, danger, ...rest } = this.props;

    // 确定菜单项提示信息
    let tooltipTitle = title;
    if (typeof title === 'undefined') {
      tooltipTitle = firstLevel ? children : '';
    } else if (title === false) {
      tooltipTitle = '';
    }
    const tooltipProps: TooltipProps = {
      title: tooltipTitle,
    };

    if (!siderCollapsed && !inlineCollapsed) {
      tooltipProps.title = null;
      // Reset `visible` to fix control mode tooltip display not correct
      // ref: https://github.com/ant-design/ant-design/issues/16742
      tooltipProps.visible = false;
    }
    const childrenLength = toArray(children).length;

    // 使用rc-menu-item生成菜单项
    let returnNode = (
      <Item
        {...rest}
        className={classNames(
          {
            [`${prefixCls}-item-danger`]: danger,
            [`${prefixCls}-item-only-child`]: (icon ? childrenLength + 1 : childrenLength) === 1,
          },
          className,
        )}
        title={typeof title === 'string' ? title : undefined}
      >
        {cloneElement(icon, {
          className: classNames(
            isValidElement(icon) ? icon.props?.className : '',
            `${prefixCls}-item-icon`,
          ),
        })}
        {this.renderItemChildren(inlineCollapsed)}
      </Item>
    );

    // 是否添加提示信息
    if (!disableMenuItemTitleTooltip) {
      returnNode = (
        <Tooltip
          {...tooltipProps}
          placement={direction === 'rtl' ? 'left' : 'right'}
          overlayClassName={`${prefixCls}-inline-collapsed-tooltip`}
        >
          {returnNode}
        </Tooltip>
      );
    }

    return returnNode;
  };

  render() {
    return <SiderContext.Consumer>{this.renderItem}</SiderContext.Consumer>;
  }
}
