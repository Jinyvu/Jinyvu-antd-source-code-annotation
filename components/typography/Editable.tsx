import EnterOutlined from '@ant-design/icons/EnterOutlined';
import classNames from 'classnames';
import type { AutoSizeType } from 'rc-textarea/lib/ResizableTextArea';
import KeyCode from 'rc-util/lib/KeyCode';
import * as React from 'react';
import type { DirectionType } from '../config-provider';
import TextArea from '../input/TextArea';
import { cloneElement } from '../_util/reactNode';

interface EditableProps {
  prefixCls?: string;
  value: string;
  ['aria-label']?: string;
  onSave: (value: string) => void;
  onCancel: () => void; // 	按 ESC 退出编辑状态时触发
  onEnd?: () => void; // 按 ENTER 结束编辑状态时触发
  className?: string;
  style?: React.CSSProperties;
  direction?: DirectionType;
  maxLength?: number;
  autoSize?: boolean | AutoSizeType; // 自动 resize 文本域
  enterIcon?: React.ReactNode; // 在编辑段中自定义“enter”图标
  component?: string;
}

/** 在TextArea组件上封装 */
const Editable: React.FC<EditableProps> = ({
  prefixCls,
  'aria-label': ariaLabel,
  className,
  style,
  direction,
  maxLength,
  autoSize = true,
  value,
  onSave,
  onCancel,
  onEnd,
  component,
  enterIcon = <EnterOutlined />,
}) => {
  const ref = React.useRef<any>();

  const inComposition = React.useRef(false);
  const lastKeyCode = React.useRef<number>();

  const [current, setCurrent] = React.useState(value);

  React.useEffect(() => {
    setCurrent(value);
  }, [value]);

  /** 自动聚焦 */
  React.useEffect(() => {
    if (ref.current && ref.current.resizableTextArea) {
      // textArea: HTMLInputElement
      const { textArea } = ref.current.resizableTextArea;
      textArea.focus();
      const { length } = textArea.value;
      textArea.setSelectionRange(length, length);
    }
  }, []);

  const onChange: React.ChangeEventHandler<HTMLTextAreaElement> = ({ target }) => {
    setCurrent(target.value.replace(/[\n\r]/g, ''));
  };

  const onCompositionStart = () => {
    inComposition.current = true;
  };

  const onCompositionEnd = () => {
    inComposition.current = false;
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = ({ keyCode }) => {
    // We don't record keyCode when IME is using
    if (inComposition.current) return;

    lastKeyCode.current = keyCode;
  };

  const confirmChange = () => {
    onSave(current.trim());
  };

  const onKeyUp: React.KeyboardEventHandler<HTMLTextAreaElement> = ({
    keyCode,
    ctrlKey,
    altKey,
    metaKey,
    shiftKey,
  }) => {
    // Check if it's a real key
    if (
      lastKeyCode.current === keyCode &&
      !inComposition.current &&
      !ctrlKey &&
      !altKey &&
      !metaKey &&
      !shiftKey
    ) {
      if (keyCode === KeyCode.ENTER) {
        confirmChange();
        onEnd?.();
      } else if (keyCode === KeyCode.ESC) {
        onCancel();
      }
    }
  };

  const onBlur: React.FocusEventHandler<HTMLTextAreaElement> = () => {
    confirmChange();
  };

  const textClassName = component ? `${prefixCls}-${component}` : '';

  const textAreaClassName = classNames(
    prefixCls,
    `${prefixCls}-edit-content`,
    {
      [`${prefixCls}-rtl`]: direction === 'rtl',
    },
    className,
    textClassName,
  );

  return (
    <div className={textAreaClassName} style={style}>
      <TextArea
        ref={ref as any}
        maxLength={maxLength}
        value={current}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        onBlur={onBlur}
        aria-label={ariaLabel}
        rows={1}
        autoSize={autoSize}
      />
      {enterIcon !== null
        ? cloneElement(enterIcon, { className: `${prefixCls}-edit-content-confirm` })
        : null}
    </div>
  );
};

export default Editable;
