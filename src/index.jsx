import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import logo from "../assets/icons/icon-32.png";

const serverUrl = "https://wingman-server-h6de.onrender.com";

function Popup() {
    const [jobDesc, setJobDesc] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [decision, setDecision] = useState("");
    const [reason, setReason] = useState("");
    const [resumeEnhancements, setResumeEnhancements] = useState("");
    const [score, setScore] = useState("");
    const [coverLetter, setCoverLetter] = useState("");
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");
    const [darkMode, setDarkMode] = useState(true);

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    useEffect(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "EXTRACT_JOB" }, (response) => {
                    if (response?.job?.text) {
                        setJobDesc(response.job.text);
                        setJobTitle(response.job.title || "Untitled Job");
                    }
                });
            }
        });
    }, []);

    const handleFileUpload = (e) => {
        const selected = e.target.files[0];
        if (selected) setFile(selected);
    };

    const handleAnalyze = async () => {
        if (!jobDesc || !file) {
            setError("Job description and Resume are both required");
            return;
        }
        setLoading(true);
        setError("");

        const base64File = await fileToBase64(file);

        chrome.runtime.sendMessage(
            {
                type: "ANALYZE_RESUME",
                jobTitle: jobTitle,
                jobDescription: jobDesc,
                fileName: file.name,
                fileBase64: base64File
            },
            (response) => {
                setLoading(false);
                if (response.error) {
                    setError(response.error);
                } else {
                    const { decision, score, coverLetter, reason, resumeEnhancements } = response.result;
                    setDecision(decision);
                    setScore(score);
                    setReason(reason || "");
                    setResumeEnhancements(resumeEnhancements || "");
                    setCoverLetter(coverLetter || "");
                }
            }
        );
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(coverLetter);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    }

    const downloadAsTxt = () => {
        const blob = new Blob([coverLetter], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "cover_letter.txt";
        link.click();
    };

    const downloadAsDocx = async () => {
        try {
            const response = await fetch(`${serverUrl}/text/to/docx`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ text: coverLetter })
            });

            if (!response.ok) {
                throw new Error("Failed to download file");
            }

            // Convert response to Blob
            const blob = await response.blob();

            // Create a temporary download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "cover_letter.docx";
            document.body.appendChild(a);
            a.click();

            // Clean up
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading DOCX:", error);
        }
    };

    const AnimatedEllipses = () => {
        return (
            <span className="loading-ellipses">
                <span>.</span>
                <span>.</span>
                <span>.</span>
            </span>
        );
    }

    return (
        <div className={`popup-container ${darkMode ? "dark" : "light"}`}>
            <div className="header-row">
                <div className="title-row">
                    <img src={logo} alt="Wingman Icon" className="icon" />
                    <h2 className="title">Wingman</h2>
                </div>
                <div className="header-actions">
                    <a href="https://github.com/sbonelosth/wingman/issues/new" target="_blank" rel="noopener noreferrer" className="report-issue">
                        <span className="label">Report a Bug</span>
                    </a>
                    <button
                        className="theme-toggle"
                        onClick={() => setDarkMode(!darkMode)}
                        title="Toggle light/dark mode"
                    >
                        {darkMode ? "☀️" : "🌙"}
                    </button>
                </div>
            </div>

            <h3><span className="label">Role: </span>{jobTitle}</h3>
            <textarea
                rows="4"
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                placeholder="Paste job description here..."
                className="job-desc"
                readOnly={loading}
            />

            <input type="file" onChange={handleFileUpload} className="file-input" />

            <button onClick={handleAnalyze} disabled={loading} className="analyze-btn">
                {loading ? <>Reviewing <AnimatedEllipses /></> : "Review"}
            </button>


            {error && <p className="error-text">{error}</p>}

            {decision && (
                <div className="result-card">
                    <div className="decision-score-row">
                        <h3 className={decision === "Yes" ? "decision-yes" : "decision-no"}>
                            <span className="label">Apply: </span>{decision}
                        </h3>
                        <div className="score-container">
                            <span className="score-text">Odds: {score}%</span>
                            <div className="score-bar" style={{ width: `${score}%` }}></div>
                        </div>
                    </div>

                    <h4 className="reason-label">{decision === "Yes" ? "Why You Should Apply" : "Why You Shouldn't Apply"}</h4>
                    <p className="reason">{reason}</p>

                    {decision === "Yes" && (
                        <>
                            <h4 className="enhancements-label">Suggested Improvements</h4>
                            <p className="enhancements">{resumeEnhancements}</p>
                        </>
                    )}

                    {coverLetter && (
                        <>
                            <h4>Cover Letter</h4>
                            <textarea 
                                rows={8}
                                className="cover-letter-box"
                                value={coverLetter}
                                onChange={(e) => setCoverLetter(e.target.value)}
                            />
                            <div className="button-group">
                                <button onClick={copyToClipboard} className="copy-btn">{copied ? "Copied" : "Copy"}</button>
                                <button onClick={downloadAsTxt} className="txt-btn">TXT</button>
                                <button onClick={downloadAsDocx} className="docx-btn">DOCX</button>
                            </div>
                        </>
                    )}
                </div>
            )}
            <div className="footer-text">
                <p>Made with ❤️ by <a href="https://goto.now/DqsxT" target="_blank" rel="noopener noreferrer">Sbonelo Dube</a></p>
                <p>Powered by <a href="https://ai.google.dev/gemini-api/docs" target="_blank" rel="noopener noreferrer">Gemini</a></p>
            </div>
            <style>{`
                :root {
                    --bg: #ffffff;
                    --bg-secondary: #f5f5f5;
                    --text: #000000;
                    --text-secondary: #333333;
                    --accent: #000000;
                    --score-good: #222;
                    --score-bad: #555;
                    --link: #cfa043;
                    --error: #a2342e;
                }

                .dark {
                    --bg: #0e0e0e;
                    --bg-secondary: #1a1a1a;
                    --text: #f5f5f5;
                    --text-secondary: #cccccc;
                    --accent: #ffffff;
                    --score-good: #f5f5f5;
                    --score-bad: #888;
                }

                * {
                    font-family: "Lexend", sans-serif;
                }

                html, body {
                    background: var(--bg);
                    margin: 0;
                    padding: 0;
                }

                @font-face {
                    font-family: 'MontereyMediumFLF';
                    src: url('../assets/fonts/MontereyMediumFLF.ttf');
                }

                .popup-container {
                    padding: 4px 20px;
                    width: 370px;
                    color: var(--text);
                    background: var(--bg);
                    transition: background 0.3s, color 0.3s;
                }

                .header-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .title-row {
                    display: flex;
                    align-items: center;
                }
                
                .title {
                    font-family: 'MontereyMediumFLF', sans-serif;
                    font-size: 18px;
                }

                .icon {
                    width: 32px;
                    aspect-ratio: 1;
                    margin-right: 8px;
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .report-issue {
                    text-decoration: none;
                    font-size: 11px;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: all 0.2s ease-in-out;
                }

                a {
                    color: var(--link);
                    text-decoration: none;
                }

                a:hover {
                    text-decoration: underline;
                }

                .theme-toggle {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 18px;
                }

                .job-desc,
                .cover-letter-box {
                    width: 100%;
                    padding: 10px;
                    border-radius: 8px;
                    border: 1px solid var(--text-secondary);
                    margin-bottom: 12px;
                    background: var(--bg-secondary);
                    color: var(--text);
                    box-sizing: border-box;
                }

                .file-input {
                    margin-bottom: 12px;
                    color: var(--text-secondary);
                }

                .analyze-btn {
                    width: 100%;
                    padding: 10px;
                    background: var(--accent);
                    border: none;
                    border-radius: 8px;
                    color: var(--bg);
                    font-weight: 600;
                    cursor: pointer;
                    margin-bottom: 8px;
                }

                .error-text {
                    color: var(--error);
                }

                .result-card {
                    background: var(--bg-secondary);
                    padding: 15px;
                    border-radius: 8px;
                }

                .decision-score-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .score-container {
                    position: relative;
                    width: 120px;
                    height: 18px;
                    background: var(--score-bad);
                    border-radius: 9px;
                    overflow: hidden;
                }

                .score-bar {
                    height: 100%;
                    background: var(--score-good);
                    transition: width 0.8s ease-in-out;
                }

                .score-text {
                    position: absolute;
                    z-index: 10;
                    width: 100%;
                    text-align: center;
                    font-size: 11px;
                    font-weight: bold;
                    color: var(--bg);
                }

                .button-group {
                    width: 100%;
                    display: flex;
                    gap: 10px;
                    margin-top: 4px;
                }

                .button-group button {
                    flex: 1;
                    padding: 8px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    background: var(--accent);
                    color: var(--bg);
                }

                .loading-ellipses {
                    display: inline-flex;
                    gap: 2px;
                }

                .loading-ellipses span {
                    animation: ellipses-blink 1.4s infinite;
                    opacity: 0;
                }

                .loading-ellipses span:nth-child(1) {
                    animation-delay: 0s;
                }
                .loading-ellipses span:nth-child(2) {
                    animation-delay: 0.2s;
                }
                .loading-ellipses span:nth-child(3) {
                    animation-delay: 0.4s;
                }

                @keyframes ellipses-blink {
                    0% { opacity: 0; }
                    20% { opacity: 1; }
                    100% { opacity: 0; }
                }

                .footer-text {
                    margin-top: 20px;
                    text-align: center;
                    font-size: 10px;
                    border-top: 1px solid var(--text-secondary);
                    padding: 10px 0;
                }
            `}
            </style>
        </div>
    );
}

const root = createRoot(document.getElementById("root"));
root.render(<Popup />);