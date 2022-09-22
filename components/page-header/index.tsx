import ArrowLeftOutlined from '@ant-design/icons/ArrowLeftOutlined';
import ArrowRightOutlined from '@ant-design/icons/ArrowRightOutlined';
import classNames from 'classnames';
import ResizeObserver from 'rc-resize-observer';
import useState from 'rc-util/lib/hooks/useState';
import * as React from 'react';
import type { AvatarProps } from '../avatar';
import Avatar from '../avatar';
import type { BreadcrumbProps } from '../breadcrumb';
import Breadcrumb from '../breadcrumb';
import type { ConfigConsumerProps, DirectionType } from '../config-provider';
import { ConfigConsumer } from '../config-provider';
import LocaleReceiver from '../locale-provider/LocaleReceiver';
import Space from '../space';
import type { TagType } from '../tag';
import TransButton from '../_util/transButton';

export interface PageHeaderProps {
  backIcon?: React.ReactNode; // 自定义 back icon ，如果为 false 不渲染 back icon
  prefixCls?: string;
  title?: React.ReactNode; // 自定义标题文字
  subTitle?: React.ReactNode; // 自定义的二级标题文字
  style?: React.CSSProperties;
  breadcrumb?: BreadcrumbProps | React.ReactElement<typeof Breadcrumb>; // 面包屑的配置
  breadcrumbRender?: (props: PageHeaderProps, defaultDom: React.ReactNode) => React.ReactNode; // 自定义面包屑区域的内容
  tags?: React.ReactElement<TagType> | React.ReactElement<TagType>[]; // title 旁的 tag 列表
  footer?: React.ReactNode; // PageHeader 的页脚，一般用于渲染 TabBar
  extra?: React.ReactNode; // 操作区，位于 title 行的行尾
  avatar?: AvatarProps; // 标题栏旁的头像
  onBack?: (e?: React.MouseEvent<HTMLDivElement>) => void; // 返回按钮的点击事件
  className?: string;
  ghost?: boolean; // 	pageHeader 的类型，将会改变背景颜色
  children?: React.ReactNode;
}

/**
 * 渲染返回按钮， 使用自定义按钮包裹按钮图标 最外层使用LocaleReceiver包裹，实现国际化
 * antd国际化主要运用context，每一个需要用到国际化的组件用context消费组件包裹，取到语言包，如果最外层没有用configprovider包裹就取默认的英文，如果有自己配置语言，就使用当前的语言包。
 */
const renderBack = (
  prefixCls: string,
  backIcon?: React.ReactNode,
  onBack?: (e?: React.MouseEvent<HTMLDivElement>) => void,
) => {
  if (!backIcon || !onBack) {
    return null;
  }
  return (
    <LocaleReceiver componentName="PageHeader">
      {({ back }: { back: string }) => (
        <div className={`${prefixCls}-back`}>
          <TransButton
            onClick={(e?: React.MouseEvent<HTMLDivElement>) => {
              onBack?.(e);
            }}
            className={`${prefixCls}-back-button`}
            aria-label={back}
          >
            {backIcon}
          </TransButton>
        </div>
      )}
    </LocaleReceiver>
  );
};

// 渲染面包屑
const renderBreadcrumb = (breadcrumb: BreadcrumbProps) => <Breadcrumb {...breadcrumb} />;

// 确定返回按钮图标
const getBackIcon = (props: PageHeaderProps, direction: DirectionType = 'ltr') => {
  if (props.backIcon !== undefined) {
    return props.backIcon;
  }
  return direction === 'rtl' ? <ArrowRightOutlined /> : <ArrowLeftOutlined />;
};

/** 渲染页眉部分 [ {返回按钮，人物头像，主标题，副标题，标签}， {额外部分} ] */
const renderTitle = (
  prefixCls: string,
  props: PageHeaderProps,
  direction: DirectionType = 'ltr',
) => {
  const { title, avatar, subTitle, tags, extra, onBack } = props;
  const headingPrefixCls = `${prefixCls}-heading`;
  const hasHeading = title || subTitle || tags || extra;
  // If there is nothing, return a null
  if (!hasHeading) {
    return null;
  }
  const backIcon = getBackIcon(props, direction);
  const backIconDom = renderBack(prefixCls, backIcon, onBack);
  const hasTitle = backIconDom || avatar || hasHeading;
  return (
    <div className={headingPrefixCls}>
      {hasTitle && (
        <div className={`${headingPrefixCls}-left`}>
          {backIconDom}
          {avatar && <Avatar {...avatar} />}
          {title && (
            <span
              className={`${headingPrefixCls}-title`}
              title={typeof title === 'string' ? title : undefined}
            >
              {title}
            </span>
          )}
          {subTitle && (
            <span
              className={`${headingPrefixCls}-sub-title`}
              title={typeof subTitle === 'string' ? subTitle : undefined}
            >
              {subTitle}
            </span>
          )}
          {tags && <span className={`${headingPrefixCls}-tags`}>{tags}</span>}
        </div>
      )}
      {extra && (
        <span className={`${headingPrefixCls}-extra`}>
          <Space>{extra}</Space>
        </span>
      )}
    </div>
  );
};

/** 渲染页脚 */
const renderFooter = (prefixCls: string, footer: React.ReactNode) => {
  if (footer) {
    return <div className={`${prefixCls}-footer`}>{footer}</div>;
  }
  return null;
};

/** 渲染主题内容 */
const renderChildren = (prefixCls: string, children: React.ReactNode) => (
  <div className={`${prefixCls}-content`}>{children}</div>
);

/** 渲染页头： 面包屑+页眉+主体内容+页脚 外层使用ResizeObserver包裹，判断页面宽度是否小于768px，从而更改不同样式 */
const PageHeader: React.FC<PageHeaderProps> = props => {
  const [compact, updateCompact] = useState(false);
  const onResize = ({ width }: { width: number }) => {
    updateCompact(width < 768, true);
  };
  return (
    <ConfigConsumer>
      {({ getPrefixCls, pageHeader, direction }: ConfigConsumerProps) => {
        const {
          prefixCls: customizePrefixCls,
          style,
          footer,
          children,
          breadcrumb,
          breadcrumbRender,
          className: customizeClassName,
        } = props;
        let ghost: undefined | boolean = true;

        // Use `ghost` from `props` or from `ConfigProvider` instead.
        if ('ghost' in props) {
          ghost = props.ghost;
        } else if (pageHeader && 'ghost' in pageHeader) {
          ghost = pageHeader.ghost;
        }

        const prefixCls = getPrefixCls('page-header', customizePrefixCls);

        // 确定面包屑
        const getDefaultBreadcrumbDom = () => {
          if ((breadcrumb as BreadcrumbProps)?.routes) {
            return renderBreadcrumb(breadcrumb as BreadcrumbProps);
          }
          return null;
        };

        const defaultBreadcrumbDom = getDefaultBreadcrumbDom();

        const isBreadcrumbComponent = breadcrumb && 'props' in breadcrumb;
        // support breadcrumbRender function
        const breadcrumbRenderDomFromProps =
          breadcrumbRender?.(props, defaultBreadcrumbDom) ?? defaultBreadcrumbDom;

        const breadcrumbDom = isBreadcrumbComponent ? breadcrumb : breadcrumbRenderDomFromProps;

        const className = classNames(prefixCls, customizeClassName, {
          'has-breadcrumb': !!breadcrumbDom,
          'has-footer': !!footer,
          [`${prefixCls}-ghost`]: ghost,
          [`${prefixCls}-rtl`]: direction === 'rtl',
          [`${prefixCls}-compact`]: compact,
        });

        return (
          <ResizeObserver onResize={onResize}>
            <div className={className} style={style}>
              {breadcrumbDom}
              {renderTitle(prefixCls, props, direction)}
              {children && renderChildren(prefixCls, children)}
              {renderFooter(prefixCls, footer)}
            </div>
          </ResizeObserver>
        );
      }}
    </ConfigConsumer>
  );
};

export default PageHeader;
