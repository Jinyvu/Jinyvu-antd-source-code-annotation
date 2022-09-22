import CloseCircleFilled from '@ant-design/icons/CloseCircleFilled';
import classNames from 'classnames';
import type { InputProps as RcInputProps, InputRef } from 'rc-input';
import RcInput from 'rc-input';
import { composeRef } from 'rc-util/lib/ref';
import React, { forwardRef, useContext, useEffect, useRef } from 'react';
import { ConfigContext } from '../config-provider';
import DisabledContext from '../config-provider/DisabledContext';
import type { SizeType } from '../config-provider/SizeContext';
import SizeContext from '../config-provider/SizeContext';
/**
 * FormItemInputContext
 *
 * - IsFormItemInput?: boolean; 是否为FormItem类型
 *
 *   - Status?: ValidateStatus; 校验状态('success' 'warning' 'error' 'validating')
 *   - HasFeedback?: boolean; 用于给输入框添加反馈图标
 *   - FeedbackIcon?: ReactNode; 反馈图标
 */
import { FormItemInputContext, NoFormStyle } from '../form/context';
import type { InputStatus } from '../_util/statusUtils';
import { getMergedStatus, getStatusClassNames } from '../_util/statusUtils';
import warning from '../_util/warning';
import { hasPrefixSuffix } from './utils';

export interface InputFocusOptions extends FocusOptions {
  cursor?: 'start' | 'end' | 'all';
}

export type { InputRef };

// 将受控值转化为string
export function fixControlledValue<T>(value: T) {
  if (typeof value === 'undefined' || value === null) {
    return '';
  }
  return String(value);
}

/**
 * 处理Input和TextArea的onChange事件， 注意：会克隆一个新的对象用于处理事件，原来的对象不受事件影响，所以通过在onChange的event对象中获取不到最新的value
 * 这样做的原因是让组件的value完全受控于上层组件
 */
export function resolveOnChange<E extends HTMLInputElement | HTMLTextAreaElement>(
  target: E,
  e:
    | React.ChangeEvent<E>
    | React.MouseEvent<HTMLElement, MouseEvent>
    | React.CompositionEvent<HTMLElement>,
  onChange: undefined | ((event: React.ChangeEvent<E>) => void),
  targetValue?: string,
) {
  if (!onChange) {
    return;
  }
  let event = e as React.ChangeEvent<E>;

  if (e.type === 'click') {
    // Clone a new target for event.
    // Avoid the following usage, the setQuery method gets the original value.
    //
    // const [query, setQuery] = React.useState('');
    // <Input
    //   allowClear
    //   value={query}
    //   onChange={(e)=> {
    //     setQuery((prevStatus) => e.target.value);
    //   }}
    // />

    // 深拷贝
    const currentTarget = target.cloneNode(true) as E;

    // click clear icon
    event = Object.create(e, {
      target: { value: currentTarget },
      currentTarget: { value: currentTarget },
    });

    currentTarget.value = '';
    onChange(event);
    return;
  }

  // Trigger by composition event, this means we need force change the input value
  if (targetValue !== undefined) {
    event = Object.create(e, {
      target: { value: target },
      currentTarget: { value: target },
    });

    target.value = targetValue;
    onChange(event);
    return;
  }
  onChange(event);
}

/** 触发元素focus事件，根据设置确定输入框内被选中的范围 */
export function triggerFocus(
  element?: HTMLInputElement | HTMLTextAreaElement,
  option?: InputFocusOptions,
) {
  if (!element) return;

  element.focus(option);

  // Selection content
  const { cursor } = option || {};
  if (cursor) {
    const len = element.value.length;

    switch (cursor) {
      case 'start':
        element.setSelectionRange(0, 0);
        break;

      case 'end':
        element.setSelectionRange(len, len);
        break;

      default:
        element.setSelectionRange(0, len);
    }
  }
}

export interface InputProps
  extends Omit<
    RcInputProps,
    'wrapperClassName' | 'groupClassName' | 'inputClassName' | 'affixWrapperClassName'
  > {
  size?: SizeType;
  disabled?: boolean;
  status?: InputStatus;
  bordered?: boolean;
  [key: `data-${string}`]: string | undefined;
}

/** 就是rc-input */
const Input = forwardRef<InputRef, InputProps>((props, ref) => {
  const {
    prefixCls: customizePrefixCls,
    bordered = true, // 是否有边框
    status: customStatus, // 设置校验状态（error/warning）
    size: customSize, // 控件大小
    disabled: customDisabled,
    onBlur, // 失焦事件
    onFocus, // 获取焦点事件
    suffix, // 带有后缀图标的 input
    allowClear, // 可以点击清除图标删除内容
    addonAfter, // 带标签的 input，设置后置标签
    addonBefore, // 带标签的 input，设置前置标签
    ...rest
  } = props;
  const { getPrefixCls, direction, input } = React.useContext(ConfigContext);

  const prefixCls = getPrefixCls('input', customizePrefixCls);
  const inputRef = useRef<InputRef>(null);

  // ===================== Size =====================
  const size = React.useContext(SizeContext);
  const mergedSize = customSize || size;

  // ===================== Disabled =====================
  const disabled = React.useContext(DisabledContext);
  const mergedDisabled = customDisabled || disabled;

  // ===================== Status =====================
  const { status: contextStatus, hasFeedback, feedbackIcon } = useContext(FormItemInputContext);
  const mergedStatus = getMergedStatus(contextStatus, customStatus);

  // ===================== Focus warning =====================
  const inputHasPrefixSuffix = hasPrefixSuffix(props) || !!hasFeedback;
  const prevHasPrefixSuffix = useRef<boolean>(inputHasPrefixSuffix);
  useEffect(() => {
    if (inputHasPrefixSuffix && !prevHasPrefixSuffix.current) {
      warning(
        document.activeElement === inputRef.current?.input,
        'Input',
        `When Input is focused, dynamic add or remove prefix / suffix will make it lose focus caused by dom structure change. Read more: https://ant.design/components/input/#FAQ`,
      );
    }
    prevHasPrefixSuffix.current = inputHasPrefixSuffix;
  }, [inputHasPrefixSuffix]);

  // ===================== Remove Password value =====================
  const removePasswordTimeoutRef = useRef<number[]>([]);
  const removePasswordTimeout = () => {
    removePasswordTimeoutRef.current.push(
      window.setTimeout(() => {
        if (
          inputRef.current?.input &&
          inputRef.current?.input.getAttribute('type') === 'password' &&
          inputRef.current?.input.hasAttribute('value')
        ) {
          inputRef.current?.input.removeAttribute('value');
        }
      }),
    );
  };

  useEffect(() => {
    removePasswordTimeout();
    return () => removePasswordTimeoutRef.current.forEach(item => window.clearTimeout(item));
  }, []);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    removePasswordTimeout();
    onBlur?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    removePasswordTimeout();
    onFocus?.(e);
  };

  /** 渲染后缀节点 */
  const suffixNode = (hasFeedback || suffix) && (
    <>
      {suffix}
      {hasFeedback && feedbackIcon}
    </>
  );

  // Allow clear 渲染清空内容图标
  let mergedAllowClear;
  if (typeof allowClear === 'object' && allowClear?.clearIcon) {
    mergedAllowClear = allowClear;
  } else if (allowClear) {
    mergedAllowClear = { clearIcon: <CloseCircleFilled /> };
  }

  return (
    <RcInput
      ref={composeRef(ref, inputRef)}
      prefixCls={prefixCls}
      autoComplete={input?.autoComplete}
      {...rest}
      disabled={mergedDisabled || undefined}
      onBlur={handleBlur}
      onFocus={handleFocus}
      suffix={suffixNode}
      allowClear={mergedAllowClear}
      addonAfter={
        addonAfter && (
          <NoFormStyle override status>
            {addonAfter}
          </NoFormStyle>
        )
      }
      addonBefore={
        addonBefore && (
          <NoFormStyle override status>
            {addonBefore}
          </NoFormStyle>
        )
      }
      inputClassName={classNames(
        {
          [`${prefixCls}-sm`]: mergedSize === 'small',
          [`${prefixCls}-lg`]: mergedSize === 'large',
          [`${prefixCls}-rtl`]: direction === 'rtl',
          [`${prefixCls}-borderless`]: !bordered,
        },
        !inputHasPrefixSuffix && getStatusClassNames(prefixCls, mergedStatus),
      )}
      affixWrapperClassName={classNames(
        {
          [`${prefixCls}-affix-wrapper-sm`]: mergedSize === 'small',
          [`${prefixCls}-affix-wrapper-lg`]: mergedSize === 'large',
          [`${prefixCls}-affix-wrapper-rtl`]: direction === 'rtl',
          [`${prefixCls}-affix-wrapper-borderless`]: !bordered,
        },
        getStatusClassNames(`${prefixCls}-affix-wrapper`, mergedStatus, hasFeedback),
      )}
      wrapperClassName={classNames({
        [`${prefixCls}-group-rtl`]: direction === 'rtl',
      })}
      groupClassName={classNames(
        {
          [`${prefixCls}-group-wrapper-sm`]: mergedSize === 'small',
          [`${prefixCls}-group-wrapper-lg`]: mergedSize === 'large',
          [`${prefixCls}-group-wrapper-rtl`]: direction === 'rtl',
        },
        getStatusClassNames(`${prefixCls}-group-wrapper`, mergedStatus, hasFeedback),
      )}
    />
  );
});

export default Input;
