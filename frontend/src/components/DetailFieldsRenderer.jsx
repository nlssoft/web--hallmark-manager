import { Controller } from "react-hook-form";
import EditableField from "./EditableField.jsx";

export default function DetailFieldsRenderer({
  fields,
  control,
  errors,
  isEditing,
}) {
  return (
    <>
      {fields.map((fieldConfig) => (
        <Controller
          key={fieldConfig.name}
          name={fieldConfig.name}
          control={control}
          rules={fieldConfig.rules}
          render={({ field }) => (
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
          )}
        />
      ))}
    </>
  );
}
