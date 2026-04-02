import { Controller } from "react-hook-form";
import CreateField from "./CreateField";
import AutoCompleteInput from "./AutocompleteInput";

export default function CreateFieldsRenderer({
  fields,
  control,
  errors,
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
                    />
                  );
                }

                return (
                  <CreateField
                    type={fieldConfig.type}
                    label={fieldConfig.label}
                    name={fieldConfig.name}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    options={fieldConfig.options ?? []}
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
