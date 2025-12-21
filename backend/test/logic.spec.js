// backend/test/logic.spec.js
import { describe, it, expect } from 'vitest';

// --- 1. Simulasi Logika Bisnis (Unit yang diuji) ---

// Fungsi Auto-Mapping
function getSektorByWorkzone(workzone) {
    const mapping = { 'KLJ': 'MLG 1', 'TUR': 'MLG 2' };
    return mapping[workzone] || null;
}

// Fungsi Sinkronisasi Alamat
function syncAddress(inputTicket, masterData) {
    // Jika alamat kosong, cari di master data berdasarkan Service No
    if (!inputTicket.alamat || inputTicket.alamat === '') {
        const found = masterData.find(m => m.service_no === inputTicket.service_no);
        return found ? found.alamat : ''; // Kembalikan alamat dari master
    }
    return inputTicket.alamat; // Jika sudah ada, jangan diubah
}

// --- 2. Skenario Pengujian (Test Cases) ---

describe('Pengujian Logika Bisnis', () => {
    // Test Auto-Mapping
    it('Auto-Mapping: Harus mengembalikan MLG 1 jika Workzone KLJ', () => {
        const result = getSektorByWorkzone('KLJ');
        expect(result).toBe('MLG 1');
    });

    it('Auto-Mapping: Harus mengembalikan null jika Workzone tidak dikenali', () => {
        const result = getSektorByWorkzone('XYZ');
        expect(result).toBe(null);
    });

    // Test Sinkronisasi Alamat
    it('Sync Address: Harus mengisi alamat otomatis jika kosong', () => {
        const mockMasterData = [{ service_no: '12345', alamat: 'Jl. A. Yani No. 11' }];
        const inputTicket = { service_no: '12345', alamat: '' }; // Alamat kosong
        
        const result = syncAddress(inputTicket, mockMasterData);
        expect(result).toBe('Jl. A. Yani No. 11');
    });

    it('Sync Address: Tidak boleh menimpa alamat yang sudah ada', () => {
        const mockMasterData = [{ service_no: '12345', alamat: 'Jl. A. Yani No. 11' }];
        const inputTicket = { service_no: '12345', alamat: 'Jl. Borobudur 5' }; // Alamat terisi manual
        
        const result = syncAddress(inputTicket, mockMasterData);
        expect(result).toBe('Jl. Borobudur 5'); // Tetap gunakan input user
    });
});