import * as XLSX from "xlsx";

const UploadFile = ({ onFileProcessed, setMessage, setIsLoading, setFileName, fileName, processData, workzoneMap }) => {

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);
    setMessage("Membaca file...");
    const fileExtension = file.name.split(".").pop().toLowerCase();

    const processAndSetPreview = (jsonData) => {
      const processed = processData(jsonData, workzoneMap);
      if (processed.length === 0) throw new Error("File tidak mengandung data.");
      onFileProcessed(processed); // Communicate processed data back to parent
      setMessage(`Berhasil memuat dan memproses ${processed.length} baris dari file ${file.name}`);
    };

    if (["xlsx", "xls", "csv"].includes(fileExtension)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const bstr = event.target.result;
          const workbook = XLSX.read(bstr, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
          processAndSetPreview(jsonData);
        } catch (error) {
          setMessage(`Error saat membaca file: ${error.message}`);
          onFileProcessed([]);
          setFileName("");
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsBinaryString(file);
    } else if (fileExtension === "json") {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target.result;
          const jsonData = JSON.parse(text);
          if (!Array.isArray(jsonData)) throw new Error("File JSON harus berisi sebuah array of objects.");
          processAndSetPreview(jsonData);
        } catch (error) {
          setMessage(`Error saat membaca file JSON: ${error.message}`);
          onFileProcessed([]);
          setFileName("");
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsText(file);
    } else {
      setMessage(`Tipe file .${fileExtension} tidak didukung.`);
      setFileName("");
      setIsLoading(false);
    }
  };

  return (
    <div className="form-group">
      <label htmlFor="fileInput" className="form-label">Pilih File (Excel, CSV, atau JSON)</label>
      <div className="file-upload-container">
        <input type="file" id="fileInput" className="file-input" accept=".xlsx, .xls, .csv, .json" onChange={handleFileChange} />
        <label htmlFor="fileInput" className="file-input-label">{fileName ? `${fileName}` : "Pilih sebuah file..."}</label>
      </div>
    </div>
  );
};

export default UploadFile;