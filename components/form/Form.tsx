import classNames from 'classnames';
import FieldForm, { List, useWatch } from 'rc-field-form';
import type { FormProps as RcFormProps } from 'rc-field-form/lib/Form';
import type { ValidateErrorEntity } from 'rc-field-form/lib/interface';
import * as React from 'react';
import { useMemo } from 'react';
import type { Options } from 'scroll-into-view-if-needed';
import { ConfigContext } from '../config-provider';
import DisabledContext, { DisabledContextProvider } from '../config-provider/DisabledContext';
import type { SizeType } from '../config-provider/SizeContext';
import SizeContext, { SizeContextProvider } from '../config-provider/SizeContext';
import type { ColProps } from '../grid/col';
import type { FormContextProps } from './context';
import { FormContext } from './context';
import useForm, { FormInstance } from './hooks/useForm';
import type { FormLabelAlign } from './interface';

export type RequiredMark = boolean | 'optional';
export type FormLayout = 'horizontal' | 'inline' | 'vertical';

export interface FormProps<Values = any> extends Omit<RcFormProps<Values>, 'form'> {
  prefixCls?: string;
  colon?: boolean; // 配置 Form.Item 的 colon 的默认值。表示是否显示 label 后面的冒号 (只有在属性 layout 为 horizontal 时有效)
  name?: string;
  layout?: FormLayout; // 表单布局
  labelAlign?: FormLabelAlign; // label 标签的文本对齐方式
  labelWrap?: boolean; // label 标签的文本换行方式
  labelCol?: ColProps; // label 标签布局，同 <Col> 组件，设置 span offset 值，如 {span: 3, offset: 12} 或 sm: {span: 3, offset: 12}
  wrapperCol?: ColProps; // 需要为输入控件设置布局样式时，使用该属性，用法同 labelCol
  form?: FormInstance<Values>; // 经 Form.useForm() 创建的 form 控制实例，不提供时会自动创建
  size?: SizeType;
  disabled?: boolean;
  scrollToFirstError?: Options | boolean; // 提交失败自动滚动到第一个错误字段
  requiredMark?: RequiredMark; // 必选样式，可以切换为必选或者可选展示样式。此为 Form 配置，Form.Item 无法单独配置（label旁边的小图标）
  /** @deprecated Will warning in future branch. Pls use `requiredMark` instead. */
  hideRequiredMark?: boolean; // 是否隐藏必选、可选展示样式的小图标
}

/** 在rc-field-form上使用表单上下文封装 初始化、暴露表单控制实例 */
const InternalForm: React.ForwardRefRenderFunction<FormInstance, FormProps> = (props, ref) => {
  const contextSize = React.useContext(SizeContext);
  const contextDisabled = React.useContext(DisabledContext);
  const { getPrefixCls, direction, form: contextForm } = React.useContext(ConfigContext);

  const {
    prefixCls: customizePrefixCls,
    className = '',
    size = contextSize,
    disabled = contextDisabled,
    form,
    colon,
    labelAlign,
    labelWrap,
    labelCol,
    wrapperCol,
    hideRequiredMark,
    layout = 'horizontal',
    scrollToFirstError,
    requiredMark,
    onFinishFailed, // 提交表单且数据验证失败后回调事件
    name,
    ...restFormProps
  } = props;

  /** 获取requiredMark的值并保存 */
  const mergedRequiredMark = useMemo(() => {
    if (requiredMark !== undefined) {
      return requiredMark;
    }

    if (contextForm && contextForm.requiredMark !== undefined) {
      return contextForm.requiredMark;
    }

    if (hideRequiredMark) {
      return false;
    }

    return true;
  }, [hideRequiredMark, requiredMark, contextForm]);

  // 表单项label后是否接":"
  const mergedColon = colon ?? contextForm?.colon;

  const prefixCls = getPrefixCls('form', customizePrefixCls);

  const formClassName = classNames(
    prefixCls,
    {
      [`${prefixCls}-${layout}`]: true,
      [`${prefixCls}-hide-required-mark`]: mergedRequiredMark === false,
      [`${prefixCls}-rtl`]: direction === 'rtl',
      [`${prefixCls}-${size}`]: size,
    },
    className,
  );

  // 获取表单控制实例
  const [wrapForm] = useForm(form);
  const { __INTERNAL__ } = wrapForm;
  __INTERNAL__.name = name;

  const formContextValue = useMemo<FormContextProps>(
    () => ({
      name,
      labelAlign,
      labelCol,
      labelWrap,
      wrapperCol,
      vertical: layout === 'vertical',
      colon: mergedColon,
      requiredMark: mergedRequiredMark,
      itemRef: __INTERNAL__.itemRef,
      form: wrapForm,
    }),
    [name, labelAlign, labelCol, wrapperCol, layout, mergedColon, mergedRequiredMark, wrapForm],
  );

  // 暴露表单控制实例
  React.useImperativeHandle(ref, () => wrapForm);

  /** 表单提交失败处理 */
  const onInternalFinishFailed = (errorInfo: ValidateErrorEntity) => {
    // 表单提交失败回调
    onFinishFailed?.(errorInfo);

    // 设置页面移动到出问题的位置
    let defaultScrollToFirstError: Options = { block: 'nearest' };

    // 控制页面移动到出问题的位置
    if (scrollToFirstError && errorInfo.errorFields.length) {
      if (typeof scrollToFirstError === 'object') {
        defaultScrollToFirstError = scrollToFirstError;
      }
      wrapForm.scrollToField(errorInfo.errorFields[0].name, defaultScrollToFirstError);
    }
  };

  return (
    <DisabledContextProvider disabled={disabled}>
      <SizeContextProvider size={size}>
        <FormContext.Provider value={formContextValue}>
          <FieldForm
            id={name}
            {...restFormProps}
            name={name}
            onFinishFailed={onInternalFinishFailed}
            form={wrapForm}
            className={formClassName}
          />
        </FormContext.Provider>
      </SizeContextProvider>
    </DisabledContextProvider>
  );
};

const Form = React.forwardRef<FormInstance, FormProps>(InternalForm) as <Values = any>(
  props: React.PropsWithChildren<FormProps<Values>> & { ref?: React.Ref<FormInstance<Values>> },
) => React.ReactElement;

export { useForm, List, FormInstance, useWatch };

export default Form;
