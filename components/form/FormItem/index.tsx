import type { FormInstance } from 'rc-field-form';
import { Field, FieldContext, ListContext } from 'rc-field-form';
import type { FieldProps } from 'rc-field-form/lib/Field';
import type { Meta, NamePath } from 'rc-field-form/lib/interface';
import useState from 'rc-util/lib/hooks/useState';
import { supportRef } from 'rc-util/lib/ref';
import * as React from 'react';
import { useContext } from 'react';
import useFormItemStatus from '../hooks/useFormItemStatus'; // 获取表单项状态
import { ConfigContext } from '../../config-provider';
import { cloneElement, isValidElement } from '../../_util/reactNode';
import { tuple } from '../../_util/type';
import warning from '../../_util/warning';
import { FormContext, NoStyleItemContext } from '../context'; // 样式相关
import type { FormItemInputProps } from '../FormItemInput';
import type { FormItemLabelProps, LabelTooltipType } from '../FormItemLabel';
import useFrameState from '../hooks/useFrameState'; // 用于注册在每个动画帧后悔调用的函数，用法类似useState
import useItemRef from '../hooks/useItemRef'; // ?
import { getFieldId, toArray } from '../util';
import ItemHolder from './ItemHolder';

const NAME_SPLIT = '__SPLIT__';

interface FieldError {
  errors: string[];
  warnings: string[];
}

const ValidateStatuses = tuple('success', 'warning', 'error', 'validating', '');
export type ValidateStatus = typeof ValidateStatuses[number];

type RenderChildren<Values = any> = (form: FormInstance<Values>) => React.ReactNode;
type RcFieldProps<Values = any> = Omit<FieldProps<Values>, 'children'>;
type ChildrenType<Values = any> = RenderChildren<Values> | React.ReactNode;

interface MemoInputProps {
  value: any;
  update: any;
  children: React.ReactNode;
}

const MemoInput = React.memo(
  ({ children }: MemoInputProps) => children as JSX.Element,
  (prev, next) => prev.value === next.value && prev.update === next.update,
);

export interface FormItemProps<Values = any>
  extends FormItemLabelProps,
    FormItemInputProps,
    RcFieldProps<Values> {
  prefixCls?: string;
  noStyle?: boolean; // 为 true 时不带样式，作为纯字段控件使用
  style?: React.CSSProperties;
  className?: string;
  children?: ChildrenType<Values>;
  id?: string;
  hasFeedback?: boolean; // 配合 validateStatus 属性使用，展示校验状态图标，建议只配合 Input 组件使用
  validateStatus?: ValidateStatus; // 校验状态，如不设置，则会根据校验规则自动生成，可选：'success' 'warning' 'error' 'validating'
  required?: boolean; // 必填样式设置。如不设置，则会根据校验规则自动生成
  hidden?: boolean; // 是否隐藏字段（依然会收集和校验字段）
  initialValue?: any; // 设置子元素默认值，如果与 Form 的 initialValues 冲突则以 Form 为准
  messageVariables?: Record<string, string>; // 	默认验证字段的信息
  tooltip?: LabelTooltipType; // 配置提示信息
  /** @deprecated No need anymore */
  fieldKey?: React.Key | React.Key[];
}

// 判断是否设置了有效的name
function hasValidName(name?: NamePath): Boolean {
  if (name === null) {
    warning(false, 'Form.Item', '`null` is passed as `name` property');
  }
  return !(name === undefined || name === null);
}

// 生成空标签
function genEmptyMeta(): Meta {
  return {
    errors: [],
    warnings: [],
    touched: false,
    validating: false,
    name: [],
  };
}

function InternalFormItem<Values = any>(props: FormItemProps<Values>): React.ReactElement {
  const {
    name,
    noStyle, // 为 true 时不带样式，作为纯字段控件使用
    dependencies, // 所依赖的字段，所依赖的字段更新时，该字段将自动触发更新与校验
    prefixCls: customizePrefixCls,
    shouldUpdate, // 为 true 时，Form 的任意变化都会使该 Form.Item 重新渲染；为方法时，表单的每次数值更新都会调用该方法，提供原先的值与当前的值以供你比较是否需要更新
    rules, // 校验规则，设置字段的校验逻辑
    children,
    required, // 必填样式设置
    label, // label 标签的文本
    messageVariables, // 默认验证字段的信息
    trigger = 'onChange', // 设置收集字段值变更的时机
    validateTrigger, // 设置字段校验的时机，默认onChange
    hidden,
  } = props;
  const { getPrefixCls } = useContext(ConfigContext);
  const { name: formName } = useContext(FormContext);
  const isRenderProps = typeof children === 'function';
  const notifyParentMetaChange = useContext(NoStyleItemContext);

  // 字段校验时机
  const { validateTrigger: contextValidateTrigger } = useContext(FieldContext);
  const mergedValidateTrigger =
    validateTrigger !== undefined ? validateTrigger : contextValidateTrigger;

  const hasName = hasValidName(name);

  const prefixCls = getPrefixCls('form', customizePrefixCls);

  // ========================= MISC =========================
  // Get `noStyle` required info
  const listContext = React.useContext(ListContext);
  const fieldKeyPathRef = React.useRef<React.Key[]>();

  // ======================== Errors ========================
  // >>>>> Collect sub field errors
  const [subFieldErrors, setSubFieldErrors] = useFrameState<Record<string, FieldError>>({});

  // >>>>> Current field errors
  const [meta, setMeta] = useState<Meta>(() => genEmptyMeta());

  const onMetaChange = (nextMeta: Meta & { destroy?: boolean }) => {
    // This keyInfo is not correct when field is removed
    // Since origin keyManager no longer keep the origin key anymore
    // Which means we need cache origin one and reuse when removed
    const keyInfo = listContext?.getKey(nextMeta.name);

    // Destroy will reset all the meta
    setMeta(nextMeta.destroy ? genEmptyMeta() : nextMeta, true);

    // Bump to parent since noStyle
    if (noStyle && notifyParentMetaChange) {
      let namePath = nextMeta.name;

      if (!nextMeta.destroy) {
        if (keyInfo !== undefined) {
          const [fieldKey, restPath] = keyInfo;
          namePath = [fieldKey, ...restPath];
          fieldKeyPathRef.current = namePath;
        }
      } else {
        // Use origin cache data
        namePath = fieldKeyPathRef.current || namePath;
      }
      notifyParentMetaChange(nextMeta, namePath);
    }
  };

  // >>>>> Collect noStyle Field error to the top FormItem
  const onSubItemMetaChange = (subMeta: Meta & { destroy: boolean }, uniqueKeys: React.Key[]) => {
    // Only `noStyle` sub item will trigger
    setSubFieldErrors(prevSubFieldErrors => {
      const clone = {
        ...prevSubFieldErrors,
      };

      // name: ['user', 1] + key: [4] = ['user', 4]
      const mergedNamePath = [...subMeta.name.slice(0, -1), ...uniqueKeys];
      const mergedNameKey = mergedNamePath.join(NAME_SPLIT);

      if (subMeta.destroy) {
        // Remove
        delete clone[mergedNameKey];
      } else {
        // Update
        clone[mergedNameKey] = subMeta;
      }

      return clone;
    });
  };

  // >>>>> Get merged errors
  const [mergedErrors, mergedWarnings] = React.useMemo(() => {
    const errorList: string[] = [...meta.errors];
    const warningList: string[] = [...meta.warnings];

    Object.values(subFieldErrors).forEach(subFieldError => {
      errorList.push(...(subFieldError.errors || []));
      warningList.push(...(subFieldError.warnings || []));
    });

    return [errorList, warningList];
  }, [subFieldErrors, meta.errors, meta.warnings]);

  // ===================== Children Ref =====================
  const getItemRef = useItemRef();

  // ======================== Render ========================
  function renderLayout(
    baseChildren: React.ReactNode,
    fieldId?: string,
    isRequired?: boolean,
  ): React.ReactNode {
    if (noStyle && !hidden) {
      return baseChildren;
    }

    return (
      <ItemHolder
        key="row"
        {...props}
        prefixCls={prefixCls}
        fieldId={fieldId}
        isRequired={isRequired}
        errors={mergedErrors}
        warnings={mergedWarnings}
        meta={meta}
        onSubItemMetaChange={onSubItemMetaChange}
      >
        {baseChildren}
      </ItemHolder>
    );
  }

  // 如果没有被设置字段名、子元素不是函数类型、没有依赖，则直接使用ItemHolder包裹子元素返回
  if (!hasName && !isRenderProps && !dependencies) {
    return renderLayout(children) as JSX.Element;
  }

  // 生成验证字段信息？
  let variables: Record<string, string> = {};
  if (typeof label === 'string') {
    variables.label = label;
  } else if (name) {
    variables.label = String(name);
  }
  if (messageVariables) {
    variables = { ...variables, ...messageVariables };
  }

  // >>>>> With Field
  return (
    <Field
      {...props}
      messageVariables={variables}
      trigger={trigger}
      validateTrigger={mergedValidateTrigger}
      onMetaChange={onMetaChange}
    >
      {/* 这里这样写的原理？ */}
      {(control, renderMeta, context) => {
        const mergedName = toArray(name).length && renderMeta ? renderMeta.name : [];
        const fieldId = getFieldId(mergedName, formName);

        const isRequired =
          required !== undefined
            ? required
            : !!(
                rules &&
                rules.some(rule => {
                  if (rule && typeof rule === 'object' && rule.required && !rule.warningOnly) {
                    return true;
                  }
                  if (typeof rule === 'function') {
                    const ruleEntity = rule(context);
                    return ruleEntity && ruleEntity.required && !ruleEntity.warningOnly;
                  }
                  return false;
                })
              );

        // ======================= Children =======================
        const mergedControl: typeof control = {
          ...control,
        };

        let childNode: React.ReactNode = null;

        warning(
          !(shouldUpdate && dependencies),
          'Form.Item',
          "`shouldUpdate` and `dependencies` shouldn't be used together. See https://ant.design/components/form/#dependencies.",
        );
        if (Array.isArray(children) && hasName) {
          warning(false, 'Form.Item', '`children` is array of render props cannot have `name`.');
          childNode = children;
        } else if (isRenderProps && (!(shouldUpdate || dependencies) || hasName)) {
          warning(
            !!(shouldUpdate || dependencies),
            'Form.Item',
            '`children` of render props only work with `shouldUpdate` or `dependencies`.',
          );
          warning(
            !hasName,
            'Form.Item',
            "Do not use `name` with `children` of render props since it's not a field.",
          );
        } else if (dependencies && !isRenderProps && !hasName) {
          warning(
            false,
            'Form.Item',
            'Must set `name` or use render props when `dependencies` is set.',
          );
        } else if (isValidElement(children)) {
          warning(
            children.props.defaultValue === undefined,
            'Form.Item',
            '`defaultValue` will not work on controlled Field. You should use `initialValues` of Form instead.',
          );

          const childProps = { ...children.props, ...mergedControl };
          if (!childProps.id) {
            childProps.id = fieldId;
          }

          if (supportRef(children)) {
            childProps.ref = getItemRef(mergedName, children);
          }

          // We should keep user origin event handler
          const triggers = new Set<string>([
            ...toArray(trigger),
            ...toArray(mergedValidateTrigger),
          ]);

          // 注册字段值变更事件和字段值检验事件
          triggers.forEach(eventName => {
            childProps[eventName] = (...args: any[]) => {
              mergedControl[eventName]?.(...args);
              children.props[eventName]?.(...args);
            };
          });

          childNode = (
            <MemoInput value={mergedControl[props.valuePropName || 'value']} update={children}>
              {/* 注入value和onChange等事件 */}
              {cloneElement(children, childProps)}
            </MemoInput>
          );
        } else if (isRenderProps && (shouldUpdate || dependencies) && !hasName) {
          childNode = (children as RenderChildren)(context);
        } else {
          warning(
            !mergedName.length,
            'Form.Item',
            '`name` is only used for validate React element. If you are using Form.Item as layout display, please remove `name` instead.',
          );
          childNode = children as React.ReactNode;
        }

        return renderLayout(childNode, fieldId, isRequired);
      }}
    </Field>
  );
}

type InternalFormItemType = typeof InternalFormItem;

interface FormItemInterface extends InternalFormItemType {
  useStatus: typeof useFormItemStatus;
}

const FormItem = InternalFormItem as FormItemInterface;
FormItem.useStatus = useFormItemStatus;

export default FormItem;
