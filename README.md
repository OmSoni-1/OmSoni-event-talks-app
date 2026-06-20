# BigQuery Release Hub

A premium, modern dark-themed web application built with **Python Flask** and **Vanilla HTML, CSS, and JS** to fetch, search, filter, and share Google Cloud BigQuery Release Notes.

It parses the official Google Cloud BigQuery Release Notes Atom Feed and provides a sleek dashboard to track updates, filter by categories, and compose styled tweets to share updates directly on X (formerly Twitter).

---

## 🎨 UI Preview

The application features a modern, responsive, and glassmorphic user interface:
* **Interactive Timeline**: Clean layout grouping updates by release date.
* **Category Tagging**: Updates are automatically categorized into Features, Changes, Issues, Announcements, and Deprecations with distinct color badges.
* **Social Sharing**: A simulated Twitter post workspace that auto-drafts update contents, appends deep links, tracks character count limits, and launches Twitter Web Intents.

---

## 🚀 Key Features

* **Granular Release Extraction**: Google Cloud groups feed entries daily. The backend parses each entry's HTML, splits it by `<h3>` tags to extract individual updates, and maps them to granular items.
* **Search & Filters**: Instant full-text search and category pills to drill down into specific updates (e.g. search for "embeddings" or filter only "Features").
* **Twitter/X Integration**: 
  - Automatically drafts a summary tweet for any selected update.
  - Implements a simulated Twitter card layout for live previews.
  - Features an interactive circular progress indicator for character count.
  - Adheres to Twitter's URL character rules (all links count exactly as 23 characters).
  - Copy to clipboard and direct post actions.
* **Responsive Layout**: Adapts gracefully to both desktop displays and mobile screen dimensions.

---

## 🛠️ Architecture & Technologies

* **Backend**:
  - [Python 3](https://www.python.org/)
  - [Flask](https://flask.palletsprojects.com/) (Web Server & Routing)
  - [requests](https://requests.readthedocs.io/) (HTTP Client)
  - [BeautifulSoup4](https://www.crummy.com/software/BeautifulSoup/) (HTML parser and text sanitization)
  - `xml.etree.ElementTree` (XML parsing)
* **Frontend**:
  - Vanilla HTML5 (Semantic elements)
  - Vanilla CSS3 (Custom properties/variables, Grid, Flexbox, animations)
  - Vanilla JavaScript (ES6+, DOM API, asynchronous operations, state management)
  - [FontAwesome](https://fontawesome.com/) (Icons)
  - Google Fonts (Outfit & Inter)

---

## 📁 Repository Structure

```text
├── static/
│   ├── css/
│   │   └── style.css       # Custom design system, styling, and animations
│   └── js/
│       └── app.js          # Main client application logic and state management
├── templates/
│   └── index.html          # Main HTML structure
├── app.py                  # Flask backend and feed parser
├── requirements.txt        # Python dependency specifications
├── .gitignore              # Git file exclusions
└── README.md               # Project documentation
```

---

## ⚙️ Getting Started & Local Installation

Follow these steps to run the application locally:

### 1. Prerequisites
Ensure you have **Python 3.8+** installed on your system.

### 2. Clone the repository
```bash
git clone https://github.com/OmSoni-1/OmSoni-event-talks-app.git
cd OmSoni-event-talks-app
```

### 3. Create a Virtual Environment
Initialize a virtual environment to manage dependencies locally:
* **Windows**:
  ```cmd
  python -m venv .venv
  .venv\Scripts\activate
  ```
* **macOS/Linux**:
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate
  ```

### 4. Install Dependencies
Install all package requirements specified in `requirements.txt`:
```bash
pip install -r requirements.txt
```

### 5. Run the Server
Start the Flask application server:
```bash
python app.py
```

By default, the server will start in debug mode on **`http://127.0.0.1:5000`**. Open this address in your web browser to access the BigQuery Release Hub!