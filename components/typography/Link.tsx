import * as React from 'react';
import warning from '../_util/warning';
import type { BlockProps } from './Base';
import Base from './Base';

export interface LinkProps
  extends BlockProps,
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'type'> {
  ellipsis?: boolean;
}

/** 在Base组件上二次封装 使用React.useImperativeHandle给父组件提供一些操作子组件的方法 父组件的ref没有透传 本质<a> */
const Link: React.ForwardRefRenderFunction<HTMLElement, LinkProps> = (
  { ellipsis, rel, ...restProps },
  ref,
) => {
  warning(
    typeof ellipsis !== 'object',
    'Typography.Link',
    '`ellipsis` only supports boolean value.',
  );

  const baseRef = React.useRef<any>(null);

  /**
   * React.useImperativeHandle(ref, createHandle, [deps]) 第一个参数代表父组件传过来的ref
   * 第二个参数返回的结果会赋值给ref.current 第三个参数为依赖，只有当deps变化时，createHandle会重新执行，赋值给ref.current
   *
   * UseImperativeHandle为父组件的ref提供了访问、操作子组件的方法，而不用再父子共用一个ref
   */
  React.useImperativeHandle(ref, () => baseRef.current);

  const mergedProps = {
    ...restProps,
    rel: rel === undefined && restProps.target === '_blank' ? 'noopener noreferrer' : rel,
  };

  // https://github.com/ant-design/ant-design/issues/26622
  // @ts-ignore
  delete mergedProps.navigate;

  return <Base {...mergedProps} ref={baseRef} ellipsis={!!ellipsis} component="a" />;
};

export default React.forwardRef(Link);
