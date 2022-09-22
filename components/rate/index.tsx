import StarFilled from '@ant-design/icons/StarFilled';
import RcRate from 'rc-rate';
import type { RateProps as RcRateProps } from 'rc-rate/lib/Rate';
import * as React from 'react';
import { ConfigContext } from '../config-provider';
import Tooltip from '../tooltip';

export interface RateProps extends RcRateProps {
  tooltips?: Array<string>;
}

interface RateNodeProps {
  index: number;
}

/** 就是rc-rate，使用Tooltip用作提示信息 rc-rate会给每颗星星加上index值和onHover事件，每当鼠标移到星星上就会计算当前评分 */
const Rate = React.forwardRef<unknown, RateProps>(({ prefixCls, tooltips, ...props }, ref) => {
  const characterRender = (node: React.ReactElement, { index }: RateNodeProps) => {
    // tooltips：自定义每项的提示信息
    if (!tooltips) return node;
    return <Tooltip title={tooltips[index]}>{node}</Tooltip>;
  };

  const { getPrefixCls, direction } = React.useContext(ConfigContext);
  const ratePrefixCls = getPrefixCls('rate', prefixCls);

  return (
    <RcRate
      ref={ref}
      characterRender={characterRender}
      {...props}
      prefixCls={ratePrefixCls}
      direction={direction}
    />
  );
});

if (process.env.NODE_ENV !== 'production') {
  Rate.displayName = 'Rate';
}

// 设置默认字符为星星
Rate.defaultProps = {
  character: <StarFilled />,
};

export default Rate;
