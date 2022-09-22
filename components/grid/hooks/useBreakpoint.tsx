import { useEffect, useRef } from 'react';
import useForceUpdate from '../../_util/hooks/useForceUpdate';
import type { ScreenMap } from '../../_util/responsiveObserve';
import ResponsiveObserve from '../../_util/responsiveObserve';

/** 订阅屏幕尺寸变化事件，返回屏幕最新尺寸 */
function useBreakpoint(refreshOnChange: boolean = true): ScreenMap {
  const screensRef = useRef<ScreenMap>({});
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    const token = ResponsiveObserve.subscribe(supportScreens => {
      screensRef.current = supportScreens;
      // 强制更新存疑
      if (refreshOnChange) {
        forceUpdate();
      }
    });

    return () => ResponsiveObserve.unsubscribe(token);
  }, []);

  return screensRef.current;
}

export default useBreakpoint;
