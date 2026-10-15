# Toolifybox

A browser-only document toolkit built with **Nuxt 4 and Vue 3**, ready for Netlify static hosting. It includes Word to PDF, PDF to Word, PDF to Images, and Images to PDF tools. There is no Python backend, API, database, serverless function, or external conversion service.

The animated interface includes a conversion direction switch, drag-and-drop upload, document validation, page-by-page feedback, cancellation, and named downloads. The motion toggle and device reduced-motion preference control animations.

## Run locally

Use Node.js 22 LTS (22.19+) or 24 LTS (24.11+) and run:

```powershell
npm.cmd install
npm.cmd start
```

Open **http://127.0.0.1:5174** for the landing page or **http://127.0.0.1:5174/tools** for the tool catalog. Double-clicking `start.bat` also starts the website. Keep the terminal open and press Ctrl+C to stop it. On macOS/Linux, use `npm` instead of `npm.cmd`.

## Deploy to Netlify

The included `netlify.toml` sets:

- Build command: `npm run build`
- Publish directory: `.output/public`
- Node.js version: `22`
- Single-page URL fallback and static asset cache headers

Push the project to your Git repository, import that repository into Netlify, and deploy. No environment variables, Python installation, or backend hosting are required.

The build creates `sitemap.xml` and `robots.txt` automatically. Netlify supplies the production `URL`; for a custom domain or another host, set `SITE_URL` to the canonical origin, for example `https://www.example.com`.

For a manual deployment, run:

```powershell
npm.cmd run build
```

Upload the **`.output/public` folder** using Netlify's manual deploy interface. Upload the built folder, not the project source folder.

## How conversion works

### PDF to Word

Select **PDF to Word**, choose a PDF up to 20 MB and 100 pages, choose the output mode, and download the `.docx`:

- **Editable text** (default): reconstructs selectable text as positioned Word paragraphs with font sizes, bold/italic styling, and PDF fill colors. The original graphics are rendered behind the text without duplicating it. Page dimensions and mixed orientations are retained. Fonts are mapped to common Word fonts; spacing and font appearance can differ. Tables are positioned text and graphics, not native editable Word tables. Text may be split into small positioned blocks.
- **OCR for scans**: pages without safely reconstructable text are recognized locally with Tesseract.js. Choose Hindi + English or English. Recognized words become real Word text; their approximate colors and positions are retained. Word regions are replaced with sampled background colors so scan text is not duplicated behind the editable text. Backgrounds, fonts, and layout can change, especially on photos, skewed scans, handwriting, and complex pages. OCR can misread characters; proofread the output. OCR supports up to 30 pages per conversion and loads only when needed.
- **Page images** (optional, explicitly not editable): renders each page as a high-resolution, lossless PNG in Word. Keeps visible colors, images, charts, tables, scans, and page layout. Choose this only when you want pictures of the pages.
- Pages where OCR finds no text remain images in a mixed document and are reported in the result. If the entire PDF produces no readable text, editable mode reports an error instead of presenting an image-only Word document as editable. Ordinary graphic clipping no longer forces a whole text page into image mode.
- Password-protected PDFs and dynamic XFA forms require an unlocked/flattened PDF first. Word supports page sizes from 1 to 22 inches here. Very large rendered outputs (over 100 MB of page images) are rejected to protect browser memory. PDF attachments, scripts, links, and accessibility tags are not carried into Word.

PDF parsing/rendering uses [Mozilla PDF.js](https://mozilla.github.io/pdf.js/); `.docx` creation uses [docx](https://github.com/dolanmiu/docx), and OCR uses [Tesseract.js](https://github.com/naptha/tesseract.js). The PDF and OCR workers, character maps, fonts, color profiles, image decoders, WASM cores, and compressed English/Hindi models are served from the same static website. `modules/pdf-assets.ts` copies versioned assets from installed packages during Nuxt startup/build; keep the full generated `.output/public` folder when deploying. Documents never leave the browser. OCR resources add to the static deployment size but are downloaded by the browser only if OCR is needed.

### Word to PDF

The application lazy-loads `docx-preview`, `html2canvas`, and `jsPDF` when conversion starts. It renders the document in an isolated browser frame, captures its pages, and creates a PDF locally. Documents are never uploaded. The website and JavaScript assets must load first; no offline installation or service worker is included.

- One `.docx` document at a time, up to 20 MB and 100 output pages. Older `.doc` and password-protected documents are not supported.
- Basic text, tables, and images are supported. Word fonts, complex layouts, pagination, and headers/footers may differ. Check the PDF before sharing.
- **PDF pages are images. Text is not selectable or searchable**, and accessibility information and hyperlinks are not preserved.
- Large documents can take time, especially on phones. Conversion processes one page at a time and rejects oversized expanded archives.
- Missing page settings use A4 dimensions. Portrait and landscape sections keep their own dimensions; headers and footers repeat on overflow pages.
- Conversion stages have time limits and the Cancel conversion button stops waiting immediately. Failed or unreadable images report an error, and pages with text are checked for blank rendering before download.
- The output keeps the source document's name. Conversion frames are removed after success or failure, and download URLs are released when another document is chosen or the page closes.
- Google Fonts is optional for the website's design; system fonts are the fallback. Document rendering does not load external resources.

### Images to PDF

Open `/tools/images-to-pdf` and add up to 50 JPG, PNG, or WebP images. Every image has a clear preview and becomes one PDF page. Drag the preview cards or use the Earlier and Later controls to change page order; images can also be rotated or removed before conversion.

- A4, US Letter, and image-matched page sizes are available, with fit/fill placement and adjustable margins.
- Maximum quality keeps up to 30 megapixels per image, preserves PNG images losslessly, and encodes photos at 98% JPEG quality. Balanced mode creates a smaller file.
- Image files can be up to 20 MB each and 100 MB combined. Conversion happens entirely in the browser, and no image data is uploaded.

## Build and verify

```powershell
npm.cmd run build
npm.cmd run check:pages
npm.cmd run test:assets
npm.cmd run test:upload
npm.cmd run preview
```

The build command runs `nuxt generate`, which pre-renders the page and writes static files to `.output/public`. `npm.cmd run preview` serves that folder at **http://127.0.0.1:4173**. Nuxt SSR runs during generation; no application server is needed after deployment. Check a real document's conversion and PDF download before deploying.

With the preview running, you can also run the automated browser checks:

```powershell
$env:TOOLIFYBOX_TEST_URL = "http://127.0.0.1:4173"
npm.cmd run test:browser
```

The browser checks use an installed Chrome, Chromium, or Edge. Set `TOOLIFYBOX_BROWSER` to its executable path if it is not detected. They generate real image, DOCX, and PDF fixtures and verify image reordering, a three-page Images to PDF result, selected PDF page downloads, editable Word output, text and color runs, English/Hindi OCR, blank-page errors, mixed orientations, mobile layout, cancellation, cleanup after errors, and that no document data is uploaded.

For the PDF converter's development imports, keep `npm.cmd start` running and test the dev server directly:

```powershell
$env:TOOLIFYBOX_TEST_URL = "http://localhost:5174"
$env:TOOLIFYBOX_TEST_PDF_ONLY = "1"
npm.cmd run test:browser
```

PDF.js uses its browser ESM entry directly and is excluded from Vite dependency pre-bundling. The converter libraries are explicitly included so they are prepared at startup rather than triggering a dependency re-bundle during a first conversion. After changing dependencies or Vite configuration, restart the dev server and refresh the browser tab to replace old module URLs.

## Files

```text
app/app.vue                         Nuxt application entry
app/pages/index.vue                 Animated landing page and tools preview
app/pages/tools/index.vue           Tool catalog
app/pages/tools/images-to-pdf.vue   Images to PDF page
app/components/DocumentConverter.vue Upload and both conversion workflows
app/components/ImagesToPdfConverter.vue Image preview, ordering, and conversion UI
app/components/BrandLogo.vue        Shared brand component
app/components/FileBadge.vue        Document illustration
app/utils/convert-document.js       Browser PDF generation
app/utils/convert-pdf.js            Browser PDF-to-Word generation
app/utils/images-pdf.js             High-quality Images to PDF generation
app/utils/pdf-text.js               PDF glyph matching and text colors
app/utils/pdf-ocr.js                Browser OCR lifecycle and recognized text
app/utils/pdf-pixels.js             OCR word colors and background sampling
app/utils/docx-package.js           DOCX validation and pagination
app/utils/conversion-task.js        Timeouts and cancellation
app/utils/document.js               File validation and download helpers
app/assets/css/styles.css          Responsive styles and animations
nuxt.config.ts                     Nuxt metadata and static generation
modules/pdf-assets.ts              Bundles local PDF fonts/maps/decoders
netlify.toml                       Netlify deployment settings
scripts/                           Verification and static preview helpers
start.bat                          Windows launcher
```

## Dependency audit

The current dependency audit reports upstream advisories in Nuxt's build/development dependency chains, including `braces` and `node-forge`. These Node packages are not deployed with the generated static site. Run `npm audit` to inspect the current report and update compatible tooling as upstream fixes become available. Nuxt is pinned to 4.5.2 to match the Node.js version currently installed on this computer.
#   t o o l i f y b o x  
 
