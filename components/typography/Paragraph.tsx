import * as React from 'react';
import type { BlockProps } from './Base';
import Base from './Base';

export interface ParagraphProps extends BlockProps {
  onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
}

/** Base组件上封装 本质div元素 */
const Paragraph: React.ForwardRefRenderFunction<HTMLDivElement, ParagraphProps> = (props, ref) => (
  <Base ref={ref} {...props} component="div" />
);

export default React.forwardRef(Paragraph);
