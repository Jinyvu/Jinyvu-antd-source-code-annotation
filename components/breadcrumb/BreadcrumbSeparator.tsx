import * as React from 'react';
import { ConfigContext } from '../config-provider';

interface BreadcrumbSeparatorInterface extends React.FC<{ children?: React.ReactNode }> {
  __ANT_BREADCRUMB_SEPARATOR: boolean;
}

/** 使用span包裹要显示的分隔符 */
const BreadcrumbSeparator: BreadcrumbSeparatorInterface = ({ children }) => {
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('breadcrumb');

  return <span className={`${prefixCls}-separator`}>{children || '/'}</span>;
};

BreadcrumbSeparator.__ANT_BREADCRUMB_SEPARATOR = true;

export default BreadcrumbSeparator;
