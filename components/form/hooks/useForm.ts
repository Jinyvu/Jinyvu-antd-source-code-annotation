import type { FormInstance as RcFormInstance } from 'rc-field-form';
import { useForm as useRcForm } from 'rc-field-form';
import * as React from 'react';
import scrollIntoView from 'scroll-into-view-if-needed';
import type { InternalNamePath, NamePath, ScrollOptions } from '../interface';
import { getFieldId, toArray } from '../util';

export interface FormInstance<Values = any> extends RcFormInstance<Values> {
  scrollToField: (name: NamePath, options?: ScrollOptions) => void;
  /** This is an internal usage. Do not use in your prod */
  __INTERNAL__: {
    /** No! Do not use this in your code! */
    name?: string;
    /** No! Do not use this in your code! */
    itemRef: (name: InternalNamePath) => (node: React.ReactElement) => void;
  };
  getFieldInstance: (name: NamePath) => any;
}

/** 将name数组使用"_"连接成字符串 */
function toNamePathStr(name: NamePath) {
  const namePath = toArray(name);
  return namePath.join('_');
}

/** 创建 Form 实例，用于管理所有数据状态，用于对表单数据域进行控制，只适用于函数组件 使用useMemo持久化传入的表单，若未传入表单，则会初始化一个并返回 注意返回的格式为[表单] */
export default function useForm<Values = any>(form?: FormInstance<Values>): [FormInstance<Values>] {
  const [rcForm] = useRcForm();
  const itemsRef = React.useRef<Record<string, React.ReactElement>>({});

  const wrapForm: FormInstance<Values> = React.useMemo(
    () =>
      form ?? {
        ...rcForm,
        __INTERNAL__: {
          itemRef: (name: InternalNamePath) => (node: React.ReactElement) => {
            const namePathStr = toNamePathStr(name);
            if (node) {
              itemsRef.current[namePathStr] = node;
            } else {
              delete itemsRef.current[namePathStr];
            }
          },
        },
        scrollToField: (name: NamePath, options: ScrollOptions = {}) => {
          const namePath = toArray(name);
          const fieldId = getFieldId(namePath, wrapForm.__INTERNAL__.name);
          const node: HTMLElement | null = fieldId ? document.getElementById(fieldId) : null;

          if (node) {
            scrollIntoView(node, {
              scrollMode: 'if-needed',
              block: 'nearest',
              ...options,
            });
          }
        },
        getFieldInstance: (name: NamePath) => {
          const namePathStr = toNamePathStr(name);
          return itemsRef.current[namePathStr];
        },
      },
    [form, rcForm],
  );

  return [wrapForm];
}
