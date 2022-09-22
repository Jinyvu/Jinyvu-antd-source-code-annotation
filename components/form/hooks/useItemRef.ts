import { composeRef } from 'rc-util/lib/ref'; // Merge refs into one ref function to support ref passing.
import * as React from 'react';
import { FormContext } from '../context';
import type { InternalNamePath } from '../interface';

export default function useItemRef() {
  const { itemRef } = React.useContext(FormContext);
  const cacheRef = React.useRef<{
    name?: string;
    originRef?: React.Ref<any>;
    ref?: React.Ref<any>;
  }>({});

  /** 接受一个路径名和一个子元素 返回一个方法，接受一个元素node，让路径名对应元素的ref和子元素的ref指向node */
  function getRef(name: InternalNamePath, children: any) {
    const childrenRef: React.Ref<React.ReactElement> =
      children && typeof children === 'object' && children.ref;
    const nameStr = name.join('_');
    if (cacheRef.current.name !== nameStr || cacheRef.current.originRef !== childrenRef) {
      cacheRef.current.name = nameStr;
      cacheRef.current.originRef = childrenRef;
      cacheRef.current.ref = composeRef(itemRef(name), childrenRef);
    }

    return cacheRef.current.ref;
  }

  return getRef;
}
