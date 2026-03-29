import { Controller } from "react-hook-form";
import EditableField from "./EditableField.jsx";

export default function DetailFieldsRenderer({
  fields,
  data,
  control,
  errors,
  isEditing,
}) {
  return (
    <>
      {fields.map((field) => {
        const displayValue =
          typeof field.getDisplayValue === "function"
            ? field.getDisplayValue(data)
            : (data?.[field.name] ?? "");

        if (!field.editable) {
          return (
            <EditableField
              key={field.name}
              type={field.type}
              label={field.label}
              name={field.name}
              value={displayValue}
              isEditing={false}
            />
          );
        }

        return (
          <Controller
            key={field.name}
            name={field.name}
            control={control}
            rules={field.rules}
            render={({ field: controllerField }) => (
              <EditableField
                type={field.type}
                label={field.label}
                name={field.name}
                value={isEditing ? (controllerField.value ?? "") : displayValue}
                onChange={controllerField.onChange}
                onBlur={controllerField.onBlur}
                isEditing={isEditing}
                error={errors?.[field.name]?.message}
              />
            )}
          />
        );
      })}
    </>
  );
}
