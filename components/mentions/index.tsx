import classNames from 'classnames';
import RcMentions from 'rc-mentions';
import type { MentionsProps as RcMentionsProps } from 'rc-mentions/lib/Mentions';
import { composeRef } from 'rc-util/lib/ref';
import * as React from 'react';
import { ConfigContext } from '../config-provider';
import defaultRenderEmpty from '../config-provider/defaultRenderEmpty';
import { FormItemInputContext } from '../form/context';
import Spin from '../spin';
import type { InputStatus } from '../_util/statusUtils';
import { getMergedStatus, getStatusClassNames } from '../_util/statusUtils';

export const { Option } = RcMentions;

function loadingFilterOption() {
  return true;
}

export type MentionPlacement = 'top' | 'bottom';

export interface OptionProps {
  value: string;
  children: React.ReactNode;
  [key: string]: any;
}

export interface MentionProps extends RcMentionsProps {
  loading?: boolean;
  status?: InputStatus;
}

export interface MentionState {
  focused: boolean;
}

interface MentionsConfig {
  prefix?: string | string[]; // 触发提示的关键字
  split?: string;
}

interface MentionsEntity {
  prefix: string;
  value: string;
}

interface CompoundedComponent
  extends React.ForwardRefExoticComponent<MentionProps & React.RefAttributes<HTMLElement>> {
  Option: typeof Option;
  getMentions: (value: string, config?: MentionsConfig) => MentionsEntity[];
}

/** Rc-mentions上的封装 */
const InternalMentions: React.ForwardRefRenderFunction<unknown, MentionProps> = (
  {
    prefixCls: customizePrefixCls,
    className,
    disabled,
    loading,
    filterOption, // 自定义过滤逻辑
    children,
    notFoundContent, // 当下拉列表为空时显示的内容
    status: customStatus,
    ...restProps
  },
  ref,
) => {
  const [focused, setFocused] = React.useState(false);
  const innerRef = React.useRef<HTMLElement>();
  const mergedRef = composeRef(ref, innerRef);
  const { getPrefixCls, renderEmpty, direction } = React.useContext(ConfigContext);
  const {
    status: contextStatus,
    hasFeedback,
    feedbackIcon,
  } = React.useContext(FormItemInputContext);
  const mergedStatus = getMergedStatus(contextStatus, customStatus);

  const onFocus: React.FocusEventHandler<HTMLTextAreaElement> = (...args) => {
    if (restProps.onFocus) {
      restProps.onFocus(...args);
    }
    setFocused(true);
  };

  const onBlur: React.FocusEventHandler<HTMLTextAreaElement> = (...args) => {
    if (restProps.onBlur) {
      restProps.onBlur(...args);
    }

    setFocused(false);
  };

  // 渲染当下拉列表为空时显示的内容
  const getNotFoundContent = () => {
    if (notFoundContent !== undefined) {
      return notFoundContent;
    }

    return (renderEmpty || defaultRenderEmpty)('Select');
  };

  // 渲染Options选项，如果处于loading状态，则渲染loading图标
  const getOptions = () => {
    if (loading) {
      return (
        <Option value="ANTD_SEARCHING" disabled>
          <Spin size="small" />
        </Option>
      );
    }

    return children;
  };

  // 获取过滤逻辑
  const getFilterOption = (): any => {
    if (loading) {
      return loadingFilterOption;
    }
    return filterOption;
  };

  const prefixCls = getPrefixCls('mentions', customizePrefixCls);

  const mergedClassName = classNames(
    {
      [`${prefixCls}-disabled`]: disabled,
      [`${prefixCls}-focused`]: focused,
      [`${prefixCls}-rtl`]: direction === 'rtl',
    },
    getStatusClassNames(prefixCls, mergedStatus),
    !hasFeedback && className,
  );

  // 渲染Mentions，在键盘按下时根据设置的prefix筛选Options，在键盘松开时渲染出来
  const mentions = (
    <RcMentions
      prefixCls={prefixCls}
      notFoundContent={getNotFoundContent()}
      className={mergedClassName}
      disabled={disabled}
      direction={direction}
      {...restProps}
      filterOption={getFilterOption()}
      onFocus={onFocus}
      onBlur={onBlur}
      ref={mergedRef as any}
    >
      {getOptions()}
    </RcMentions>
  );

  // 如果有feedback，则包裹Mentions和feedback
  if (hasFeedback) {
    return (
      <div
        className={classNames(
          `${prefixCls}-affix-wrapper`,
          getStatusClassNames(`${prefixCls}-affix-wrapper`, mergedStatus, hasFeedback),
          className,
        )}
      >
        {mentions}
        <span className={`${prefixCls}-suffix`}>{feedbackIcon}</span>
      </div>
    );
  }

  return mentions;
};

const Mentions = React.forwardRef<unknown, MentionProps>(InternalMentions) as CompoundedComponent;
if (process.env.NODE_ENV !== 'production') {
  Mentions.displayName = 'Mentions';
}
Mentions.Option = Option;

Mentions.getMentions = (value: string = '', config: MentionsConfig = {}): MentionsEntity[] => {
  const { prefix = '@', split = ' ' } = config;
  const prefixList: string[] = Array.isArray(prefix) ? prefix : [prefix];

  return value
    .split(split)
    .map((str = ''): MentionsEntity | null => {
      let hitPrefix: string | null = null;

      prefixList.some(prefixStr => {
        const startStr = str.slice(0, prefixStr.length);
        if (startStr === prefixStr) {
          hitPrefix = prefixStr;
          return true;
        }
        return false;
      });

      if (hitPrefix !== null) {
        return {
          prefix: hitPrefix,
          value: str.slice((hitPrefix as string).length),
        };
      }
      return null;
    })
    .filter((entity): entity is MentionsEntity => !!entity && !!entity.value);
};

export default Mentions;
