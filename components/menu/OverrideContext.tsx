import * as React from 'react';
import type { MenuProps } from '.';

// Used for Dropdown only
export interface OverrideContextProps {
  // 与rc-menu选项对应
  prefixCls?: string;
  expandIcon?: React.ReactNode; // Specify the menu item icon.
  mode?: MenuProps['mode']; // one of ["horizontal","inline","vertical-left","vertical-right"]
  selectable?: boolean; // allow selecting menu items
  validator?: (menuProps: Pick<MenuProps, 'mode'>) => void;
  onClick?: () => void;
}

/** @private Internal Usage. Only used for Dropdown component. Do not use this in your production. */
const OverrideContext = React.createContext<OverrideContextProps | null>(null);

/** @private Internal Usage. Only used for Dropdown component. Do not use this in your production. */
export const OverrideProvider = ({
  children,
  ...restProps
}: OverrideContextProps & { children: React.ReactNode }) => {
  const override = React.useContext(OverrideContext);

  const context = React.useMemo(
    () => ({
      ...override,
      ...restProps,
    }),
    [
      override,
      restProps.prefixCls,
      // restProps.expandIcon, Not mark as deps since this is a ReactNode
      restProps.mode,
      restProps.selectable,
      // restProps.validator, Not mark as deps since this is a function
    ],
  );

  return <OverrideContext.Provider value={context}>{children}</OverrideContext.Provider>;
};

export default OverrideContext;
