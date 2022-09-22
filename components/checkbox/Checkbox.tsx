import classNames from 'classnames';
import RcCheckbox from 'rc-checkbox';
import * as React from 'react';
import { useContext } from 'react';
import { ConfigContext } from '../config-provider';
import { FormItemInputContext } from '../form/context';
import warning from '../_util/warning';
import { GroupContext } from './Group';
import DisabledContext from '../config-provider/DisabledContext';

export interface AbstractCheckboxProps<T> {
  prefixCls?: string;
  className?: string;
  defaultChecked?: boolean; // 初始是否选中
  checked?: boolean; // 当前是否选中
  style?: React.CSSProperties;
  disabled?: boolean;
  onChange?: (e: T) => void;
  onClick?: React.MouseEventHandler<HTMLElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLElement>;
  onKeyPress?: React.KeyboardEventHandler<HTMLElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
  value?: any; // 指定选中的选项
  tabIndex?: number;
  name?: string;
  children?: React.ReactNode;
  id?: string;
  autoFocus?: boolean; // 自动聚焦
  type?: string;
  skipGroup?: boolean; // 断言当前Checkbox之上没有Checkbox Group
}

export interface CheckboxChangeEventTarget extends CheckboxProps {
  checked: boolean;
}

export interface CheckboxChangeEvent {
  target: CheckboxChangeEventTarget;
  stopPropagation: () => void;
  preventDefault: () => void;
  nativeEvent: MouseEvent;
}

export interface CheckboxProps extends AbstractCheckboxProps<CheckboxChangeEvent> {
  indeterminate?: boolean; // 实现全选效果时，为true表示选中数量n > 0 && n < 总共选项的数量
}

/** 使用label包裹rc-checkbox和选项的名称 主要逻辑在于将选框状态（当前的value）同步到上一层选框组 */
const InternalCheckbox: React.ForwardRefRenderFunction<HTMLInputElement, CheckboxProps> = (
  {
    prefixCls: customizePrefixCls,
    className,
    children,
    indeterminate = false,
    style,
    onMouseEnter,
    onMouseLeave,
    skipGroup = false,
    disabled,
    ...restProps
  },
  ref,
) => {
  const { getPrefixCls, direction } = React.useContext(ConfigContext);
  const checkboxGroup = React.useContext(GroupContext); // 当前Checkbox的上一层Checkbox Group
  const { isFormItemInput } = useContext(FormItemInputContext);
  const contextDisabled = useContext(DisabledContext);
  const mergedDisabled = disabled || checkboxGroup?.disabled || contextDisabled;

  const prevValue = React.useRef(restProps.value);

  // 将选项的值注册到选项组上
  React.useEffect(() => {
    checkboxGroup?.registerValue(restProps.value);
    warning(
      'checked' in restProps || !!checkboxGroup || !('value' in restProps),
      'Checkbox',
      '`value` is not a valid prop, do you mean `checked`?',
    );
  }, []);

  // 将选项当前值同步到选项组上
  React.useEffect(() => {
    if (skipGroup) {
      return;
    }
    if (restProps.value !== prevValue.current) {
      checkboxGroup?.cancelValue(prevValue.current);
      checkboxGroup?.registerValue(restProps.value);
      prevValue.current = restProps.value;
    }
    return () => checkboxGroup?.cancelValue(restProps.value);
  }, [restProps.value]);

  const prefixCls = getPrefixCls('checkbox', customizePrefixCls);
  const checkboxProps: CheckboxProps = { ...restProps };
  // 选框状态改变时，触发传入的回调，同步选框组的数据
  if (checkboxGroup && !skipGroup) {
    checkboxProps.onChange = (...args) => {
      if (restProps.onChange) {
        restProps.onChange(...args);
      }
      if (checkboxGroup.toggleOption) {
        checkboxGroup.toggleOption({ label: children, value: restProps.value });
      }
    };
    checkboxProps.name = checkboxGroup.name;
    checkboxProps.checked = checkboxGroup.value.indexOf(restProps.value) !== -1;
  }
  const classString = classNames(
    {
      [`${prefixCls}-wrapper`]: true,
      [`${prefixCls}-rtl`]: direction === 'rtl',
      [`${prefixCls}-wrapper-checked`]: checkboxProps.checked,
      [`${prefixCls}-wrapper-disabled`]: mergedDisabled,
      [`${prefixCls}-wrapper-in-form-item`]: isFormItemInput,
    },
    className,
  );
  const checkboxClass = classNames({
    [`${prefixCls}-indeterminate`]: indeterminate,
  });
  const ariaChecked = indeterminate ? 'mixed' : undefined;
  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control
    <label
      className={classString}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <RcCheckbox
        aria-checked={ariaChecked}
        {...checkboxProps}
        prefixCls={prefixCls}
        className={checkboxClass}
        disabled={mergedDisabled}
        ref={ref}
      />
      {children !== undefined && <span>{children}</span>}
    </label>
  );
};

const Checkbox = React.forwardRef<unknown, CheckboxProps>(InternalCheckbox);
if (process.env.NODE_ENV !== 'production') {
  Checkbox.displayName = 'Checkbox';
}

export default Checkbox;
