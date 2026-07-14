import React, { useState } from "react";
import "./App.css";

// Production backend router switch
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

function App() {
    const [file, setFile] = useState(null);
    const [columns, setColumns] = useState([]);
    const [targetColumn, setTargetColumn] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [activeTab, setActiveTab] = useState("leaderboard");
    const [terminalLogs, setTerminalLogs] = useState([]);

    // Live streaming hacker terminal console simulations
    const runTerminalStream = () => {
        setTerminalLogs([]);
        const logsList = [
            "> Initialization stream pipeline active...",
            "> Parsing raw data dimensions into memory pandas buffers...",
            "> Running automated null value check operations...",
            "> Encoding text attributes to category factorized vectors...",
            "> Splitting dataset matrices into 80:20 validation arrays...",
            "> Starting ML Arena Competition Loop...",
            "> [COMPETING] Running Random Forest iterations...",
            "> [COMPETING] Fitting Gradient Boosting trees...",
            "> [COMPETING] Evaluating Support Vector machines...",
            "> [COMPETING] Mapping KNN neighborhood coordinates...",
            "> Gathering final loss functions and accuracy benchmarks...",
            "> [WINNER FOUND] Syncing optimal model checkpoint with SHAP explainer...",
            "> Computing shapley game-theory weights across absolute spectrum...",
            "> Success. Pipeline complete. Outputting stream vectors..."
        ];

        logsList.forEach((log, index) => {
            setTimeout(() => {
                setTerminalLogs((prev) => [...prev, log]);
            }, index * 380);
        });
    };

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setResults(null);
        setColumns([]);

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const response = await fetch(`${BACKEND_URL}/analyze-headers`, {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            if (data && data.columns) {
                setColumns(data.columns);
                setTargetColumn(data.columns[0]);
            }
        } catch (error) {
            console.error("Header checking failed:", error);
            alert("Could not connect to Backend API. Is the server awake?");
        }
    };

    const handleTrainPipeline = async () => {
        if (!file || !targetColumn) return;

        setLoading(true);
        setResults(null);
        runTerminalStream();

        const formData = new FormData();
        formData.append("file", file);
        formData.append("target_column", targetColumn);

        try {
            const response = await fetch(`${BACKEND_URL}/train`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Server returned status ${response.status}`);
            }

            const data = await response.json();

            // Delay results display slightly so terminal completes fluid sequence
            setTimeout(() => {
                setResults(data);
                setLoading(false);
            }, 5500);

        } catch (error) {
            console.error("Pipeline calculation failed:", error);
            alert("Pipeline computation failed or request timed out. Please check your Render logs.");
            setLoading(false);
        }
    };

    const getMaxShapValue = (shapObject) => {
        if (!shapObject) return 1;
        const values = Object.values(shapObject);
        return values.length > 0 ? Math.max(...values) : 1;
    };

    return (
        <div className="app-container">
            <h1 className="title">AutoML-Studio <span className="badge">v1.0 Engine</span></h1>
            <p className="subtitle">Low-Code Intelligent Analytics Suite & Neural Benchmarking Arena</p>

            <div className="upload-section">
                <input type="file" accept=".csv" onChange={handleFileChange} className="file-input" />

                {columns.length > 0 && (
                    <div className="config-panel">
                        <label className="config-label">Target Field (Y):</label>
                        <select value={targetColumn} onChange={(e) => setTargetColumn(e.target.value)}>
                            {columns.map((col) => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                        <button onClick={handleTrainPipeline} className="btn btn-train" disabled={loading}>
                            {loading ? "Processing..." : "Execute Arena Race"}
                        </button>
                    </div>
                )}
            </div>

            {/* TERMINAL LOGS OVERLAY PANEL */}
            {loading && (
                <div className="loader-container animation-fade">
                    <div className="loader-flex-row">
                        <div className="neon-spinner"></div>
                        <p className="loader-text">Compiling Model Core Pipeline Matrices...</p>
                    </div>

                    <div className="cyber-terminal">
                        <div className="terminal-header">
                            <span className="dot dot-red"></span>
                            <span className="dot dot-yellow"></span>
                            <span className="dot dot-green"></span>
                            <span className="terminal-title">automl_core_engine.sh</span>
                        </div>
                        <div className="terminal-body">
                            {terminalLogs.map((log, index) => {
                                const isCompeting = log.includes("[COMPETING]");
                                return (
                                    <div key={index} className={`terminal-line ${isCompeting ? "competing-line" : ""}`}>
                                        {log}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* METRICS & ANALYSIS DASHBOARD PANEL */}
            {results && !loading && (
                <>
                    <div className="telemetry-container">
                        <div className="metric-card highlight-blue">
                            <span className="card-label">Task Context</span>
                            <div className="card-value small-text">{results?.task_type || "N/A"}</div>
                        </div>
                        <div className="metric-card highlight-gold">
                            <span className="card-label">🏆 Arena Champion</span>
                            <div className="card-value small-text gold-glow">{results?.best_algorithm || "N/A"}</div>
                        </div>
                        <div className="metric-card">
                            <span className="card-label">Features Count</span>
                            <div className="card-value">{results?.features_count || 0}</div>
                        </div>
                        {results?.metrics && Object.entries(results.metrics).map(([name, val]) => (
                            <div className="metric-card" key={name}>
                                <span className="card-label">{name}</span>
                                <div className="card-value">{val}</div>
                            </div>
                        ))}
                    </div>

                    <div className="tabs-navbar">
                        <button
                            className={`tab-btn ${activeTab === "leaderboard" ? "active" : ""}`}
                            onClick={() => setActiveTab("leaderboard")}
                        >
                            🏁 Model Race Standings
                        </button>
                        <button
                            className={`tab-btn ${activeTab === "shap" ? "active" : ""}`}
                            onClick={() => setActiveTab("shap")}
                        >
                            🧠 Explainable AI Insights (SHAP)
                        </button>
                    </div>

                    {/* TAB CONTENT 1: HIGH-END LEADERBOARD */}
                    {activeTab === "leaderboard" && (
                        <div className="view-card animation-fade">
                            <h3 className="panel-title">Model Benchmarking Performance Standings</h3>
                            <div className="leaderboard-table">
                                <div className="table-header">
                                    <span>Rank & Algorithm Name</span>
                                    <span>Score (Accuracy / R²)</span>
                                </div>
                                {results?.leaderboard && Object.keys(results.leaderboard).length > 0 ? (
                                    Object.entries(results.leaderboard).map(([algoName, score], index) => (
                                        <div key={algoName} className={`table-row ${index === 0 ? "winner-row" : ""}`}>
                                            <div className="algo-info-side">
                                                <span className="rank-badge">{index + 1}</span>
                                                <span className="algo-title-text">{algoName}</span>
                                                {index === 0 && <span className="champion-tag">🏆 WINNER</span>}
                                            </div>
                                            <span className="score-text-highlight">
                        {score !== undefined && score > -1 ? score.toFixed(4) : "Failed"}
                      </span>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ color: "#7f8c8d", padding: "10px" }}>No leaderboard data dispatched from backend server.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT 2: SHAP VISUALIZER MATRIX */}
                    {activeTab === "shap" && (
                        <div className="view-card animation-fade">
                            <h3 className="panel-title">Global Feature Importance Spectrum</h3>
                            <p className="shap-subtitle">
                                Mathematical distribution mapping. Higher bars indicate greater weights in prediction shifts.
                            </p>
                            {results?.shap_importance && Object.keys(results.shap_importance).length > 0 ? (
                                Object.entries(results.shap_importance).map(([feature, val]) => {
                                    const maxVal = getMaxShapValue(results.shap_importance);
                                    const widthPercent = maxVal > 0 ? (val / maxVal) * 100 : 0;
                                    return (
                                        <div className="shap-row" key={feature}>
                                            <div className="shap-info">
                                                <span className="feature-name">{feature}</span>
                                                <span className="shap-val">{val !== undefined ? val.toFixed(4) : "0.0000"}</span>
                                            </div>
                                            <div className="shap-bar-wrapper">
                                                <div className="shap-bar" style={{ width: `${widthPercent}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p style={{ color: "#7f8c8d", padding: "10px" }}>No feature data available for SHAP evaluations.</p>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default App;