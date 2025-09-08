const PasteTSV = ({ value, onChange }) => {
  return (
    <div className="form-group">
      <label htmlFor="textData" className="form-label">Data Incident (Tab Separated)</label>
      <div className="textarea-container">
        <textarea 
          id="textData" 
          value={value} 
          onChange={onChange} 
          placeholder="Paste data dari Excel (TSV) di sini..." 
          className="excel-textarea" 
          rows={12} 
        />
      </div>
    </div>
  );
};

export default PasteTSV;