import React, { memo } from "react";
import CustomDropdown from "../../components/CustomDropdown";
import ActionDropdown from "../../components/ActionDropdown";
import { formatReadableDate } from "../../utils/dateFormatter";
import TTRCalculator from "../../components/TTRCalculator";

const dateColumns = new Set([
  "reported_date", "status_date", "resolve_date", "date_modified", "booking_date", "last_update_worklog",
]);
const ttrColumns = new Set([
  "ttr_customer", "ttr_agent", "ttr_mitra", "ttr_nasional", "ttr_end_to_end",
]);

export const WorkOrderRow = memo(
  ({
    item, allKeys, visibleKeys, isSelected, onSelect, onUpdate,
    updatingStatus, onEdit, onDelete, onFormat, onCopy, onComplete,
    statusOptions, allWorkzoneOptions,
  }) => {
    
    // Fungsi ini sekarang hanya memberitahu induk tentang perubahan.
    // Induk akan menangani logika untuk update 'sektor' dan 'korlap'.
    const handleDropdownChange = (key, value) => {
      onUpdate(item, { [key]: value });
    };

    return (
      <tr className={isSelected ? "selected" : ""}>
        <td>
          <input type="checkbox" checked={isSelected} onChange={() => onSelect(item.incident)} />
        </td>
        <td className="aksi-cell">
          <ActionDropdown
            item={item} onFormat={onFormat} onCopy={onCopy}
            onEdit={onEdit} onDelete={onDelete} onComplete={onComplete}
          />
        </td>
        {allKeys
          .filter((key) => visibleKeys.has(key))
          .map((key) => {
            const isUpdating = updatingStatus[item.incident];

            if (ttrColumns.has(key)) {
              return ( <td key={key} className="data-cell"><TTRCalculator reportedDate={item.reported_date} ttrValue={item[key]} /></td> );
            }
            if (key === "status") {
              return (
                <td key={key} className="interactive-cell">
                  <CustomDropdown options={statusOptions} value={item.status} onChange={(v) => handleDropdownChange("status", v)} disabled={isUpdating} placeholder="- Pilih Status -" />
                  {isUpdating && "⏳"}
                </td>
              );
            }
            if (key === "sektor") {
              const cellValue = String(item[key] ?? "");
              return ( <td key={key} className="data-cell" title={cellValue}>{cellValue}</td> );
            }
            if (key === "workzone") {
              return (
                <td key={key} className="interactive-cell">
                  <CustomDropdown options={allWorkzoneOptions} value={item.workzone} onChange={(v) => handleDropdownChange("workzone", v)} disabled={isUpdating} placeholder="- Pilih Workzone -" />
                  {isUpdating && "⏳"}
                </td>
              );
            }
            if (key === "korlap") {
              const cellValue = String(item[key] ?? "");
              return ( <td key={key} className="data-cell truncate" title={cellValue}>{cellValue}</td> );
            }

            const cellValue = dateColumns.has(key) ? formatReadableDate(item[key]) : String(item[key] ?? "");
            return ( <td key={key} className="data-cell truncate" title={cellValue}>{cellValue}</td> );
          })}
      </tr>
    );
  }
);