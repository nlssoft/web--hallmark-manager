import { Controller } from "react-hook-form";
import EditableField from "./EditableField.jsx";
import AutoCompleteInput from "./AutocompleteInput.jsx";
import CreateField from "./CreateField.jsx";

export default function DetailFieldsRenderer({
  fields,
  control,
  errors,
  isEditing,
  fieldProps = {},
}) {
  return (
    <>
      {fields.map((fieldConfig) => {
        const extraProps = fieldProps[fieldConfig.name] ?? {};

        return (
          <div key={fieldConfig.name}>
            <Controller
              name={fieldConfig.name}
              control={control}
              rules={fieldConfig.rules}
              render={({ field }) => {
                if (fieldConfig.type === "autocomplete") {
                  return (
                    <AutoCompleteInput
                      options={extraProps.options ?? []}
                      labelKey={fieldConfig.labelKey}
                      subLabelKey={fieldConfig.subLabelKey}
                      placeholder={fieldConfig.placeholder || fieldConfig.label}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      isEditing={Boolean(fieldConfig.editable && isEditing)}
                      error={errors?.[fieldConfig.name]?.message}
                    />
                  );
                }
                return (
                  <EditableField
                    type={fieldConfig.type}
                    label={fieldConfig.label}
                    name={fieldConfig.name}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    isEditing={Boolean(fieldConfig.editable && isEditing)}
                    error={errors?.[fieldConfig.name]?.message}
                  />
                );
              }}
            />
            {errors?.[fieldConfig.name]?.message && (
              <p className="mt-1 text-sm text-red-600">
                {errors[fieldConfig.name].message}
              </p>
            )}
          </div>
        );
      })}
    </>
  );
}
