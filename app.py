import re
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, request
from bs4 import BeautifulSoup

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    req = urllib.request.Request(FEED_URL, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as response:
        xml_data = response.read()
        
    root = ET.fromstring(xml_data)
    namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
    entries = root.findall('atom:entry', namespaces)
    
    parsed_updates = []
    
    for entry_idx, entry in enumerate(entries):
        date_str = entry.find('atom:title', namespaces).text
        updated_str = entry.find('atom:updated', namespaces).text
        
        link_elem = entry.find("atom:link[@rel='alternate']", namespaces)
        base_link = link_elem.get('href') if link_elem is not None else "https://cloud.google.com/bigquery/docs/release-notes"
        
        content_elem = entry.find('atom:content', namespaces)
        if content_elem is None or not content_elem.text:
            continue
            
        content_html = content_elem.text
        
        # Split content by <h3> headers to isolate individual updates
        sections = re.split(r'(?=<h3[^>]*>)', content_html)
        sections = [s.strip() for s in sections if s.strip()]
        
        for sec_idx, section in enumerate(sections):
            # Parse the category from <h3>
            h3_match = re.search(r'<h3[^>]*>(.*?)</h3>', section, re.DOTALL)
            category = "General"
            if h3_match:
                category = h3_match.group(1).strip()
            
            # Clean HTML to create a text version for tweeting
            soup = BeautifulSoup(section, 'html.parser')
            # Remove any h3 tag from text content
            if soup.h3:
                soup.h3.decompose()
                
            text_content = soup.get_text(separator=' ')
            # Clean up whitespace
            text_content = re.sub(r'\s+', ' ', text_content).strip()
            
            # Construct a deep link to the specific section if possible
            # BigQuery release notes usually use the date as anchor, e.g. #June_17_2026
            # We can use the date anchor or base link
            anchor_date = date_str.replace(' ', '_').replace(',', '')
            link = f"https://cloud.google.com/bigquery/docs/release-notes#{anchor_date}"
            
            update_id = f"{entry_idx}-{sec_idx}"
            parsed_updates.append({
                "id": update_id,
                "date": date_str,
                "date_iso": updated_str,
                "link": link,
                "category": category,
                "html_content": section,
                "text_content": text_content
            })
            
    return parsed_updates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    try:
        updates = fetch_and_parse_feed()
        return jsonify({
            "status": "success",
            "count": len(updates),
            "data": updates
        })
    except Exception as e:
        app.logger.error(f"Error fetching/parsing feed: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to fetch release notes: {str(e)}"
        }), 500

if __name__ == '__main__':
    # Running Flask app on port 5000
    app.run(debug=True, host='0.0.0.0', port=5000)
