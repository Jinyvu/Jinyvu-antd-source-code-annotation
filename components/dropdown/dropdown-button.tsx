import EllipsisOutlined from '@ant-design/icons/EllipsisOutlined';
import classNames from 'classnames';
import * as React from 'react';
import type { ButtonProps } from '../button';
import Button from '../button';
import type { ButtonHTMLType } from '../button/button';
import type { ButtonGroupProps } from '../button/button-group';
import { ConfigContext } from '../config-provider';
import type { DropdownProps } from './dropdown';
import Dropdown from './dropdown';

const ButtonGroup = Button.Group;

export type DropdownButtonType = 'default' | 'primary' | 'ghost' | 'dashed' | 'link' | 'text';

export interface DropdownButtonProps extends ButtonGroupProps, DropdownProps {
  type?: DropdownButtonType;
  htmlType?: ButtonHTMLType;
  disabled?: boolean; // 是否禁用
  loading?: ButtonProps['loading']; // 设置按钮载入状态
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  icon?: React.ReactNode; // 右侧图标
  href?: string; // 按钮目标地址
  children?: React.ReactNode;
  title?: string;
  buttonsRender?: (buttons: React.ReactNode[]) => React.ReactNode[]; // 自定义左右两个按钮
}

interface DropdownButtonInterface extends React.FC<DropdownButtonProps> {
  __ANT_BUTTON: boolean;
}

/** 左按钮+右按钮，外面再包裹一层Button.Group 左按钮就是普通按钮 右按钮就是DropDown里面包含一个按钮 */
const DropdownButton: DropdownButtonInterface = props => {
  const {
    getPopupContainer: getContextPopupContainer,
    getPrefixCls,
    direction,
  } = React.useContext(ConfigContext);

  const {
    prefixCls: customizePrefixCls,
    type = 'default',
    disabled,
    loading,
    onClick,
    htmlType,
    children,
    className,
    overlay,
    trigger,
    align,
    visible,
    onVisibleChange,
    placement,
    getPopupContainer,
    href,
    icon = <EllipsisOutlined />,
    title,
    buttonsRender = (buttons: React.ReactNode[]) => buttons,
    mouseEnterDelay,
    mouseLeaveDelay,
    overlayClassName,
    overlayStyle,
    destroyPopupOnHide,
    ...restProps
  } = props;

  const prefixCls = getPrefixCls('dropdown-button', customizePrefixCls);
  const dropdownProps = {
    align,
    overlay,
    disabled,
    trigger: disabled ? [] : trigger,
    onVisibleChange,
    getPopupContainer: getPopupContainer || getContextPopupContainer,
    mouseEnterDelay,
    mouseLeaveDelay,
    overlayClassName,
    overlayStyle,
    destroyPopupOnHide,
  } as DropdownProps;

  if ('visible' in props) {
    dropdownProps.visible = visible;
  }

  if ('placement' in props) {
    dropdownProps.placement = placement;
  } else {
    dropdownProps.placement = direction === 'rtl' ? 'bottomLeft' : 'bottomRight';
  }

  // 左边按钮，用作普通按钮
  const leftButton = (
    <Button
      type={type}
      disabled={disabled}
      loading={loading}
      onClick={onClick}
      htmlType={htmlType}
      href={href}
      title={title}
    >
      {children}
    </Button>
  );

  // 右边按钮，用作下拉菜单目标对象
  const rightButton = <Button type={type} icon={icon} />;

  const [leftButtonToRender, rightButtonToRender] = buttonsRender!([leftButton, rightButton]);

  return (
    <ButtonGroup {...restProps} className={classNames(prefixCls, className)}>
      {leftButtonToRender}
      <Dropdown {...dropdownProps}>{rightButtonToRender}</Dropdown>
    </ButtonGroup>
  );
};

DropdownButton.__ANT_BUTTON = true;

export default DropdownButton;
