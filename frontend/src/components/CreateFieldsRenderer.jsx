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
    <div className="form-grid">
      {fields.map((fieldConfig) => {
        const extraProps = fieldProps[fieldConfig.name] ?? {};
        const isWide =
          fieldConfig.type === "textArea" || fieldConfig.type === "autocomplete";

        return (
          <div
            key={fieldConfig.name}
            className={`form-field${isWide ? " form-field--wide" : ""}`}
          >
            <label className="form-label" htmlFor={fieldConfig.name}>
              {fieldConfig.label}
            </label>

            <Controller
              name={fieldConfig.name}
              control={control}
              rules={fieldConfig.rules}
              render={({ field }) => {
                if (fieldConfig.type === "autocomplete") {
                  return (
                    <AutoCompleteInput
                      id={fieldConfig.name}
                      options={extraProps.options ?? []}
                      labelKey={fieldConfig.labelKey}
                      subLabelKey={fieldConfig.subLabelKey}
                      placeholder={fieldConfig.placeholder || fieldConfig.label}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors?.[fieldConfig.name]?.message}
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
                    error={errors?.[fieldConfig.name]?.message}
                  />
                );
              }}
            />

            {errors?.[fieldConfig.name]?.message && (
              <p className="field-error">{errors[fieldConfig.name].message}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
