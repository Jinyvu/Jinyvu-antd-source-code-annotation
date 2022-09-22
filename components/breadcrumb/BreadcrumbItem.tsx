import DownOutlined from '@ant-design/icons/DownOutlined';
import * as React from 'react';

import { ConfigContext } from '../config-provider';
import type { DropdownProps } from '../dropdown/dropdown';
import Dropdown from '../dropdown/dropdown';

export interface BreadcrumbItemProps {
  prefixCls?: string;
  separator?: React.ReactNode; // 自定义分隔符
  href?: string; // 链接的目的地
  overlay?: DropdownProps['overlay']; // 下拉菜单的内容
  dropdownProps?: DropdownProps; // 弹出下拉菜单的自定义配置
  onClick?: React.MouseEventHandler<HTMLAnchorElement | HTMLSpanElement>; // 点击回调
  className?: string;
  children?: React.ReactNode;
}
interface BreadcrumbItemInterface extends React.FC<BreadcrumbItemProps> {
  __ANT_BREADCRUMB_ITEM: boolean;
}

/** 使用li包裹item，与上层的ol对应 item根据是否设置了href，实例化为a或span 如果设置了separator，则在每个item后面添加分隔符 */
const BreadcrumbItem: BreadcrumbItemInterface = ({
  prefixCls: customizePrefixCls,
  separator = '/',
  children,
  overlay,
  dropdownProps,
  ...restProps
}) => {
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('breadcrumb', customizePrefixCls);
  /** If overlay is have Wrap a Dropdown */
  // 如果设置了overlay则使用Dropdown封装
  const renderBreadcrumbNode = (breadcrumbItem: React.ReactNode) => {
    if (overlay) {
      return (
        <Dropdown overlay={overlay} placement="bottom" {...dropdownProps}>
          <span className={`${prefixCls}-overlay-link`}>
            {breadcrumbItem}
            <DownOutlined />
          </span>
        </Dropdown>
      );
    }
    return breadcrumbItem;
  };

  let link;
  if ('href' in restProps) {
    link = (
      <a className={`${prefixCls}-link`} {...restProps}>
        {children}
      </a>
    );
  } else {
    link = (
      <span className={`${prefixCls}-link`} {...restProps}>
        {children}
      </span>
    );
  }

  // wrap to dropDown
  link = renderBreadcrumbNode(link);
  if (children) {
    return (
      <li>
        {link}
        {separator && <span className={`${prefixCls}-separator`}>{separator}</span>}
      </li>
    );
  }
  return null;
};

BreadcrumbItem.__ANT_BREADCRUMB_ITEM = true;

export default BreadcrumbItem;
