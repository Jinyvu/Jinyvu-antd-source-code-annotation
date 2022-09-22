import raf from 'rc-util/lib/raf'; // requestAnimationFrame
import { composeRef } from 'rc-util/lib/ref';
import * as React from 'react';
import { useRef } from 'react';
import type { TooltipProps } from '../tooltip';
import Tooltip from '../tooltip';

/** Tooltip的封装，暴露了ref用于直接控制Tooltip， 使用Tooltip暴露的forcePopupAlign接口来控制是否显示提示信息 */
const SliderTooltip = React.forwardRef<unknown, TooltipProps>((props, ref) => {
  const { visible } = props;
  const innerRef = useRef<any>(null);

  const rafRef = useRef<number | null>(null);

  function cancelKeepAlign() {
    raf.cancel(rafRef.current!);
    rafRef.current = null;
  }

  // 调用Tooltip接口，显示提示
  function keepAlign() {
    rafRef.current = raf(() => {
      innerRef.current?.forcePopupAlign();
      rafRef.current = null;
    });
  }

  React.useEffect(() => {
    if (visible) {
      keepAlign();
    } else {
      cancelKeepAlign();
    }

    return cancelKeepAlign;
  }, [visible, props.title]);

  return <Tooltip ref={composeRef(innerRef, ref)} {...props} />;
});

export default SliderTooltip;
