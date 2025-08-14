// content_script.js
(function () {
  function getTitle() {
    const selectors = ['h1', '[data-job-title]', '.job-title', '.posting-headline', 'h2'];
    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el && el.innerText && el.innerText.trim().length > 3) return el.innerText.trim();
    }
    return document.title || '';
  }

  function getDescription() {
    const selectors = ['[class*="jobDescription"]', '[class*="description"]', '[class*="job-content"]', 'article', 'section', '[itemprop="description"]'];
    let best = '';
    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el && el.innerText && el.innerText.trim().length > best.length) best = el.innerText.trim();
    }
    if (!best) {
      const paragraphs = Array.from(document.querySelectorAll('p')).map(p => p.innerText.trim()).filter(Boolean);
      paragraphs.sort((a,b) => b.length - a.length);
      best = paragraphs[0] || '';
    }
    return best;
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'EXTRACT_JOB') {
      sendResponse({ job: { title: getTitle(), text: getDescription(), url: location.href } });
    }
  });
})();