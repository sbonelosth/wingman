const serverUrl = "https://wingman-server-h6de.onrender.com";

// Upload file to Flask
async function extractTextFromFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${serverUrl}/extract/text`, {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "File upload failed");
  return data;
}

// Analyze with Gemini and return JSON
async function analyzeWithGemini(jobTitle, jobDescription, extractedText) {
  const res = await fetch(`${serverUrl}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobTitle, jobDescription, extractedText })
  });

  if (!res.ok) throw new Error("Analysis failed");
  return await res.json();
}

// Helper: decode base64 -> File
function base64ToBlob(base64, mimeType) {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ANALYZE_RESUME") {
    (async () => {
      try {
        const blob = base64ToBlob(message.fileBase64, "application/octet-stream");
        const file = new File([blob], message.fileName);

        const { text: extractedText } = await extractTextFromFile(file);
        const result = await analyzeWithGemini(message.jobTitle, message.jobDescription, extractedText);

        sendResponse({ result });
      } catch (err) {
        sendResponse({ error: err.message });
      }
    })();
    return true; // keep channel open
  }
});

const jobKeywords = [
  "job", "career", "vacancy", "hiring", "apply", "opportunity",
  "jobs", "work-with-us", "position", "employment"
];

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  const url = tab.url.toLowerCase();

  // Skip if already in our manifest matches
  if (matchesPopularPortals(url)) return;

  // Inject if URL contains job-related keywords
  if (jobKeywords.some(keyword => url.includes(keyword))) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["dist/content.js"]
    });
  }
});

function matchesPopularPortals(url) {
  const portals = [
    "linkedin.com/jobs",
    "indeed.com",
    "glassdoor.com",
    "monster.com",
    "ziprecruiter.com",
    "simplyhired.com",
    "careerbuilder.com",
    "jobstreet",
    "seek.com",
    "reed.co.uk",
    "totaljobs.com",
    "workopolis.com",
    "bayt.com",
    "naukri.com",
    "foundit.in",
    "jobsdb",
    "stepstone",
    "adzuna"
  ];
  return portals.some(portal => url.includes(portal));
}