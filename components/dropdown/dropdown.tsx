import RightOutlined from '@ant-design/icons/RightOutlined';
import classNames from 'classnames';
import RcDropdown from 'rc-dropdown'; // React Dropdown组件，可在npm下载
import useEvent from 'rc-util/lib/hooks/useEvent'; // 自定义函数，功能类似React.useEvent
import useMergedState from 'rc-util/lib/hooks/useMergedState'; // 约等于React.
import * as React from 'react';
import { ConfigContext } from '../config-provider';
import { OverrideProvider } from '../menu/OverrideContext';
import getPlacements from '../_util/placements'; // 获取菜单弹出位置
import { cloneElement } from '../_util/reactNode';
import { tuple } from '../_util/type';
import warning from '../_util/warning';
import DropdownButton from './dropdown-button';

const Placements = tuple(
  'topLeft',
  'topCenter',
  'topRight',
  'bottomLeft',
  'bottomCenter',
  'bottomRight',
  'top',
  'bottom',
);

type Placement = typeof Placements[number];

type OverlayFunc = () => React.ReactElement;

type Align = {
  points?: [string, string];
  offset?: [number, number];
  targetOffset?: [number, number];
  overflow?: {
    adjustX?: boolean;
    adjustY?: boolean;
  };
  useCssRight?: boolean;
  useCssBottom?: boolean;
  useCssTransform?: boolean;
};

export type DropdownArrowOptions = {
  pointAtCenter?: boolean;
};

export interface DropdownProps {
  autoFocus?: boolean; // 打开后自动聚焦下拉框
  arrow?: boolean | DropdownArrowOptions; // 下拉框箭头是否显示
  trigger?: ('click' | 'hover' | 'contextMenu')[]; // 触发下拉的行为, 移动端不支持 hover
  overlay: React.ReactElement | OverlayFunc; // 菜单
  onVisibleChange?: (visible: boolean) => void;
  visible?: boolean;
  disabled?: boolean; // 菜单是否禁用
  destroyPopupOnHide?: boolean; // 关闭后是否销毁 Dropdown
  align?: Align;
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement; // 菜单渲染父节点，默认渲染到 **body** 上
  prefixCls?: string;
  className?: string;
  transitionName?: string;
  placement?: Placement; // 菜单弹出位置
  overlayClassName?: string; // 下拉根元素的类名称
  overlayStyle?: React.CSSProperties; // 下拉根元素的样式
  forceRender?: boolean;
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
  openClassName?: string;
  children?: React.ReactNode;
}

interface DropdownInterface extends React.FC<DropdownProps> {
  Button: typeof DropdownButton;
}

/**
 * 在现有组件rc-dropdown上封装而来 Dropdown组件只能有一个子组件，作为下拉框触发元素
 * 传入的overlay参数为下拉菜单，一般是Menu组件，但没有限制。会在overlay上加上一层context在作为rc-dropdown的"overlay"参数
 * overlay的位置是由js计算而出，不是由css控制
 */
const Dropdown: DropdownInterface = props => {
  const {
    getPopupContainer: getContextPopupContainer,
    getPrefixCls,
    direction,
  } = React.useContext(ConfigContext);

  /** 获取样式名称 */
  const getTransitionName = () => {
    const rootPrefixCls = getPrefixCls();
    const { placement = '', transitionName } = props;
    if (transitionName !== undefined) {
      return transitionName;
    }
    if (placement.indexOf('top') >= 0) {
      return `${rootPrefixCls}-slide-down`;
    }
    return `${rootPrefixCls}-slide-up`;
  };

  /** 获取菜单弹出位置 */
  const getPlacement = () => {
    const { placement } = props;
    if (!placement) {
      return direction === 'rtl' ? ('bottomRight' as Placement) : ('bottomLeft' as Placement);
    }

    if (placement.includes('Center')) {
      const newPlacement = placement.slice(0, placement.indexOf('Center'));
      warning(
        !placement.includes('Center'),
        'Dropdown',
        `You are using '${placement}' placement in Dropdown, which is deprecated. Try to use '${newPlacement}' instead.`,
      );
      return newPlacement;
    }

    return placement;
  };

  const {
    arrow,
    prefixCls: customizePrefixCls,
    children,
    trigger,
    disabled,
    getPopupContainer,
    overlayClassName,
    visible,
    onVisibleChange,
  } = props;

  const prefixCls = getPrefixCls('dropdown', customizePrefixCls);
  // 判断获取的children是不是只有一个，如果是，就返回这个children, 如果不是，则报错
  const child = React.Children.only(children) as React.ReactElement<any>;

  // 下拉框触发元素
  const dropdownTrigger = cloneElement(child, {
    className: classNames(
      `${prefixCls}-trigger`,
      {
        [`${prefixCls}-rtl`]: direction === 'rtl',
      },
      child.props.className,
    ),
    disabled,
  });

  const triggerActions = disabled ? [] : trigger;
  let alignPoint;
  if (triggerActions && triggerActions.indexOf('contextMenu') !== -1) {
    alignPoint = true;
  }

  // =========================== Visible ============================
  const [mergedVisible, setVisible] = useMergedState(false, {
    value: visible,
  });

  const onInnerVisibleChange = useEvent((nextVisible: boolean) => {
    onVisibleChange?.(nextVisible);
    setVisible(nextVisible);
  });

  // =========================== Overlay ============================ 弹出的下拉菜单
  const overlayClassNameCustomized = classNames(overlayClassName, {
    [`${prefixCls}-rtl`]: direction === 'rtl',
  });

  const builtinPlacements = getPlacements({
    arrowPointAtCenter: typeof arrow === 'object' && arrow.pointAtCenter,
    autoAdjustOverflow: true,
  });

  const onMenuClick = React.useCallback(() => {
    setVisible(false);
  }, []);

  /** 渲染下拉菜单 */
  const renderOverlay = () => {
    // rc-dropdown already can process the function of overlay, but we have check logic here.
    // So we need render the element to check and pass back to rc-dropdown.
    const { overlay } = props;

    let overlayNode;
    if (typeof overlay === 'function') {
      overlayNode = (overlay as OverlayFunc)();
    } else {
      overlayNode = overlay;
    }
    overlayNode = React.Children.only(
      typeof overlayNode === 'string' ? <span>{overlayNode}</span> : overlayNode,
    );

    return (
      <OverrideProvider
        prefixCls={`${prefixCls}-menu`}
        expandIcon={
          <span className={`${prefixCls}-menu-submenu-arrow`}>
            <RightOutlined className={`${prefixCls}-menu-submenu-arrow-icon`} />
          </span>
        }
        mode="vertical"
        selectable={false}
        onClick={onMenuClick}
        validator={({ mode }) => {
          // Warning if use other mode
          warning(
            !mode || mode === 'vertical',
            'Dropdown',
            `mode="${mode}" is not supported for Dropdown's Menu.`,
          );
        }}
      >
        {overlayNode}
      </OverrideProvider>
    );
  };

  // ============================ Render ============================
  return (
    <RcDropdown
      alignPoint={alignPoint}
      {...props}
      visible={mergedVisible}
      builtinPlacements={builtinPlacements}
      arrow={!!arrow}
      overlayClassName={overlayClassNameCustomized}
      prefixCls={prefixCls}
      getPopupContainer={getPopupContainer || getContextPopupContainer}
      transitionName={getTransitionName()}
      trigger={triggerActions}
      overlay={renderOverlay}
      placement={getPlacement()}
      onVisibleChange={onInnerVisibleChange}
    >
      {dropdownTrigger}
    </RcDropdown>
  );
};

Dropdown.Button = DropdownButton;

Dropdown.defaultProps = {
  mouseEnterDelay: 0.15,
  mouseLeaveDelay: 0.1,
};

export default Dropdown;
