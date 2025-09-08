const JsonPreview = ({ data }) => {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="json-preview-panel">
      <h3>Preview Data JSON (Total: {data.length} baris)</h3>
      <pre>
        {JSON.stringify(data.slice(0, 5), null, 2)}
        {data.length > 5 && "\n..."}
      </pre>
    </div>
  );
};

export default JsonPreview;