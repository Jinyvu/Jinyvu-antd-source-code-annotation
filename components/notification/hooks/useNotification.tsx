import type {
  HolderReadyCallback as RCHolderReadyCallback,
  NoticeContent as RCNoticeContent,
  NotificationInstance as RCNotificationInstance,
} from 'rc-notification/lib/Notification';
import useRCNotification from 'rc-notification/lib/useNotification';
import * as React from 'react';
import type { ArgsProps, NotificationInstance } from '..';
import type { ConfigConsumerProps } from '../../config-provider';
import { ConfigConsumer } from '../../config-provider';

export default function createUseNotification(
  getNotificationInstance: (
    args: ArgsProps,
    callback: (info: { prefixCls: string; instance: RCNotificationInstance }) => void,
  ) => void,
  getRCNoticeProps: (args: ArgsProps, prefixCls: string) => RCNoticeContent,
) {
  const useNotification = (): readonly [NotificationInstance, React.ReactElement] => {
    // We can only get content by render
    let getPrefixCls: ConfigConsumerProps['getPrefixCls'];

    // We create a proxy to handle delay created instance
    let innerInstance: RCNotificationInstance | null = null;
    const proxy = {
      add: (noticeProps: RCNoticeContent, holderCallback?: RCHolderReadyCallback) => {
        innerInstance?.component.add(noticeProps, holderCallback);
      },
    } as any;

    const [hookNotify, holder] = useRCNotification(proxy);

    function notify(args: ArgsProps) {
      const { prefixCls: customizePrefixCls } = args;
      const mergedPrefixCls = getPrefixCls('notification', customizePrefixCls);

      getNotificationInstance(
        {
          ...args,
          prefixCls: mergedPrefixCls,
        },
        ({ prefixCls, instance }) => {
          innerInstance = instance;
          hookNotify(getRCNoticeProps(args, prefixCls));
        },
      );
    }

    // Fill functions
    const hookApiRef = React.useRef<any>({});

    hookApiRef.current.open = notify;

    ['success', 'info', 'warning', 'error'].forEach(type => {
      hookApiRef.current[type] = (args: ArgsProps) =>
        hookApiRef.current.open({
          ...args,
          type,
        });
    });

    return [
      hookApiRef.current,
      <ConfigConsumer key="holder">
        {(context: ConfigConsumerProps) => {
          ({ getPrefixCls } = context);
          return holder;
        }}
      </ConfigConsumer>,
    ] as const;
  };

  return useNotification;
}
