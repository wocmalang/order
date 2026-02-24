import React, { memo } from "react";
import ActionDropdown from "../../../components/ActionDropdown";
import { formatReadableDate } from "../../../utils/dateFormatter";
import TTRCalculator from "../../../components/TTRCalculator";

const dateColumns = new Set([
  "reported_date", "status_date", "resolve_date", "date_modified",
  "booking_date", "last_update_worklog",
]);

const ttrColumns = new Set([
  "ttr_customer", "ttr_agent", "ttr_mitra", "ttr_nasional", "ttr_end_to_end",
]);

const fluidColumns = new Set([
  "summary", "alamat", "description_assignment", "solution",
  "description_actual_solution", "worklog_summary", "note",
  "notes_eskalasi", "symptom", "cause", "resolution"
]);

export const WorkOrderRow = memo(({
  item,
  isDuplicate,
  allKeys,
  visibleKeys,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onComplete,
  onViewFormat // Diganti dari onCopy ke onViewFormat
}) => {
  
  return (
    <tr className={`${isSelected ? "selected" : ""} ${isDuplicate ? "duplicate-row" : ""}`}>
      <td>
        <input type="checkbox" checked={isSelected} onChange={() => onSelect(item.incident)} />
      </td>
      <td className="aksi-cell">
        <ActionDropdown
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onComplete={onComplete}
          onCopy={onViewFormat} // Pass fungsi modal ke onCopy ActionDropdown
        />
      </td>
      {allKeys.filter((key) => visibleKeys.has(key)).map((key) => {
          if (ttrColumns.has(key)) {
            return (
              <td key={key} className="data-cell truncate">
                <TTRCalculator reportedDate={item.reported_date} ttrValue={item[key]} />
              </td>
            );
          }
          const isFluid = fluidColumns.has(key);
          const cellValue = dateColumns.has(key) ? formatReadableDate(item[key]) : String(item[key] ?? "");

          return (
            <td key={key} className={`data-cell ${isFluid ? "fluid" : "truncate"}`} title={cellValue}>
              {cellValue}
            </td>
          );
        })}
    </tr>
  );
});