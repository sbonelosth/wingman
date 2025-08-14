const GEMINI_API_KEY = "AIzaSyBZneyhOjQ8S_TcsMTg2tK8hi0AsKfhRW4";

// Upload file to Flask
async function uploadFileToGemini(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`http://127.0.0.1:5000/extract-text`, {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "File upload failed");
  return data; // should contain extracted text
}

// Analyze with Gemini and return JSON
async function analyzeWithGemini(jobDescription, extractedText) {
  const prompt = `
    You are an AI career assistant.
    You will receive:
    1. A job description (plain text).
    2. A resume's extracted text.

    Your task:
    - Avoid speaking third person.
    - Compare the resume against the job description.
    - Decide if the candidate should apply ("Yes") or not ("No").
    - Justify your decision in 1 informed sentence, by speaking directly to the candidate, not in third person.
    - Provide a match score from 0 to 100.
    - ONLY generate a "coverLetter" if decision is "Yes" AND score is 60 or higher.
    - If decision is "No" or score < 60, set "coverLetter" to an empty string "".
    - If decision is "Yes", based on the job requirements, suggest the exact resume enhancements to make it ATS friendly and increase the chances of the candidate at being considered.
    - Speak directly to the user, not in third person, e.g "You do not have the required qualification for this role."

    Respond ONLY in this exact JSON format with no extra text:

    {
      "decision": "Yes" or "No",
      "reason": "<1 sentence explaining decision>",
      "score": <percentage number from 0 to 100>,
      "coverLetter": "<cover letter text or empty string>",
      "resumeEnhancements": "<suggestions for ATS friendly resume>"
    }

    Job Description:
    ${jobDescription}

    Resume:
    ${extractedText}
  `;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Gemini analysis failed");

  let textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  textOutput = textOutput.trim();
  if (textOutput.startsWith("```")) {
    textOutput = textOutput
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();
  }

  try {
    return JSON.parse(textOutput);
  } catch (err) {
    throw new Error("Invalid JSON from Gemini");
  }
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

        const { text: extractedText } = await uploadFileToGemini(file);
        const result = await analyzeWithGemini(message.jobDescription, extractedText);

        sendResponse({ result });
      } catch (err) {
        sendResponse({ error: err.message });
      }
    })();
    return true; // keep channel open
  }
});