import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";

const CustomDropdown = ({
  options = [],
  value,
  onChange,
  placeholder = "- Pilih -",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  // PERBAIKAN 1: Cari objek opsi yang lengkap berdasarkan 'value' yang diberikan.
  // 'value' adalah nilai primitif (misal: "BLB"), 'options' adalah array objek.
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const updatePosition = useCallback(() => {
    if (!dropdownRef.current) return;
    const rect = dropdownRef.current.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const toggleDropdown = useCallback(() => {
    if (disabled) return;
    const isOpening = !isOpen;
    setIsOpen(isOpening);
    if (isOpening) {
      updatePosition();
    }
  }, [isOpen, disabled, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const tableContainer = dropdownRef.current.closest(".table-container");
    const listeners = [
      { target: window, event: "scroll", handler: updatePosition, options: true },
      { target: window, event: "resize", handler: updatePosition },
      { target: tableContainer, event: "scroll", handler: updatePosition },
    ];

    listeners.forEach((l) => l.target && l.target.addEventListener(l.event, l.handler, l.options));

    return () => {
      listeners.forEach((l) => l.target && l.target.removeEventListener(l.event, l.handler, l.options));
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // PERBAIKAN 2: Tampilkan 'label' dari opsi yang dipilih, bukan 'value'-nya.
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className={`custom-dropdown ${disabled ? "disabled" : ""}`} ref={dropdownRef}>
      <button type="button" className="dropdown-toggle" onClick={toggleDropdown} disabled={disabled}>
        {displayValue}
        <span className="dropdown-arrow">{isOpen ? "🔼" : "🔽"}</span>
      </button>
      {isOpen &&
        menuPosition &&
        createPortal(
          <div
            ref={menuRef}
            className="dropdown-menu-portal"
            style={{
              position: "fixed",
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              width: `${menuPosition.width}px`,
            }}
          >
            {/* PERBAIKAN 3: Logika pemetaan (mapping) disesuaikan untuk objek */}
            {options.map((opt) => (
              <div
                key={opt.value} // Gunakan .value untuk key yang unik
                className={`dropdown-item ${opt.value === value ? "selected" : ""}`} // Bandingkan dengan .value
                onClick={() => handleSelect(opt.value)} // Kirim .value saat diklik
              >
                {opt.label} {/* Tampilkan .label untuk teks */}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};

export default CustomDropdown;