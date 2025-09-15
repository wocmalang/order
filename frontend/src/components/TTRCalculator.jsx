// Lokasi: frontend/src/components/TTRCalculator.jsx

import React, { useState, useEffect } from "react";
import {
  parseISO,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
} from "date-fns";

/**
 * Menghitung durasi secara real-time untuk tiket yang sedang berjalan.
 * Menggunakan date-fns untuk parsing tanggal yang andal dan akurat.
 * @param {string} startTime - String tanggal dalam format ISO 8601 (misal: "2023-10-27T10:00:00Z").
 */
const calculateLiveDuration = (startTime) => {
  // Jika tidak ada waktu mulai, kembalikan strip.
  if (!startTime) return "-";

  // Parse string tanggal ISO menjadi objek Date.
  // parseISO jauh lebih andal daripada new Date(string).
  const startDate = parseISO(startTime);
  const endDate = new Date(); // Waktu saat ini (menggunakan waktu lokal browser).

  // Validasi jika tanggal yang di-parse valid.
  if (isNaN(startDate.getTime())) {
    console.error("Format tanggal tidak valid:", startTime);
    return "-";
  }

  // Pastikan selisih tidak negatif.
  if (startDate > endDate) {
    return "0M";
  }

  // Hitung selisih dalam hari, jam, dan menit.
  const totalMinutes = differenceInMinutes(endDate, startDate);

  const days = Math.floor(totalMinutes / 1440); // 1440 menit dalam sehari
  const remainingMinutesAfterDays = totalMinutes % 1440;

  const hours = Math.floor(remainingMinutesAfterDays / 60);
  const minutes = remainingMinutesAfterDays % 60;

  // Bangun string hasil.
  let result = "";
  if (days > 0) result += `${days}H `;
  if (hours > 0) result += `${hours}J `;
  // Selalu tampilkan menit, bahkan jika 0, untuk kejelasan.
  result += `${minutes}M`;

  return result.trim();
};

const TTRCalculator = ({ reportedDate, ttrValue }) => {
  // State untuk menyimpan durasi live.
  const [liveDuration, setLiveDuration] = useState(
    calculateLiveDuration(reportedDate)
  );

  useEffect(() => {
    let intervalId = null;

    // Jika TIDAK ada ttrValue (artinya tiket masih open), jalankan timer.
    if (reportedDate && !ttrValue) {
      // Panggil sekali saat komponen dimuat untuk memastikan nilai awal sudah benar.
      setLiveDuration(calculateLiveDuration(reportedDate));

      // Atur interval untuk update setiap menit.
      intervalId = setInterval(() => {
        setLiveDuration(calculateLiveDuration(reportedDate));
      }, 60000); // Update setiap 1 menit
    }

    // Fungsi cleanup untuk membersihkan interval saat komponen tidak lagi ditampilkan.
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [reportedDate, ttrValue]); // Efek ini akan dijalankan ulang jika props berubah.

  // Logika render:
  // Jika ada ttrValue dari backend, tampilkan itu (ini adalah nilai final).
  // Jika tidak, tampilkan liveDuration yang dihitung secara real-time.
  return <span>{ttrValue || liveDuration}</span>;
};

export default TTRCalculator;
