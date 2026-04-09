import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { getAudit } from "../api/audit.js";
import DetailPageLayout from "../components/DetailPageLayout.jsx";
import EarlyReturn from "../components/EarlyReturns.jsx";
import GoBackButton from "../components/GoBackButton.jsx";
import useTitle from "../utils/useTitle.js";

function formatDateTime(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function titleCase(value) {
  if (!value) return "Audit";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatFieldName(value) {
  if (!value) return "Field";

  const lastPart = value.split(".").pop() || value;
  if (lastPart === "type_of_work" || lastPart === "service") return "Service";

  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatSnapshotFieldName(value) {
  if (!value) return "Field";

  const lastPart = value.split(".").pop() || value;
  if (lastPart === "type_of_work" || lastPart === "service") return "Service";
  return formatFieldName(lastPart);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isHiddenKey(key) {
  if (!key) return false;

  const lastPart = key.toLowerCase().split(".").pop() || "";
  return (
    lastPart === "id" ||
    lastPart.endsWith("_id") ||
    lastPart === "paid_amount" ||
    lastPart === "logo" ||
    lastPart === "first_name" ||
    lastPart === "last_name"
  );
}

function stripHiddenKeysDeep(value) {
  if (Array.isArray(value)) {
    return value.map(stripHiddenKeysDeep);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !isHiddenKey(key))
      .map(([key, currentValue]) => [key, stripHiddenKeysDeep(currentValue)]),
  );
}

function formatInlineValue(value) {
  if (value === null || value === undefined || value === "") return "Empty";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;

  return JSON.stringify(value, null, 2);
}

function flattenSnapshot(value, prefix = "") {
  if (!isPlainObject(value)) return [];

  const normalizedPrefix = prefix.toLowerCase().split(".").pop() || "";

  if (normalizedPrefix === "party") {
    const name =
      value.full_name ||
      [value.first_name, value.last_name].filter(Boolean).join(" ").trim();

    return [
      ...(name ? [{ key: `${prefix}.full_name`, value: name }] : []),
      ...(value.address
        ? [{ key: `${prefix}.address`, value: value.address }]
        : []),
    ];
  }

  if (normalizedPrefix === "service_type" || normalizedPrefix === "service") {
    const serviceName =
      value.type_of_work || value.service_name || value.name || value.service;

    return serviceName
      ? [{ key: `${prefix}.service`, value: serviceName }]
      : [];
  }

  return Object.entries(value).flatMap(([key, currentValue]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (isHiddenKey(path)) {
      return [];
    }

    if (isPlainObject(currentValue)) {
      return flattenSnapshot(currentValue, path);
    }

    return [{ key: path, value: currentValue }];
  });
}

function getPartyName(data) {
  const party = data?.after?.party || data?.before?.party;

  if (!party || typeof party !== "object") return "";

  const name = [party.first_name, party.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || "";
}

function getChangeList(data) {
  if (Array.isArray(data?.changes) && data.changes.length) {
    return data.changes;
  }

  const before = isPlainObject(data?.before) ? data.before : {};
  const after = isPlainObject(data?.after) ? data.after : {};
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];

  return keys
    .filter((key) => !isHiddenKey(key))
    .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .map((key) => ({
      field: key,
      before: before[key],
      after: after[key],
    }));
}

function getPartySummary(value) {
  if (!isPlainObject(value)) return null;

  const name = [value.first_name, value.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const lines = [name, value.address].filter(Boolean);

  return lines.length ? lines : ["Party details unavailable"];
}

function getServiceSummary(value) {
  if (!isPlainObject(value)) return null;

  const serviceName =
    value.type_of_work || value.service_name || value.name || value.service;

  return serviceName ? [serviceName] : ["Service details unavailable"];
}

function getFriendlyObjectLines(fieldName, value) {
  if (!isPlainObject(value)) return null;

  const normalized = fieldName.toLowerCase().split(".").pop() || "";

  if (normalized === "party") {
    return getPartySummary(value);
  }

  if (normalized === "service_type" || normalized === "service") {
    return getServiceSummary(value);
  }

  return null;
}

function AuditMetaCard({ label, value, tone = "default" }) {
  return (
    <div className={`audit-meta-card audit-meta-card--${tone}`}>
      <span className="audit-meta-card__label">{label}</span>
      <strong className="audit-meta-card__value">{value || "N/A"}</strong>
    </div>
  );
}

function AuditValue({ value, fieldName = "" }) {
  const friendlyLines = getFriendlyObjectLines(fieldName, value);

  if (friendlyLines) {
    return (
      <div className="audit-inline-stack">
        {friendlyLines.map((line) => (
          <span key={line} className="audit-inline-line">
            {line}
          </span>
        ))}
      </div>
    );
  }

  const isComplex = Array.isArray(value) || isPlainObject(value);

  if (isComplex) {
    const safeValue = stripHiddenKeysDeep(value);

    return (
      <pre className="audit-code-block">
        {JSON.stringify(safeValue, null, 2)}
      </pre>
    );
  }

  return <span>{formatInlineValue(value)}</span>;
}

function AuditSnapshotCard({ title, subtitle, data, emptyMessage }) {
  const rows = flattenSnapshot(data);

  return (
    <section className="audit-panel">
      <div className="audit-panel__header">
        <div>
          <h2 className="audit-panel__title">{title}</h2>
          <p className="audit-panel__copy">{subtitle}</p>
        </div>
      </div>

      {rows.length ? (
        <div className="audit-kv-list">
          {rows.map((row) => (
            <div key={row.key} className="audit-kv-row">
              <span className="audit-kv-row__key">
                {formatSnapshotFieldName(row.key)}
              </span>
              <div className="audit-kv-row__value">
                <AuditValue value={row.value} fieldName={row.key} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="audit-empty-state">{emptyMessage}</div>
      )}
    </section>
  );
}

export default function AuditDetailPage() {
  const { id } = useParams();
  useTitle("Audit Detail");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["audit", id],
    queryFn: () => getAudit(id),
  });

  if (isLoading || isError) {
    return (
      <EarlyReturn isLoading={isLoading} isError={isError} error={error} />
    );
  }

  const action = data?.action || "AUDIT";
  const actionTone =
    action === "DELETE"
      ? "danger"
      : action === "UPDATE"
        ? "success"
        : "default";
  const changeList = getChangeList(data);
  const partyName = getPartyName(data);
  const summaryLine = partyName
    ? `${titleCase(action)} recorded for ${titleCase(data?.model_name)} related to ${partyName}.`
    : `${titleCase(action)} recorded for ${titleCase(data?.model_name)}.`;

  return (
    <DetailPageLayout>
      <div className="audit-detail-stack">
        <section className="audit-hero">
          <div className="audit-hero__copy">
            <p className="section-kicker">Audit Event</p>
            <h1 className="section-title">
              {titleCase(action)} on {titleCase(data?.model_name)}
            </h1>
            <p className="section-copy">{summaryLine}</p>
          </div>

          <span
            className={`audit-action-pill audit-action-pill--${actionTone}`}
          >
            {action}
          </span>
        </section>

        <div className="audit-meta-grid">
          <AuditMetaCard label="Model" value={titleCase(data?.model_name)} />
          <AuditMetaCard label="Changed Fields" value={changeList.length} />
          <AuditMetaCard
            label="Logged At"
            value={formatDateTime(data?.created_at)}
          />
          <AuditMetaCard
            label="Reason"
            value={data?.reason || "No reason added"}
            tone={data?.reason ? "default" : "muted"}
          />
        </div>

        <section className="audit-panel">
          <div className="audit-panel__header">
            <div>
              <h2 className="audit-panel__title">Field Difference</h2>
              <p className="audit-panel__copy">
                Direct comparison of the values captured before and after the
                event.
              </p>
            </div>
          </div>

          {changeList.length ? (
            <div className="audit-diff-table-wrap">
              <table className="audit-diff-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Before</th>
                    <th>After</th>
                  </tr>
                </thead>
                <tbody>
                  {changeList.map((change) => (
                    <tr key={change.field}>
                      <td>{formatFieldName(change.field)}</td>
                      <td>
                        <AuditValue
                          value={change.before}
                          fieldName={change.field}
                        />
                      </td>
                      <td>
                        <AuditValue
                          value={change.after}
                          fieldName={change.field}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="audit-empty-state">
              No field-level diff was stored for this event.
            </div>
          )}
        </section>

        <div className="audit-snapshot-grid">
          <AuditSnapshotCard
            title="Before Snapshot"
            subtitle="The last known values captured before this event."
            data={data?.before}
            emptyMessage="No before-state payload is stored for this audit entry."
          />

          <AuditSnapshotCard
            title={action === "DELETE" ? "Removed Snapshot" : "After Snapshot"}
            subtitle={
              action === "DELETE"
                ? "Delete events do not keep a post-delete object snapshot."
                : "The values stored immediately after the update."
            }
            data={data?.after}
            emptyMessage={
              action === "DELETE"
                ? "This object was deleted, so there is no after-state snapshot."
                : "No after-state payload is stored for this audit entry."
            }
          />
        </div>

        <GoBackButton to="/audit" label="Back To Audit Logs" />
      </div>
    </DetailPageLayout>
  );
}
