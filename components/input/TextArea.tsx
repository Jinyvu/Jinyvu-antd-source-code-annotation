import classNames from 'classnames';
import type { TextAreaProps as RcTextAreaProps } from 'rc-textarea';
import RcTextArea from 'rc-textarea';
import type ResizableTextArea from 'rc-textarea/lib/ResizableTextArea';
import useMergedState from 'rc-util/lib/hooks/useMergedState';
import omit from 'rc-util/lib/omit';
import * as React from 'react';
import { ConfigContext } from '../config-provider';
import DisabledContext from '../config-provider/DisabledContext';
import type { SizeType } from '../config-provider/SizeContext';
import SizeContext from '../config-provider/SizeContext';
import { FormItemInputContext } from '../form/context';
import type { InputStatus } from '../_util/statusUtils';
import { getMergedStatus, getStatusClassNames } from '../_util/statusUtils';
import ClearableLabeledInput from './ClearableLabeledInput';
import type { InputFocusOptions } from './Input';
import { fixControlledValue, resolveOnChange, triggerFocus } from './Input';

interface ShowCountProps {
  formatter: (args: { count: number; maxLength?: number }) => string;
}

function fixEmojiLength(value: string, maxLength: number) {
  return [...(value || '')].slice(0, maxLength).join('');
}

function setTriggerValue(
  isCursorInEnd: boolean,
  preValue: string,
  triggerValue: string,
  maxLength: number,
) {
  let newTriggerValue = triggerValue;
  if (isCursorInEnd) {
    // 光标在尾部，直接截断
    newTriggerValue = fixEmojiLength(triggerValue, maxLength!);
  } else if (
    [...(preValue || '')].length < triggerValue.length &&
    [...(triggerValue || '')].length > maxLength!
  ) {
    // 光标在中间，如果最后的值超过最大值，则采用原先的值
    newTriggerValue = preValue;
  }
  return newTriggerValue;
}

export interface TextAreaProps extends RcTextAreaProps {
  allowClear?: boolean; // 可以点击清除图标删除内容
  bordered?: boolean; // 是否有边框
  showCount?: boolean | ShowCountProps; // 是否展示字数
  size?: SizeType;
  disabled?: boolean;
  status?: InputStatus;
}

export interface TextAreaRef {
  focus: (options?: InputFocusOptions) => void;
  blur: () => void;
  resizableTextArea?: ResizableTextArea;
}

/**
 * 使用ClearableLabeledInput包裹rc-textarea，在rc-textarea基础上添加了clear选项（点击清除元素所有内容） 向父组件暴露focus和blur方法
 * 设置有普通onChange事件（字母输入、删除等）和合成输入事件（拼音输入等）
 */
const TextArea = React.forwardRef<TextAreaRef, TextAreaProps>(
  (
    {
      prefixCls: customizePrefixCls,
      bordered = true,
      showCount = false, // 是否展示字数
      maxLength, // 内容最大长度
      className,
      style,
      size: customizeSize,
      disabled: customDisabled,
      onCompositionStart,
      onCompositionEnd,
      onChange,
      status: customStatus,
      ...props
    },
    ref,
  ) => {
    const { getPrefixCls, direction } = React.useContext(ConfigContext);
    const size = React.useContext(SizeContext);

    // ===================== Disabled =====================
    const disabled = React.useContext(DisabledContext);
    const mergedDisabled = customDisabled || disabled;

    const {
      status: contextStatus,
      hasFeedback,
      isFormItemInput,
      feedbackIcon,
    } = React.useContext(FormItemInputContext);
    const mergedStatus = getMergedStatus(contextStatus, customStatus);

    const innerRef = React.useRef<RcTextArea>(null);
    const clearableInputRef = React.useRef<ClearableLabeledInput>(null);

    const [compositing, setCompositing] = React.useState(false);
    const oldCompositionValueRef = React.useRef<string>();
    const oldSelectionStartRef = React.useRef<number>(0);

    const [value, setValue] = useMergedState(props.defaultValue, {
      value: props.value,
    });
    const { hidden } = props;

    const handleSetValue = (val: string, callback?: () => void) => {
      if (props.value === undefined) {
        setValue(val);
        callback?.();
      }
    };

    // =========================== Value Update ===========================
    // Max length value
    const hasMaxLength = Number(maxLength) > 0;

    /** 合成输入开始（比如开始通过拼音输入） */
    const onInternalCompositionStart: React.CompositionEventHandler<HTMLTextAreaElement> = e => {
      setCompositing(true);
      // 拼音输入前保存一份旧值
      oldCompositionValueRef.current = value as string;
      // 保存旧的光标位置
      oldSelectionStartRef.current = e.currentTarget.selectionStart;
      onCompositionStart?.(e);
    };

    /** 合成输入结束 */
    const onInternalCompositionEnd: React.CompositionEventHandler<HTMLTextAreaElement> = e => {
      setCompositing(false);

      let triggerValue = e.currentTarget.value;
      if (hasMaxLength) {
        const isCursorInEnd =
          oldSelectionStartRef.current >= maxLength! + 1 ||
          oldSelectionStartRef.current === oldCompositionValueRef.current?.length;
        triggerValue = setTriggerValue(
          isCursorInEnd,
          oldCompositionValueRef.current as string,
          triggerValue,
          maxLength!,
        );
      }
      // Patch composition onChange when value changed 如果前后文本不一致，则触发onChange事件
      if (triggerValue !== value) {
        handleSetValue(triggerValue);
        resolveOnChange(e.currentTarget, e, onChange, triggerValue);
      }

      onCompositionEnd?.(e);
    };

    /** 处理文本改变事件 */
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      let triggerValue = e.target.value;
      if (!compositing && hasMaxLength) {
        // 1. 复制粘贴超过maxlength的情况 2.未超过maxlength的情况
        const isCursorInEnd =
          e.target.selectionStart >= maxLength! + 1 ||
          e.target.selectionStart === triggerValue.length ||
          !e.target.selectionStart;
        triggerValue = setTriggerValue(isCursorInEnd, value as string, triggerValue, maxLength!);
      }
      handleSetValue(triggerValue);
      resolveOnChange(e.currentTarget, e, onChange, triggerValue);
    };

    // ============================== Reset ===============================
    /** 置空文本框内容，重新聚焦，触发onChange事件 */
    const handleReset = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
      handleSetValue('');
      innerRef.current?.focus();
      resolveOnChange(innerRef.current?.resizableTextArea?.textArea!, e, onChange);
    };

    const prefixCls = getPrefixCls('input', customizePrefixCls);

    /** 向父组件暴露focus和blur方法 */
    React.useImperativeHandle(ref, () => ({
      resizableTextArea: innerRef.current?.resizableTextArea,
      focus: (option?: InputFocusOptions) => {
        triggerFocus(innerRef.current?.resizableTextArea?.textArea, option);
      },
      blur: () => innerRef.current?.blur(),
    }));

    const textArea = (
      <RcTextArea
        {...omit(props, ['allowClear'])}
        disabled={mergedDisabled}
        className={classNames(
          {
            [`${prefixCls}-borderless`]: !bordered,
            [className!]: className && !showCount,
            [`${prefixCls}-sm`]: size === 'small' || customizeSize === 'small',
            [`${prefixCls}-lg`]: size === 'large' || customizeSize === 'large',
          },
          getStatusClassNames(prefixCls, mergedStatus),
        )}
        style={showCount ? undefined : style}
        prefixCls={prefixCls}
        onCompositionStart={onInternalCompositionStart}
        onChange={handleChange}
        onCompositionEnd={onInternalCompositionEnd}
        ref={innerRef}
      />
    );

    let val = fixControlledValue(value) as string;

    if (!compositing && hasMaxLength && (props.value === null || props.value === undefined)) {
      // fix #27612 将value转为数组进行截取，解决 '😂'.length === 2 等emoji表情导致的截取乱码的问题
      val = fixEmojiLength(val, maxLength!);
    }

    // TextArea 包裹一层，使元素获得clear选项（点击清除元素所有内容）
    const textareaNode = (
      <ClearableLabeledInput
        disabled={mergedDisabled}
        {...props}
        prefixCls={prefixCls}
        direction={direction}
        inputType="text"
        value={val}
        element={textArea}
        handleReset={handleReset}
        ref={clearableInputRef}
        bordered={bordered}
        status={customStatus}
        style={showCount ? undefined : style}
      />
    );

    // Only show text area wrapper when needed
    if (showCount || hasFeedback) {
      const valueLength = [...val].length;

      let dataCount = '';
      if (typeof showCount === 'object') {
        dataCount = showCount.formatter({ count: valueLength, maxLength });
      } else {
        dataCount = `${valueLength}${hasMaxLength ? ` / ${maxLength}` : ''}`;
      }

      return (
        <div
          hidden={hidden}
          className={classNames(
            `${prefixCls}-textarea`,
            {
              [`${prefixCls}-textarea-rtl`]: direction === 'rtl',
              [`${prefixCls}-textarea-show-count`]: showCount,
              [`${prefixCls}-textarea-in-form-item`]: isFormItemInput,
            },
            getStatusClassNames(`${prefixCls}-textarea`, mergedStatus, hasFeedback),
            className,
          )}
          style={style}
          data-count={dataCount}
        >
          {textareaNode}
          {hasFeedback && <span className={`${prefixCls}-textarea-suffix`}>{feedbackIcon}</span>}
        </div>
      );
    }

    return textareaNode;
  },
);

export default TextArea;
