import React, { useState, useEffect, useMemo } from 'react';

export const EditModal = ({
    item,
    onClose,
    onSave,
    allSektorOptions,
    getSektorForWorkzone,
    getWorkzonesForSektor,
    getKorlapsForWorkzone
}) => {
    const [editForm, setEditForm] = useState(item);

    useEffect(() => {
        setEditForm(item);
    }, [item]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditForm((prev) => {
            let newState = { ...prev, [name]: value };

            if (name === "workzone") {
                const newSektor = getSektorForWorkzone(value);
                newState.sektor = newSektor;
                newState.korlap = "";
            }

            if (name === "sektor") {
                newState.workzone = "";
                newState.korlap = "";
            }

            return newState;
        });
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(editForm);
    };

    const workzoneOptions = useMemo(
        () => (editForm?.sektor ? getWorkzonesForSektor(editForm.sektor) : []),
        [editForm?.sektor, getWorkzonesForSektor]
    );

    const korlapOptions = useMemo(
        () => (editForm?.workzone ? getKorlapsForWorkzone(editForm.workzone) : []),
        [editForm?.workzone, getKorlapsForWorkzone]
    );

    if (!item) {
        return null;
    }

    return (
        <div className="format-modal" onClick={onClose}>
            <div className="format-modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Edit Incident: {item.incident}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Incident:</label>
                        <input name="incident" value={editForm.incident || ""} onChange={handleChange} disabled />
                    </div>

                    <div className="form-group">
                        <label>Sektor:</label>
                        <select name="sektor" value={editForm.sektor || ""} onChange={handleChange}>
                            <option value="">- Pilih Sektor -</option>
                            {allSektorOptions.map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Workzone:</label>
                        <select name="workzone" value={editForm.workzone || ""} onChange={handleChange} disabled={!editForm.sektor}>
                            <option value="">- Pilih Workzone -</option>
                            {workzoneOptions.map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Korlap:</label>
                        <select name="korlap" value={editForm.korlap || ""} onChange={handleChange} disabled={!editForm.workzone}>
                            <option value="">- Pilih Korlap -</option>
                            {korlapOptions.map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                    
                    {Object.keys(editForm).filter(key => 
                        !["incident", "sektor", "workzone", "korlap", "created_at", "updated_at"].includes(key)
                    ).map(key => (
                         <div key={key} className="form-group">
                            <label>{key.replace(/_/g, " ")}:</label>
                            <input name={key} value={editForm[key] || ""} onChange={handleChange} />
                        </div>
                    ))}
                    
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">Simpan</button>
                        <button type="button" className="btn btn-outline" onClick={onClose}>Batal</button>
                    </div>
                </form>
            </div>
        </div>
    );
};