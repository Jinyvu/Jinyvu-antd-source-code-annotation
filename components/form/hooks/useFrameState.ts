import raf from 'rc-util/lib/raf'; // requireAnimationFrame
import * as React from 'react';
import { useRef } from 'react';

type Updater<ValueType> = (prev?: ValueType) => ValueType;

/** 用法与useState类似，返回[value, setValue] setValue接受一个函数，调用setValue后，在每个动画帧都会执行传入的函数，不断更新value */
export default function useFrameState<ValueType>(
  defaultValue: ValueType,
): [ValueType, (updater: Updater<ValueType>) => void] {
  const [value, setValue] = React.useState(defaultValue);
  const frameRef = useRef<number | null>(null);
  const batchRef = useRef<Updater<ValueType>[]>([]); // 保存effect队列
  const destroyRef = useRef(false);

  React.useEffect(() => {
    destroyRef.current = false;
    return () => {
      destroyRef.current = true;
      // 取消动画帧
      raf.cancel(frameRef.current!);
      frameRef.current = null;
    };
  }, []);

  function setFrameValue(updater: Updater<ValueType>) {
    if (destroyRef.current) {
      return;
    }

    if (frameRef.current === null) {
      batchRef.current = [];
      // 添加动画帧回调函数
      frameRef.current = raf(() => {
        frameRef.current = null;
        setValue(prevValue => {
          let current = prevValue;

          batchRef.current.forEach(func => {
            current = func(current);
          });

          return current;
        });
      });
    }

    // 将新updater保存进effect队列
    batchRef.current.push(updater);
  }

  return [value, setFrameValue];
}
