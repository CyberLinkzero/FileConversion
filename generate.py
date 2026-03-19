from pathlib import Path

nav_links = [
    ("csv-to-json.html", "CSV to JSON"),
    ("how-to-convert-csv-to-json.html", "How to Convert CSV to JSON"),
    ("json-to-csv.html", "JSON to CSV"),
    ("how-to-convert-json-to-csv.html", "How to Convert JSON to CSV"),
    ("docx-to-json.html", "DOCX to JSON"),
    ("how-to-convert-docx-to-json.html", "How to Convert DOCX to JSON"),
    ("xml-to-json.html", "XML to JSON"),
    ("how-to-convert-xml-to-json.html", "How to Convert XML to JSON"),
    ("json-to-xml.html", "JSON to XML"),
    ("how-to-convert-json-to-xml.html", "How to Convert JSON to XML"),
    ("pdf-to-word.html", "PDF to Word"),
    ("how-to-convert-pdf-to-word.html", "How to Convert PDF to Word"),
    ("word-to-pdf.html", "Word to PDF"),
    ("how-to-convert-word-to-pdf.html", "How to Convert Word to PDF"),
    ("png-to-jpg.html", "PNG to JPG"),
    ("how-to-convert-png-to-jpg.html", "How to Convert PNG to JPG"),
    ("jpg-to-png.html", "JPG to PNG"),
    ("how-to-convert-jpg-to-png.html", "How to Convert JPG to PNG"),
    ("mov-to-mp4.html", "MOV to MP4"),
    ("how-to-convert-mov-to-mp4.html", "How to Convert MOV to MP4"),
]

nav_html = '''<nav class="tabs" aria-label="Primary Navigation">
  <div class="tab-group">
    <span class="tab group-label">📁 File Tools ▾</span>
    <div class="dropdown">
      <a class="tab" href="index.html">Home</a>
      <a class="tab" href="images.html">Images</a>
      <a class="tab" href="audio.html">Audio</a>
      <a class="tab" href="video.html">Video</a>
      <a class="tab" href="pdf.html">PDF</a>
      <a class="tab" href="docx.html">DOCX</a>
      <a class="tab" href="json.html">JSON</a>
      <a class="tab" href="data.html">CSV / XLSX / GPS Data</a>
      <a class="tab" href="archive.html">ZIP Tools</a>
      <a class="tab" href="background_remover.html">Image Editor Tool</a>
      <a class="tab" href="gps.html">GPS Tools</a>
      <a class="tab" href="gps-file-guide.html">GPS Guide</a>
      <a class="tab" href="choosing-the-right-file-type.html">File Type Guide</a>
      <a class="tab" href="image-file-guide.html">Image Guide</a>
      <a class="tab" href="audio-file-guide.html">Audio Guide</a>
      <a class="tab" href="video-file-guide.html">Video Guide</a>
    </div>
  </div>

  <div class="tab-group">
    <span class="tab group-label">⚡ Popular Converters ▾</span>
    <div class="dropdown">
      <a class="tab" href="csv-to-json.html">CSV to JSON</a>
      <a class="tab" href="json-to-csv.html">JSON to CSV</a>
      <a class="tab" href="docx-to-json.html">DOCX to JSON</a>
      <a class="tab" href="xml-to-json.html">XML to JSON</a>
      <a class="tab" href="json-to-xml.html">JSON to XML</a>
      <a class="tab" href="pdf-to-word.html">PDF to Word</a>
      <a class="tab" href="word-to-pdf.html">Word to PDF</a>
      <a class="tab" href="png-to-jpg.html">PNG to JPG</a>
      <a class="tab" href="jpg-to-png.html">JPG to PNG</a>
      <a class="tab" href="mov-to-mp4.html">MOV to MP4</a>
    </div>
  </div>

  <div class="tab-group">
    <span class="tab group-label">📘 How-To Guides ▾</span>
    <div class="dropdown">
      <a class="tab" href="how-to-convert-csv-to-json.html">How to Convert CSV to JSON</a>
      <a class="tab" href="how-to-convert-json-to-csv.html">How to Convert JSON to CSV</a>
      <a class="tab" href="how-to-convert-docx-to-json.html">How to Convert DOCX to JSON</a>
      <a class="tab" href="how-to-convert-xml-to-json.html">How to Convert XML to JSON</a>
      <a class="tab" href="how-to-convert-json-to-xml.html">How to Convert JSON to XML</a>
      <a class="tab" href="how-to-convert-pdf-to-word.html">How to Convert PDF to Word</a>
      <a class="tab" href="how-to-convert-word-to-pdf.html">How to Convert Word to PDF</a>
      <a class="tab" href="how-to-convert-png-to-jpg.html">How to Convert PNG to JPG</a>
      <a class="tab" href="how-to-convert-jpg-to-png.html">How to Convert JPG to PNG</a>
      <a class="tab" href="how-to-convert-mov-to-mp4.html">How to Convert MOV to MP4</a>
    </div>
  </div>

  <div class="tab-group">
    <span class="tab group-label">🛠 Software ▾</span>
    <div class="dropdown">
      <a class="tab" href="graze-inventory-console.html">GrazeCart Inventory Console</a>
      <a class="tab" href="cyberchat.html">Cyber Chat</a>
      <a class="tab" href="Music.html">Music Tools</a>
      <a class="tab" href="programming.html">Programming Lab</a>
      <a class="tab" href="cyber-clean.html">Cyber Clean Registry Cleaner</a>
    </div>
  </div>

  <div class="tab-group">
    <span class="tab group-label">🎮 Games ▾</span>
    <div class="dropdown">
      <a class="tab" href="Cyberpets.html">Cyber Pets</a>
      <a class="tab" href="cyber-chess.html">Cyber Chess</a>
      <a class="tab" href="compression-puzzle.html">Compression Puzzle</a>
      <a class="tab" href="bsnes-emulator.html">Cyber Snes Emulator</a>
    </div>
  </div>
</nav>'''

css = '''
:root{
  --bg:#0f1117; --bg2:#171b24; --card:#121826; --line:#25304a; --text:#eef4ff;
  --muted:#b9c6df; --brand:#7dd3fc; --accent:#a78bfa; --ok:#86efac;
}
*{box-sizing:border-box}
body{margin:0;font-family:Arial,Helvetica,sans-serif;background:linear-gradient(180deg,var(--bg),#0b0f16 40%, #111827);color:var(--text);line-height:1.65}
.container{max-width:1100px;margin:0 auto;padding:24px}
a{color:var(--brand);text-decoration:none}
a:hover{text-decoration:underline}
.hero{padding:28px;border:1px solid var(--line);border-radius:22px;background:linear-gradient(135deg,rgba(125,211,252,.10),rgba(167,139,250,.10));box-shadow:0 10px 35px rgba(0,0,0,.25)}
.badge{display:inline-block;padding:6px 10px;border-radius:999px;background:#122033;border:1px solid #28405e;color:var(--brand);font-size:13px;margin-bottom:12px}
.grid{display:grid;grid-template-columns:2fr 1fr;gap:22px;margin-top:24px}
.card{background:rgba(18,24,38,.9);border:1px solid var(--line);border-radius:20px;padding:22px;margin-top:20px}
.card h2,.card h3{margin-top:0}
.cta{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}
.btn{display:inline-block;padding:12px 16px;border-radius:12px;border:1px solid var(--line);font-weight:700}
.btn.primary{background:linear-gradient(90deg,var(--brand),var(--accent));color:#08111c;border:none}
.tool-box{background:#0b1220;border:1px dashed #35507d;border-radius:16px;padding:18px;margin:18px 0}
.input-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.fake-input,.fake-output{background:#08101b;border:1px solid var(--line);padding:14px;border-radius:14px;color:var(--muted);min-height:90px}
ul,ol{padding-left:20px}
.tabs{display:flex;gap:14px;flex-wrap:wrap;padding:16px 24px;border-bottom:1px solid var(--line);background:rgba(7,10,17,.9);position:sticky;top:0;backdrop-filter:blur(10px);z-index:5}
.tab-group{position:relative}
.group-label,.tab{display:inline-block;padding:10px 14px;border-radius:12px;border:1px solid var(--line);background:#111827;color:var(--text)}
.dropdown{display:none;position:absolute;top:48px;left:0;min-width:270px;background:#0c1320;border:1px solid var(--line);border-radius:16px;padding:10px;box-shadow:0 18px 40px rgba(0,0,0,.35)}
.dropdown .tab{display:block;margin:6px 0}
.tab-group:hover .dropdown{display:block}
.related a{display:block;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:#0d1422;margin-bottom:10px}
.small{font-size:14px;color:var(--muted)}
footer{padding:28px 24px 60px;color:var(--muted)}
@media (max-width:900px){.grid{grid-template-columns:1fr}.input-row{grid-template-columns:1fr}.dropdown{position:static;display:block;min-width:unset;margin-top:8px}.tabs{display:block}.tab-group{margin-bottom:10px}}
'''

footer = '<footer><div class="container"><p>FileConverter.run pages built for SEO, usability, and privacy-first conversions. Files stay in your browser whenever supported by the tool.</p></div></footer>'

pairs = [
    {
        'tool_file':'csv-to-json.html','tool_title':'CSV to JSON Converter','guide_file':'how-to-convert-csv-to-json.html','guide_title':'How to Convert CSV to JSON',
        'description':'Turn spreadsheet-style CSV data into clean JSON for APIs, web apps, imports, and automation workflows.',
        'who':'developers, analysts, and teams moving tabular data into modern apps',
        'steps':['Upload or paste your CSV data.','Confirm headers and delimiter settings.','Convert to structured JSON output.','Copy the result or download the JSON file.'],
        'best':['Keep the first row as column headers for cleaner keys.','Check date fields and numeric formatting before export.','Validate the final JSON before importing into an API or app.'],
        'faq':[('Why convert CSV to JSON?','JSON is easier to use in web apps, JavaScript projects, APIs, and automation tools.'),('Will my data stay private?','On FileConverter.run, privacy-first tools can process files in the browser so your content stays under your control.')],
        'guide_paras':[
            'CSV files are still one of the most common ways to move data between spreadsheets, CRMs, inventory systems, analytics platforms, and exports from older software. The problem is that most modern applications do not want data as raw comma-separated text. They want JSON because it is easier to read programmatically, easier to send through APIs, and better suited for JavaScript-based workflows.',
            'A good CSV to JSON guide should do more than say “upload and convert.” It should explain what happens to rows, how column headers become keys, and why clean formatting matters. If your first row contains labels like name, email, quantity, or order_total, those values usually become the JSON key names. Every row under them becomes an object in an array. That structure makes the data much easier to work with in code, dashboards, and imports.',
            'The fastest method is to use a dedicated conversion page. You can jump straight to the <a href="csv-to-json.html">CSV to JSON converter tool</a> when you are ready. This is especially useful when you want a clean result without opening developer software or writing a script. It also reduces formatting mistakes that often happen when users copy data between apps manually.',
            'Before converting, take a minute to review the CSV itself. Make sure the header row is present, quoted values are consistent, and there are no extra commas in free-text fields unless those values are properly wrapped in quotes. Small cleanup steps prevent broken JSON output later. This matters even more for product catalogs, customer lists, inventory exports, and application imports.',
            'After conversion, validate the JSON and skim the first few records. Check for blank keys, unexpected null values, and number fields that may have become strings. When the output looks correct, you can move on to your next workflow, whether that is feeding an API, building a web app, or loading structured data into a database.'
        ],
        'related':['json-to-csv.html','xml-to-json.html','json-to-xml.html']
    },
    {
        'tool_file':'json-to-csv.html','tool_title':'JSON to CSV Converter','guide_file':'how-to-convert-json-to-csv.html','guide_title':'How to Convert JSON to CSV',
        'description':'Flatten JSON into spreadsheet-ready CSV for reporting, imports, audits, and sharing with non-technical teams.',
        'who':'operations teams, marketers, analysts, and developers who need data in rows and columns',
        'steps':['Upload or paste JSON content.','Select how nested fields should be handled.','Convert to CSV format.','Download the CSV for Excel, Google Sheets, or imports.'],
        'best':['Use consistent object keys for every record.','Flatten nested objects before sending to spreadsheet users.','Spot-check special characters and commas after conversion.'],
        'faq':[('Why convert JSON to CSV?','CSV makes structured data easier to review in spreadsheets and business tools.'),('Can I use this for reports?','Yes. JSON to CSV is useful for exports, dashboards, reconciliation, and reporting workflows.')],
        'guide_paras':[
            'JSON is powerful for software, but it is not the easiest format for many business users to review. When a team needs to sort, filter, print, or share data, CSV is often the better choice. A JSON to CSV workflow turns structured objects into rows and columns that work with Excel, Google Sheets, and many import tools.',
            'The main challenge is structure. JSON can include nested objects, arrays, and inconsistent key names. CSV expects a flatter format. That means your conversion tool needs to map keys into columns cleanly and make sure each record lines up in a readable table. A quality workflow saves time and avoids the painful manual cleanup that happens when people try to reformat JSON by hand.',
            'The simplest path is to use the <a href="json-to-csv.html">JSON to CSV tool page</a>. This gives you a direct way to turn JSON exports into something operations, accounting, inventory, or sales teams can open instantly. It is especially useful when you are working with API responses, ecommerce exports, product feeds, or application logs that need spreadsheet review.',
            'Before you convert, look for deeply nested fields. Decide whether you want every nested value flattened into a column or whether some arrays should be removed before export. A cleaner starting file makes for a more useful CSV. If you plan to upload the result to another tool, double-check that the column names match the destination system’s expected fields.',
            'Once the CSV is generated, open it and scan a few rows. Check for broken commas inside text fields, date formatting, and number precision. Small review steps keep imports clean and help non-technical users work with the data confidently.'
        ],
        'related':['csv-to-json.html','json-to-xml.html','docx-to-json.html']
    },
    {
        'tool_file':'docx-to-json.html','tool_title':'DOCX to JSON Converter','guide_file':'how-to-convert-docx-to-json.html','guide_title':'How to Convert DOCX to JSON',
        'description':'Extract text and document structure from Word files into JSON for automation, indexing, content pipelines, and app use.',
        'who':'developers, content teams, researchers, and businesses converting Word content into structured data',
        'steps':['Upload your DOCX file.','Choose plain text or structured extraction mode.','Convert the document content into JSON.','Download or copy the JSON output.'],
        'best':['Use consistent headings if you want cleaner structured output.','Remove tracked changes before converting for cleaner text extraction.','Check special characters, tables, and bullet lists after conversion.'],
        'faq':[('Why convert DOCX to JSON?','JSON makes it easier to move document content into apps, databases, search systems, and automation pipelines.'),('Will formatting stay exactly the same?','The goal is structured content extraction, not visual page layout recreation.')],
        'guide_paras':[
            'DOCX files are excellent for editing, collaboration, and office workflows, but they are not ideal when you need machine-readable content. That is where DOCX to JSON conversion becomes useful. Instead of working with a closed document format, you can move text, headings, lists, and other content into a flexible structure that works in apps, APIs, automation scripts, and databases.',
            'This matters for content operations, legal archives, knowledge bases, product documentation, and AI preparation workflows. Many teams already keep source material in Word format, but their downstream tools need JSON. With the right conversion process, you can transform editable office documents into structured data that is much easier to process at scale.',
            'When you are ready, use the <a href="docx-to-json.html">DOCX to JSON converter</a>. It gives you a faster path than manually copying sections from Word and pasting them into custom objects. It is especially helpful when you need repeatable output for content indexing or internal tooling.',
            'Before converting, simplify the document where possible. Clear headings, consistent bullet styles, and fewer hidden formatting artifacts generally lead to cleaner extraction. If the document contains complex tables or tracked changes, review those sections after conversion because they may need special handling depending on your workflow.',
            'After conversion, decide how you want to use the JSON. Some users need a plain content dump. Others want sections mapped by heading, paragraph, or block type. Review the output and keep a sample schema handy so your imports stay consistent across many documents.'
        ],
        'related':['csv-to-json.html','xml-to-json.html','pdf-to-word.html']
    },
    {
        'tool_file':'xml-to-json.html','tool_title':'XML to JSON Converter','guide_file':'how-to-convert-xml-to-json.html','guide_title':'How to Convert XML to JSON',
        'description':'Convert XML feeds, documents, and exports into JSON for modern apps, APIs, and cleaner data handling.',
        'who':'developers, integrators, ecommerce managers, and analysts dealing with legacy exports or feed data',
        'steps':['Upload or paste XML content.','Convert tags and attributes into JSON structure.','Review nested objects and arrays.','Download the JSON output.'],
        'best':['Validate the XML first if you suspect malformed tags.','Check whether repeated elements should become arrays.','Review attributes and text nodes after conversion.'],
        'faq':[('Why convert XML to JSON?','JSON is lighter and usually easier for modern web services and JavaScript apps to work with.'),('Can this help with feeds and imports?','Yes. XML to JSON is common for inventory feeds, API migrations, and system integrations.')],
        'guide_paras':[
            'XML still powers many important workflows, especially in feeds, enterprise exports, product catalogs, and older integrations. Even so, most modern development work prefers JSON. It is lighter, easier to parse in JavaScript, and often simpler to send between applications. That is why XML to JSON conversion is a regular task for developers and business teams alike.',
            'The biggest thing to understand is how structure changes. XML uses nested tags, attributes, and text nodes. JSON uses keys, values, objects, and arrays. A good conversion keeps the meaning of the original data while presenting it in a format that is easier to work with in code and APIs.',
            'You can handle the conversion directly with the <a href="xml-to-json.html">XML to JSON tool</a>. This is useful when you do not want to write a custom parser or when you need to convert feeds quickly for troubleshooting, app imports, or testing. It is especially handy for ecommerce feeds, sitemap-style data, configuration exports, and integration debugging.',
            'Before converting, check whether the XML is valid and whether repeated tags represent a list. That detail matters because repeated elements often need to become arrays in JSON. Also pay attention to attributes. Some workflows need attributes preserved clearly so no data is lost in the translation.',
            'After conversion, scan the JSON structure and confirm that nesting matches your expectations. The goal is not just successful conversion. The goal is usable output that works correctly in your next system.'
        ],
        'related':['json-to-xml.html','csv-to-json.html','json-to-csv.html']
    },
    {
        'tool_file':'json-to-xml.html','tool_title':'JSON to XML Converter','guide_file':'how-to-convert-json-to-xml.html','guide_title':'How to Convert JSON to XML',
        'description':'Convert JSON objects into XML for integrations, feeds, enterprise systems, and legacy software requirements.',
        'who':'developers and operations teams working with systems that still expect XML',
        'steps':['Upload or paste JSON data.','Map objects and arrays into XML nodes.','Review tags and nesting.','Download the XML output.'],
        'best':['Use stable key names to create readable XML tags.','Check array handling before importing into a strict system.','Validate the final XML if the destination requires schema compliance.'],
        'faq':[('When is JSON to XML useful?','It is useful when a modern app exports JSON but the receiving system requires XML.'),('Can I use this for feeds?','Yes. Many internal tools, suppliers, and legacy systems still rely on XML feeds.')],
        'guide_paras':[
            'JSON is common in modern apps, but XML has not disappeared. Many suppliers, enterprise tools, procurement systems, and legacy integrations still expect XML. That creates a common challenge: your source data is JSON, but your destination workflow only accepts XML. In that case, a dedicated JSON to XML conversion process saves time and reduces errors.',
            'The first thing to remember is that XML is stricter about structure and readability. JSON objects can map naturally to nested XML tags, but arrays and repeated items need careful handling. If a receiving system expects a specific tag order or root element, you should know that before exporting.',
            'When you need a fast workflow, use the <a href="json-to-xml.html">JSON to XML converter page</a>. It provides a straightforward way to transform modern app data into an XML-ready output that is easier to test and import. This can be especially helpful for feeds, inventory syncs, order exports, and enterprise handoffs.',
            'Before converting, review the JSON for inconsistent keys or mixed object shapes. XML imports tend to work best when the source objects follow a consistent structure. If you are preparing a feed for another team or vendor, it is smart to confirm naming expectations ahead of time.',
            'Once the XML is generated, validate it and inspect a few nested sections. Look for empty tags, repeated items, and root-node structure. A clean review before import prevents hard-to-debug failures later.'
        ],
        'related':['xml-to-json.html','json-to-csv.html','docx-to-json.html']
    },
    {
        'tool_file':'pdf-to-word.html','tool_title':'PDF to Word Converter','guide_file':'how-to-convert-pdf-to-word.html','guide_title':'How to Convert PDF to Word',
        'description':'Convert PDF files into editable Word documents for updates, reuse, correction, and office workflows.',
        'who':'students, office users, legal teams, and anyone who needs to edit a locked PDF',
        'steps':['Upload your PDF file.','Run the conversion to DOCX.','Review formatting and text flow.','Download the editable Word document.'],
        'best':['Use clear source PDFs for better text recognition.','Review tables, headers, and page breaks after conversion.','Save as DOCX if you plan to continue editing in Word.'],
        'faq':[('Why convert PDF to Word?','It lets you edit content that would otherwise be locked inside a PDF.'),('Will the layout match perfectly?','Many files convert very well, but complex layouts should always be checked afterward.')],
        'guide_paras':[
            'PDF files are excellent for sharing finished documents because they preserve layout across devices. The downside is that they are hard to edit. That is exactly why PDF to Word conversion is so popular. It turns a locked or print-ready document into something editable that you can update, revise, or reuse.',
            'This is useful for resumes, contracts, school forms, product sheets, proposals, and archived office documents. Instead of retyping the content from scratch, a converter can move most of the text and structure into a Word document where you can make changes faster.',
            'A direct path is to use the <a href="pdf-to-word.html">PDF to Word converter</a>. That tool page is designed for quick editing workflows and helps users move from a finished PDF back into an editable DOCX format. It is one of the most practical file conversions for everyday office work.',
            'Before converting, consider the source quality. Clean digital PDFs usually convert better than blurry scans. If the original file includes complex tables, forms, signatures, or unusual fonts, review those sections carefully after export. The goal is to save time, but a quick check ensures the new document stays accurate.',
            'After conversion, update the content, fix any spacing issues, and resave the final version in the format you need. For many people, PDF to Word is less about file type theory and more about getting real work done faster.'
        ],
        'related':['word-to-pdf.html','docx-to-json.html','png-to-jpg.html']
    },
    {
        'tool_file':'word-to-pdf.html','tool_title':'Word to PDF Converter','guide_file':'how-to-convert-word-to-pdf.html','guide_title':'How to Convert Word to PDF',
        'description':'Turn Word documents into polished PDF files for sharing, printing, signing, and preserving layout.',
        'who':'business users, students, freelancers, and teams who need reliable document sharing',
        'steps':['Upload your DOC or DOCX file.','Convert the file to PDF.','Preview the layout and page breaks.','Download the finished PDF.'],
        'best':['Check margins and page breaks in Word before conversion.','Embed images and fonts correctly in the source file.','Use PDF when sending a finished version to others.'],
        'faq':[('Why save Word as PDF?','PDF keeps formatting more consistent across devices and is easier to share professionally.'),('Is PDF better for printing?','Usually yes, because print layout is preserved more reliably than editable office files.')],
        'guide_paras':[
            'Word documents are made for editing, collaboration, and revision. PDFs are made for sharing finished content. That is why Word to PDF conversion is one of the most important everyday file workflows. It lets you finalize a document and send it with confidence, knowing the recipient is less likely to see layout shifts or accidental edits.',
            'This matters for resumes, proposals, invoices, presentations, manuals, and school submissions. A DOCX file may look right on your machine but shift on someone else’s device if fonts or software versions differ. A PDF is usually the safer option for final delivery.',
            'The quickest way to do it is through the <a href="word-to-pdf.html">Word to PDF converter tool</a>. That page gives you a clean route from editable office document to a print-ready and shareable file format. It is especially useful for users who need a fast workflow without opening extra software.',
            'Before converting, review the original Word document. Check page breaks, margins, spacing, and image placement. Small cleanup in the DOCX can make the PDF look far more professional. If your document includes hyperlinks or forms, test those elements afterward to make sure they work as expected.',
            'Once the PDF is created, it is ready for email, upload portals, client delivery, or printing. For many users, this conversion is a final quality-control step that helps the document look polished and stay consistent.'
        ],
        'related':['pdf-to-word.html','png-to-jpg.html','mov-to-mp4.html']
    },
    {
        'tool_file':'png-to-jpg.html','tool_title':'PNG to JPG Converter','guide_file':'how-to-convert-png-to-jpg.html','guide_title':'How to Convert PNG to JPG',
        'description':'Convert PNG images into smaller JPG files for email, uploads, websites, and faster sharing.',
        'who':'website owners, ecommerce sellers, marketers, and everyday users managing image file size',
        'steps':['Upload your PNG image.','Choose JPG quality if available.','Convert the image.','Download the new JPG file.'],
        'best':['Use JPG when you want smaller file sizes for photos.','Keep PNG if you need transparency.','Review quality settings for website or email use.'],
        'faq':[('Why convert PNG to JPG?','JPG files are often smaller and easier to upload, email, or use on websites.'),('Will transparency stay?','No. PNG transparency is usually replaced when converting to JPG.')],
        'guide_paras':[
            'PNG and JPG are both common image formats, but they serve different purposes. PNG is great for transparency and crisp graphics. JPG is usually better for smaller file sizes, especially for photos and everyday sharing. That is why PNG to JPG conversion is such a common need for websites, email attachments, product uploads, and general image optimization.',
            'If you are sending images through forms, store systems, or email, file size matters. Large PNG files can slow pages down and create upload friction. Converting to JPG often solves that problem while keeping the image visually strong enough for most use cases.',
            'You can handle the workflow directly with the <a href="png-to-jpg.html">PNG to JPG tool page</a>. This is helpful when you want a quick browser-based solution and do not need to open design software just to change file format. For many users, it is the fastest way to prepare images for web use.',
            'Before converting, decide whether transparency matters. If the image needs a transparent background, stay with PNG. If the image is a photo, product shot, or banner without transparency needs, JPG is often the better choice because the file can be much smaller.',
            'After conversion, review the result and compare quality versus size. A balanced export gives you a faster-loading image without making it look overly compressed. That is the sweet spot for websites, listings, and email attachments.'
        ],
        'related':['jpg-to-png.html','pdf-to-word.html','mov-to-mp4.html']
    },
    {
        'tool_file':'jpg-to-png.html','tool_title':'JPG to PNG Converter','guide_file':'how-to-convert-jpg-to-png.html','guide_title':'How to Convert JPG to PNG',
        'description':'Convert JPG images into PNG files when you want cleaner edges, graphic-friendly output, or lossless saves.',
        'who':'designers, ecommerce teams, marketers, and users prepping graphics or repeated edits',
        'steps':['Upload your JPG file.','Convert the image to PNG.','Review clarity and edge detail.','Download the PNG file.'],
        'best':['Use PNG for graphics, screenshots, and logos.','Remember that JPG artifacts will not disappear completely after conversion.','Choose PNG when you want to avoid new lossy saves during later edits.'],
        'faq':[('Why convert JPG to PNG?','PNG is often better for screenshots, graphics, and workflows where you want lossless saving going forward.'),('Will the image become higher quality?','Converting formats does not restore lost detail, but it can make the file more suitable for future edits.')],
        'guide_paras':[
            'JPG is excellent for photos and smaller file sizes, but it is not always the best format for graphics, screenshots, or repeated editing. In those cases, PNG may be the better destination format. That is why JPG to PNG conversion remains useful even though it does not magically recover detail already lost in the JPG.',
            'The main advantage is workflow fit. Once an image is in PNG, you can continue using a lossless format for future saves. That is helpful for screenshots, UI graphics, simple illustrations, and product assets that may be edited many times. PNG also tends to preserve hard edges and text more cleanly in many scenarios.',
            'To do it quickly, open the <a href="jpg-to-png.html">JPG to PNG converter</a>. This page gives users a direct path without opening editing software just to change file format. It is useful when you need compatibility, cleaner output for graphics, or a safer format for future revisions.',
            'Before converting, think about the image purpose. If the source is a photograph for the web, JPG might still be the better final format. If the source is a screenshot, a product graphic, or an image that will be edited repeatedly, PNG is often worth using despite the larger file size.',
            'After export, compare the file size and appearance. That quick review helps you decide whether the PNG version is better for your actual use case instead of just changing formats for the sake of it.'
        ],
        'related':['png-to-jpg.html','word-to-pdf.html','csv-to-json.html']
    },
    {
        'tool_file':'mov-to-mp4.html','tool_title':'MOV to MP4 Converter','guide_file':'how-to-convert-mov-to-mp4.html','guide_title':'How to Convert MOV to MP4',
        'description':'Convert MOV videos into MP4 for better compatibility, easier sharing, and smoother uploads.',
        'who':'content creators, marketers, iPhone users, and anyone sharing video across platforms',
        'steps':['Upload your MOV file.','Convert to MP4.','Choose quality or compression options if available.','Download the MP4 video.'],
        'best':['Use MP4 for broad device and platform support.','Keep an eye on compression settings when file size matters.','Test playback after conversion if the video will be used for ads or uploads.'],
        'faq':[('Why convert MOV to MP4?','MP4 is one of the most widely supported video formats for websites, social media, and mobile devices.'),('Will the video still look good?','Yes, especially when you choose balanced export settings and avoid over-compression.')],
        'guide_paras':[
            'MOV files are common on Apple devices and in editing workflows, but MP4 is often the better final format for sharing. It is more universally supported, easier to upload, and usually the safer choice for websites, social platforms, ad systems, email transfers, and general playback across devices.',
            'That is why MOV to MP4 conversion is one of the most practical media tasks for creators and business users. A video may look great in MOV, but the moment you need to post it, send it, or load it into another system, MP4 usually becomes the preferred format.',
            'The easiest workflow is to use the <a href="mov-to-mp4.html">MOV to MP4 converter tool</a>. This tool page gives users a direct route to a more compatible video format without needing desktop editing software for every simple conversion job.',
            'Before converting, think about your goal. If you need the smallest possible upload size, use compression carefully. If you need quality for marketing, presentations, or product video, prioritize a balanced export. Not every MP4 needs to be aggressively compressed.',
            'After conversion, play the file and confirm the audio, resolution, and aspect ratio look right. A quick test ensures the MP4 is ready for publishing, customer sharing, or uploading to the platform you actually use.'
        ],
        'related':['png-to-jpg.html','word-to-pdf.html','pdf-to-word.html']
    }
]

base_head = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{meta}">
<style>{css}</style>
</head>
<body>
{nav}
'''

for p in pairs:
    tool_related = ''.join(f'<a href="{href}">{href.replace(".html", "").replace("-", " ").title()}</a>' for href in p['related'])
    guide_related = tool_related

    tool_body = f'''
<div class="container">
  <section class="hero">
    <div class="badge">Privacy-first converter</div>
    <h1>{p['tool_title']}</h1>
    <p>{p['description']}</p>
    <p class="small">Built for {p['who']}. Need instructions first? Read <a href="{p['guide_file']}">{p['guide_title']}</a>.</p>
    <div class="cta">
      <a class="btn primary" href="#tool">Use the tool</a>
      <a class="btn" href="{p['guide_file']}">Read the guide</a>
    </div>
  </section>

  <div class="grid">
    <main>
      <section class="card" id="tool">
        <h2>Use the {p['tool_title']}</h2>
        <p><strong>100% private:</strong> this page is designed for browser-based workflows whenever supported, helping keep your files under your control.</p>
        <div class="tool-box">
          <div class="input-row">
            <div class="fake-input"><strong>Input</strong><br>Drag and drop your file here, or paste content if this is a text-based conversion.</div>
            <div class="fake-output"><strong>Output</strong><br>Your converted file or structured result appears here, ready to copy or download.</div>
          </div>
          <div class="cta">
            <span class="btn primary">Convert Now</span>
            <span class="btn">Clear</span>
            <span class="btn">Download Result</span>
          </div>
        </div>
      </section>

      <section class="card">
        <h2>How it works</h2>
        <ol>{''.join(f'<li>{s}</li>' for s in p['steps'])}</ol>
      </section>

      <section class="card">
        <h2>Why use this converter</h2>
        <p>{p['description']} This page is designed to give visitors both a fast action path and enough context to understand the format change before they commit to it.</p>
        <p>That matters for SEO, usability, and trust. People landing on a converter page often want more than a button. They want to know what the format is for, why the conversion matters, and whether the result will work for uploads, imports, sharing, printing, or development.</p>
      </section>

      <section class="card">
        <h2>Best practices</h2>
        <ul>{''.join(f'<li>{b}</li>' for b in p['best'])}</ul>
      </section>

      <section class="card">
        <h2>Frequently asked questions</h2>
        {''.join(f'<p><strong>{q}</strong><br>{a}</p>' for q,a in p['faq'])}
      </section>
    </main>

    <aside>
      <section class="card related">
        <h3>Start here</h3>
        <a href="{p['guide_file']}">{p['guide_title']}</a>
        <a href="#tool">Jump to converter</a>
      </section>
      <section class="card related">
        <h3>Related tools</h3>
        {tool_related}
      </section>
    </aside>
  </div>
</div>
{footer}
</body></html>
'''
    Path(p['tool_file']).write_text(base_head.format(title=p['tool_title']+' | FileConverter.run', meta=p['description'], css=css, nav=nav_html)+tool_body, encoding='utf-8')

    guide_body = f'''
<div class="container">
  <section class="hero">
    <div class="badge">How-to guide</div>
    <h1>{p['guide_title']}</h1>
    <p>{p['description']}</p>
    <p class="small"><strong>Quick solution:</strong> go straight to the <a href="{p['tool_file']}">{p['tool_title']}</a> when you are ready to convert.</p>
    <div class="cta">
      <a class="btn primary" href="{p['tool_file']}">Open the tool</a>
      <a class="btn" href="#steps">Read step-by-step</a>
    </div>
  </section>

  <div class="grid">
    <main>
      <section class="card">
        <h2>What this conversion is for</h2>
        <p>{p['guide_paras'][0]}</p>
        <p>{p['guide_paras'][1]}</p>
      </section>

      <section class="card" id="steps">
        <h2>Step-by-step instructions</h2>
        <p>{p['guide_paras'][2]}</p>
        <ol>{''.join(f'<li>{s}</li>' for s in p['steps'])}</ol>
      </section>

      <section class="card">
        <h2>Before you convert</h2>
        <p>{p['guide_paras'][3]}</p>
      </section>

      <section class="card">
        <h2>After you convert</h2>
        <p>{p['guide_paras'][4]}</p>
      </section>

      <section class="card">
        <h2>Best practices</h2>
        <ul>{''.join(f'<li>{b}</li>' for b in p['best'])}</ul>
      </section>

      <section class="card">
        <h2>Use the tool now</h2>
        <p>Ready to do the conversion? Open the <a href="{p['tool_file']}">{p['tool_title']}</a> page to convert your file on FileConverter.run.</p>
        <div class="cta"><a class="btn primary" href="{p['tool_file']}">Go to {p['tool_title']}</a></div>
      </section>
    </main>

    <aside>
      <section class="card related">
        <h3>Tool link</h3>
        <a href="{p['tool_file']}">{p['tool_title']}</a>
      </section>
      <section class="card related">
        <h3>Related pages</h3>
        {guide_related}
      </section>
    </aside>
  </div>
</div>
{footer}
</body></html>
'''
    Path(p['guide_file']).write_text(base_head.format(title=p['guide_title']+' | FileConverter.run', meta=p['description'], css=css, nav=nav_html)+guide_body, encoding='utf-8')

Path('nav.html').write_text(nav_html, encoding='utf-8')
