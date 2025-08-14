# Wingman - AI Job Application Assistant

Wingman is a Chrome Extension that analyzes your resume against a job description using AI, 
and provides recommendations, a match score, and a generated cover letter (when applicable).

---

## Features

- **Automatic Job Description Extraction** from active tab
- **Resume Analysis** powered by AI
- **Match Decision** (Yes / No) with reasoning
- **Match Score** visual indicator
- **Resume Enhancement Suggestions**
- **Cover Letter Generation** (only for high-scoring matches)
- **Export Options**:
  - Copy to Clipboard
  - Download as TXT
  - Download as DOCX
- **Dark / Light Theme Toggle** for professional aesthetics

---

## Tech Stack

- **Frontend**: React (with JSX), CSS Modules
- **Backend**: Flask (Python)
- **Bundler**: Webpack 5
- **Styling**: Custom CSS with theme switch support
- **Document Generation**: `docx` (lazy-loaded)

---

## Folder Structure

```
.
├── src
│   ├── background.js
│   ├── content.js
│   ├── index.jsx
│   ├── index.css
├── assets
│   ├── fonts
│   ├── icons
├── manifest.json
├── webpack.config.js
├── package.json
├── package-lock.json
├── .babelrc
├── .gitignore
├── index.html
└── README.md
```

---

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/sbonelosth/wingman.git
cd wingman
```

2. **Install dependencies**

```bash
npm install
```

3. **Build the extension**

```bash
npm run build
```

4. **Load in Chrome**

- Open `chrome://extensions/`
- Enable **Developer Mode**
- Click **Load unpacked** and select the `dist/` folder

5. **Run Flask backend**

```bash
pip install -r requirements.txt
python app.py
```

---

## Development

To start development mode with live reloading:

```bash
npm start
```

---

## Icon Sizes

The extension icons should be provided in the following resolutions:

- **16x16** - Toolbar icon
- **32x32** - Popup UI
- **48x48** - Extension management page
- **128x128** - Chrome Web Store listing

---

## License

MIT License. Feel free to use and modify.

---

## Screenshots

*(Add screenshots of the extension here)*
