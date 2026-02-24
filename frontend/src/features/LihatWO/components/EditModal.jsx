import React, { useState, useEffect } from "react";

export const EditModal = ({ item, onClose, onSave, workzoneMap }) => {
  const [editForm, setEditForm] = useState(item);

  useEffect(() => { setEditForm(item); }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updates = { [name]: value };

    // Auto-fill jika Workzone berubah
    if (name === "workzone") {
      const match = workzoneMap.find((m) => m.workzone === value);
      updates.sektor = match ? match.sektor : "";
      updates.korlap = match ? (match.korlaps || match.korlap_username || "") : "";
    }
    setEditForm((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editForm);
  };

  if (!item) return null;

  const workzoneOptions = [...new Set(workzoneMap.map(m => m.workzone))].sort();
  const staticFields = ["incident", "workzone", "sektor", "korlap", "alamat"];
  const dynamicKeys = Object.keys(editForm).filter(k => !staticFields.includes(k) && !["created_at", "updated_at", "id"].includes(k));

  return (
    <div className="format-modal" onClick={onClose}>
      <div className="edit-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="edit-modal-header">
          <h2>Edit Incident</h2>
          <button type="button" className="btn-close-modal" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="edit-modal-form-layout">
          <div className="edit-modal-body edit-form-grid">
            {/* Field Statis */}
            <div className="form-group">
              <label>INCIDENT</label>
              <input name="incident" value={editForm.incident || ""} className="input-disabled" readOnly />
            </div>
            <div className="form-group">
              <label>WORKZONE</label>
              <select name="workzone" value={editForm.workzone || ""} onChange={handleChange} className="select-highlight">
                <option value="">- Pilih -</option>
                {workzoneOptions.map(wz => <option key={wz} value={wz}>{wz}</option>)}
              </select>
            </div>
            <div className="form-group"><label>SEKTOR (Auto)</label><input name="sektor" value={editForm.sektor || ""} readOnly className="input-readonly" /></div>
            <div className="form-group"><label>KORLAP (Auto)</label><input name="korlap" value={editForm.korlap || ""} readOnly className="input-readonly" /></div>
            <div className="form-group full-width"><label>ALAMAT</label><textarea name="alamat" value={editForm.alamat || ""} readOnly className="input-readonly" rows="2" /></div>

            {/* Field Dinamis */}
            {dynamicKeys.map((key) => {
               const isLong = ["summary", "description", "note", "solution", "symptom"].some(t => key.toLowerCase().includes(t));
               return (
                 <div key={key} className={`form-group ${isLong ? "full-width" : ""}`}>
                   <label>{key.replace(/_/g, " ").toUpperCase()}</label>
                   {isLong ? 
                     <textarea name={key} value={editForm[key] || ""} onChange={handleChange} rows="3" /> : 
                     <input name={key} value={editForm[key] || ""} onChange={handleChange} />
                   }
                 </div>
               );
            })}
          </div>
          <div className="edit-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
};