import SearchOutlined from '@ant-design/icons/SearchOutlined';
import classNames from 'classnames';
import { composeRef } from 'rc-util/lib/ref';
import * as React from 'react';
import Button from '../button';
import { ConfigContext } from '../config-provider';
import SizeContext from '../config-provider/SizeContext';
import { cloneElement } from '../_util/reactNode';
import type { InputProps, InputRef } from './Input';
import Input from './Input';

export interface SearchProps extends InputProps {
  inputPrefixCls?: string;
  onSearch?: (
    // 点击搜索图标、清除图标，或按下回车键时的回调
    value: string,
    event?:
      | React.ChangeEvent<HTMLInputElement>
      | React.MouseEvent<HTMLElement>
      | React.KeyboardEvent<HTMLInputElement>,
  ) => void;
  enterButton?: React.ReactNode; // 是否有确认按钮，可设为按钮文字。该属性会与 addonAfter 冲突。
  loading?: boolean; // 搜索 loading
}

/** 就是设置了特殊后缀标志的Input */
const Search = React.forwardRef<InputRef, SearchProps>((props, ref) => {
  const {
    prefixCls: customizePrefixCls,
    inputPrefixCls: customizeInputPrefixCls,
    className,
    size: customizeSize,
    suffix,
    enterButton = false,
    addonAfter,
    loading,
    disabled,
    onSearch: customOnSearch,
    onChange: customOnChange,
    onCompositionStart,
    onCompositionEnd,
    ...restProps
  } = props;

  const { getPrefixCls, direction } = React.useContext(ConfigContext);
  const contextSize = React.useContext(SizeContext);
  const composedRef = React.useRef<boolean>(false);

  const size = customizeSize || contextSize;

  const inputRef = React.useRef<InputRef>(null);

  /** OnChange事件处理函数；如果事件类型为click，则会先触发onSearch事件 */
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e && e.target && e.type === 'click' && customOnSearch) {
      customOnSearch((e as React.ChangeEvent<HTMLInputElement>).target.value, e);
    }
    if (customOnChange) {
      customOnChange(e);
    }
  };

  /** 禁用该组件鼠标按下事件 */
  const onMouseDown: React.MouseEventHandler<HTMLElement> = e => {
    if (document.activeElement === inputRef.current?.input) {
      e.preventDefault();
    }
  };

  const onSearch = (e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLInputElement>) => {
    if (customOnSearch) {
      customOnSearch(inputRef.current?.input?.value!, e);
    }
  };

  /** 按下enter键触发onSearch事件 */
  const onPressEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (composedRef.current) {
      return;
    }
    onSearch(e);
  };

  const prefixCls = getPrefixCls('input-search', customizePrefixCls);
  const inputPrefixCls = getPrefixCls('input', customizeInputPrefixCls);

  const searchIcon = typeof enterButton === 'boolean' ? <SearchOutlined /> : null;
  const btnClassName = `${prefixCls}-button`;

  // 渲染搜素按钮
  let button: React.ReactNode;
  const enterButtonAsElement = (enterButton || {}) as React.ReactElement;
  const isAntdButton =
    enterButtonAsElement.type && (enterButtonAsElement.type as typeof Button).__ANT_BUTTON === true;

  // 如果传入的是按钮元素，则为其重定义事件和属性
  if (isAntdButton || enterButtonAsElement.type === 'button') {
    button = cloneElement(enterButtonAsElement, {
      onMouseDown,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        enterButtonAsElement?.props?.onClick?.(e);
        onSearch(e);
      },
      key: 'enterButton',
      ...(isAntdButton
        ? {
            className: btnClassName,
            size,
          }
        : {}),
    });
  } else {
    button = (
      <Button
        className={btnClassName}
        type={enterButton ? 'primary' : undefined}
        size={size}
        disabled={disabled}
        key="enterButton"
        onMouseDown={onMouseDown}
        onClick={onSearch}
        loading={loading}
        icon={searchIcon}
      >
        {enterButton}
      </Button>
    );
  }

  if (addonAfter) {
    button = [
      button,
      cloneElement(addonAfter, {
        key: 'addonAfter',
      }),
    ];
  }

  const cls = classNames(
    prefixCls,
    {
      [`${prefixCls}-rtl`]: direction === 'rtl',
      [`${prefixCls}-${size}`]: !!size,
      [`${prefixCls}-with-button`]: !!enterButton,
    },
    className,
  );

  const handleOnCompositionStart: React.CompositionEventHandler<HTMLInputElement> = e => {
    composedRef.current = true;
    onCompositionStart?.(e);
  };

  const handleOnCompositionEnd: React.CompositionEventHandler<HTMLInputElement> = e => {
    composedRef.current = false;
    onCompositionEnd?.(e);
  };

  return (
    <Input
      ref={composeRef<InputRef>(inputRef, ref)}
      onPressEnter={onPressEnter}
      {...restProps}
      size={size}
      onCompositionStart={handleOnCompositionStart}
      onCompositionEnd={handleOnCompositionEnd}
      prefixCls={inputPrefixCls}
      addonAfter={button}
      suffix={suffix}
      onChange={onChange}
      className={cls}
      disabled={disabled}
    />
  );
});
if (process.env.NODE_ENV !== 'production') {
  Search.displayName = 'Search';
}

export default Search;
