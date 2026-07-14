import React, { useState } from "react";
import "./App.css";

function App() {
    const [file, setFile] = useState(null);
    const [columns, setColumns] = useState([]);
    const [targetColumn, setTargetColumn] = useState("");
    const [loading, setLoading] = useState(false);

    // Telemetry Response States
    const [results, setResults] = useState(null);

    // 1. File Upload Handler -> Instantly extracts column headers
    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setResults(null); // Reset layout parameters from previous runs

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const response = await fetch("http://127.0.0.1:8000/analyze-headers", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            if (data.columns) {
                setColumns(data.columns);
                setTargetColumn(data.columns[0]); // Set first column as default target
            }
        } catch (error) {
            console.error("Header reading error:", error);
            alert("Error contacting the FastAPI server for headers checking.");
        }
    };

    // 2. Full AutoML Run Handler
    const handleTrainPipeline = async () => {
        if (!file || !targetColumn) return;

        setLoading(true);
        setResults(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("target_column", targetColumn);

        try {
            const response = await fetch("http://127.0.0.1:8000/train", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error("Pipeline breakdown error:", error);
            alert("Something went wrong during model training execution.");
        } finally {
            setLoading(false);
        }
    };

    // Helper logic to find maximum value for proportional SHAP bar widths
    const getMaxShapValue = (shapObject) => {
        const values = Object.values(shapObject);
        return values.length > 0 ? Math.max(...values) : 1;
    };

    return (
        <div className="app-container">
            <h1 className="title">AutoML-Studio <span className="badge">v1.0 Production</span></h1>
            <p style={{ color: "#c5c6c7" }}>Low-Code Predictive Analytics & Explainable AI Telemetry Platform</p>

            {/* STEP 1: DROPZONE / FILE LOADER FILE SELECTION */}
            <div className="upload-section">
                <input type="file" accept=".csv" onChange={handleFileChange} style={{ fontSize: "15px" }} />

                {columns.length > 0 && (
                    <div className="config-panel">
                        <label style={{ fontWeight: "600" }}>Select Target Column (Y):</label>
                        <select value={targetColumn} onChange={(e) => setTargetColumn(e.target.value)}>
                            {columns.map((col) => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                        <button onClick={handleTrainPipeline} className="btn btn-train" disabled={loading}>
                            {loading ? "Training Engine..." : "Compute ML Pipeline"}
                        </button>
                    </div>
                )}
            </div>

            {/* STEP 2: TELEMETRY NUMERICAL METRICS VIEWPORTS */}
            {results && (
                <>
                    <div className="telemetry-container">
                        <div className="metric-card highlight">
                            <span className="card-label">Task Type</span>
                            <div className="card-value" style={{ fontSize: "20px", color: "#00f2fe" }}>
                                {results.task_type}
                            </div>
                        </div>
                        <div className="metric-card">
                            <span className="card-label">Dataset Rows</span>
                            <div className="card-value">{results.total_rows}</div>
                        </div>
                        {Object.entries(results.metrics).map(([metricName, metricValue]) => (
                            <div className="metric-card" key={metricName}>
                                <span className="card-label">{metricName}</span>
                                <div className="card-value">{metricValue}</div>
                            </div>
                        ))}
                    </div>

                    {/* STEP 3: EXPLAINABLE AI (SHAP ENGINE REPLICA INTERFACE) */}
                    <div className="shap-section">
                        <h3>🤖 Global Feature Importance Breakdown (SHAP Telemetry)</h3>
                        <p style={{ fontSize: "13px", color: "#858688", marginTop: "-5px" }}>
                            Mean absolute SHAP value distributions. Higher bar lengths indicate greater statistical predictive leverage.
                        </p>

                        {Object.entries(results.shap_importance).map(([featureName, shapValue]) => {
                            const maxVal = getMaxShapValue(results.shap_importance);
                            const percentageWidth = maxVal > 0 ? (shapValue / maxVal) * 100 : 0;

                            return (
                                <div className="shap-row" key={featureName}>
                                    <div className="shap-info">
                                        <span style={{ color: "#fff" }}>{featureName}</span>
                                        <span style={{ color: "#66fcf1" }}>{shapValue.toFixed(4)}</span>
                                    </div>
                                    <div className="shap-bar-wrapper">
                                        <div className="shap-bar" style={{ width: `${percentageWidth}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

export default App;