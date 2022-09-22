import addEventListener from 'rc-util/lib/Dom/addEventListener';

export type BindElement = HTMLElement | Window | null | undefined;

/** 返回元素的大小及其相对于视口的位置，如果是window对象则返回{top: 0, bottom: window.innerHeight} */
export function getTargetRect(target: BindElement): DOMRect {
  return target !== window
    ? (target as HTMLElement).getBoundingClientRect()
    : ({ top: 0, bottom: window.innerHeight } as DOMRect);
}

/** 如果盒子距离目标容器顶部的高度小于指定的偏移值，则返回目标盒子距离视口顶部高度+指定的偏移值 */
export function getFixedTop(placeholderReact: DOMRect, targetRect: DOMRect, offsetTop?: number) {
  if (offsetTop !== undefined && targetRect.top > placeholderReact.top - offsetTop) {
    return offsetTop + targetRect.top;
  }
  return undefined;
}

/** 如果盒子距离目标容器底部的距离小于指定的偏移值，则返回目标盒子距离视口底部高度+指定的偏移值 */
export function getFixedBottom(
  placeholderReact: DOMRect,
  targetRect: DOMRect,
  offsetBottom?: number,
) {
  if (offsetBottom !== undefined && targetRect.bottom < placeholderReact.bottom + offsetBottom) {
    const targetBottomOffset = window.innerHeight - targetRect.bottom;
    return offsetBottom + targetBottomOffset;
  }
  return undefined;
}

// ======================== Observer ========================
const TRIGGER_EVENTS = [
  'resize',
  'scroll',
  'touchstart',
  'touchmove',
  'touchend',
  'pageshow',
  'load',
];

interface ObserverEntity {
  target: HTMLElement | Window;
  affixList: any[];
  eventHandlers: { [eventName: string]: any };
}

// 被设置固定的对象列表
let observerEntities: ObserverEntity[] = [];

export function getObserverEntities() {
  // Only used in test env. Can be removed if refactor.
  return observerEntities;
}

/** 初始化固钉的目标对象，并添加到observerEntities */
export function addObserveTarget<T>(target: HTMLElement | Window | null, affix: T): void {
  if (!target) return;

  let entity: ObserverEntity | undefined = observerEntities.find(item => item.target === target);

  if (entity) {
    entity.affixList.push(affix);
  } else {
    entity = {
      target,
      affixList: [affix],
      eventHandlers: {},
    };
    observerEntities.push(entity);

    // Add listener 为被观察的对象注册事件
    TRIGGER_EVENTS.forEach(eventName => {
      entity!.eventHandlers[eventName] = addEventListener(target, eventName, () => {
        entity!.affixList.forEach(targetAffix => {
          targetAffix.lazyUpdatePosition();
        });
      });
    });
  }
}

/** 移除固钉目标对象 */
export function removeObserveTarget<T>(affix: T): void {
  const observerEntity = observerEntities.find(oriObserverEntity => {
    const hasAffix = oriObserverEntity.affixList.some(item => item === affix);
    if (hasAffix) {
      oriObserverEntity.affixList = oriObserverEntity.affixList.filter(item => item !== affix);
    }
    return hasAffix;
  });

  if (observerEntity && observerEntity.affixList.length === 0) {
    observerEntities = observerEntities.filter(item => item !== observerEntity);

    // Remove listener
    TRIGGER_EVENTS.forEach(eventName => {
      const handler = observerEntity.eventHandlers[eventName];
      if (handler && handler.remove) {
        handler.remove();
      }
    });
  }
}
