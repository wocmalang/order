const PasteJSON = ({ value, onChange }) => {
  return (
    <div className="form-group">
      <label htmlFor="textData" className="form-label">Data Incident (JSON Array)</label>
      <div className="textarea-container">
        <textarea 
          id="textData" 
          value={value} 
          onChange={onChange} 
          placeholder={'Paste array of objects JSON di sini...\nContoh:\n[\n  {\n    "incident": "INC123",\n    "summary": "Internet Lambat"\n  }\n]'} 
          className="excel-textarea" 
          rows={12} 
        />
      </div>
    </div>
  );
};

export default PasteJSON;