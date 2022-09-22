import { createContext } from 'react';
import type { DirectionType } from '../config-provider';

export type MenuTheme = 'light' | 'dark';

export interface MenuContextProps {
  prefixCls: string;
  inlineCollapsed: boolean; // inline 时菜单是否收起状态
  antdMenuTheme?: MenuTheme; // 菜单主题
  direction?: DirectionType;
  firstLevel: boolean; // 是否是第一层菜单
  /** @private Internal Usage. Safe to remove */
  disableMenuItemTitleTooltip?: boolean; // 是否禁用提示信息
}

const MenuContext = createContext<MenuContextProps>({
  prefixCls: '',
  firstLevel: true,
  inlineCollapsed: false,
});

export default MenuContext;
