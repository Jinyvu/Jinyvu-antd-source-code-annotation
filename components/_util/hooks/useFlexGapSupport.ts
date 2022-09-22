import * as React from 'react';
import { detectFlexGapSupported } from '../styleChecker';

/** 检查是否支持flex布局 */
export default () => {
  const [flexible, setFlexible] = React.useState(false);
  React.useEffect(() => {
    setFlexible(detectFlexGapSupported());
  }, []);

  return flexible;
};
