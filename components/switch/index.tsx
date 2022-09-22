import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import classNames from 'classnames';
import RcSwitch from 'rc-switch';
import * as React from 'react';

import { ConfigContext } from '../config-provider';
import DisabledContext from '../config-provider/DisabledContext';
import SizeContext from '../config-provider/SizeContext';
import warning from '../_util/warning';
import Wave from '../_util/wave';

export type SwitchSize = 'small' | 'default';
export type SwitchChangeEventHandler = (
  checked: boolean,
  event: React.MouseEvent<HTMLButtonElement>,
) => void;
export type SwitchClickEventHandler = SwitchChangeEventHandler;

export interface SwitchProps {
  prefixCls?: string;
  size?: SwitchSize;
  className?: string;
  checked?: boolean; // 指定当前是否选中
  defaultChecked?: boolean; // 初始是否选中
  onChange?: SwitchChangeEventHandler;
  onClick?: SwitchClickEventHandler;
  checkedChildren?: React.ReactNode; // 选中时的内容
  unCheckedChildren?: React.ReactNode; // 非选中时的内容
  disabled?: boolean;
  loading?: boolean; // 加载中的开关
  autoFocus?: boolean; // 组件自动获取焦点
  style?: React.CSSProperties;
  title?: string;
  tabIndex?: number;
  id?: string;
}

interface CompoundedComponent
  extends React.ForwardRefExoticComponent<SwitchProps & React.RefAttributes<HTMLElement>> {
  __ANT_SWITCH: boolean;
}

/**
 * 使用Wave组件包裹rc-switch， Wave的作用是点击时触发波浪效果 rc-switch的结构为: <button>   <div></div> // 圆形
 *    <span></span> // 开关上显示的文字
 * </button>
 * 通过样式改变反应switch的切换
 */
const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      prefixCls: customizePrefixCls,
      size: customizeSize,
      disabled: customDisabled,
      loading,
      className = '',
      ...props
    },
    ref,
  ) => {
    warning(
      'checked' in props || !('value' in props),
      'Switch',
      '`value` is not a valid prop, do you mean `checked`?',
    );

    const { getPrefixCls, direction } = React.useContext(ConfigContext);
    const size = React.useContext(SizeContext);

    // ===================== Disabled =====================
    const disabled = React.useContext(DisabledContext);
    const mergedDisabled = customDisabled || disabled || loading;

    const prefixCls = getPrefixCls('switch', customizePrefixCls);

    // 渲染加载图标
    const loadingIcon = (
      <div className={`${prefixCls}-handle`}>
        {loading && <LoadingOutlined className={`${prefixCls}-loading-icon`} />}
      </div>
    );

    const classes = classNames(
      {
        [`${prefixCls}-small`]: (customizeSize || size) === 'small',
        [`${prefixCls}-loading`]: loading,
        [`${prefixCls}-rtl`]: direction === 'rtl',
      },
      className,
    );

    return (
      <Wave insertExtraNode>
        <RcSwitch
          {...props}
          prefixCls={prefixCls}
          className={classes}
          disabled={mergedDisabled}
          ref={ref}
          loadingIcon={loadingIcon}
        />
      </Wave>
    );
  },
) as CompoundedComponent;

Switch.__ANT_SWITCH = true;
if (process.env.NODE_ENV !== 'production') {
  Switch.displayName = 'Switch';
}

export default Switch;
