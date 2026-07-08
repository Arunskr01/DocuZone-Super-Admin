# AgenticDocuZone — Full System Architecture & Context

This document is the **single source of truth** for the complete AgenticDocuZone ecosystem. It consolidates the architecture, file structures, workflows, UI components, backend APIs, internal mechanics, and extension guidelines for both the **Docuzone Web UI (AgenticCR)** and the **AgenticDocuZone Core Engine**.

---

## 1. System Overview

The AgenticDocuZone ecosystem consists of three main components that together form a complete, end-to-end automated document extraction pipeline and management platform:

| Component | Role |
|---|---|
| **Docuzone / AgenticCR** | Web-based configuration UI. Users define extraction fields, test against documents, and deploy configurations to local Hot Folders. |
| **AgenticDocuZone Engine** | The core extraction pipeline. Processes documents using OCR, LLMs, and deterministic Python scripts to produce structured Excel outputs. |
| **SuperAdmin System** | Sub-tool for managing Customers (tenants) and their Users. Provides administrative control over access and monitors API/model consumption data. |

### How They Connect

```
[Docuzone Web UI]
        │
        │  User configures fields & rules via browser
        ▼
  Saves to Database (Model Table) ◄────────────────► Database (Model/Prompt/Project ID)
        │                                                   ▲
        ▼                                                   │ Fetches Prompt & Project ID
  Deploys main.exe to Hot Folder ──► Triggers Engine ───────┘ based on config.dat's Model_ID
        │
        ▼
  User drops documents into /input/ ────────────────────────► Engine picks up & processes
                                                                      │
                                                                      ▼
                                                         OCR → LLM Extraction → Excel Output
```

The critical integration mechanisms are:

- **`config.dat`** — A configuration file containing the `Model_ID` (placed next to `main.py`/`CLI.py`/`main.exe`). The Engine reads this file to identify which model configuration is being executed.
- **Database Connection** — The Engine connects to the database on startup using settings from `.env`, queries the `Model` table with the `Model_ID` to retrieve the current extraction `Prompt` and `Project_ID`, and performs live status and extraction data insertions/updates.
- **`main.exe`** — The compiled AgenticDocuZone Engine. Docuzone copies it into the hot folder and triggers it via `subprocess.Popen`.
- **REST API (Alternative Entry Point)** — A standalone Flask web server (`run_api.py` on port `5001`) exposes endpoints allowing external clients to submit files directly. It processes documents asynchronously using a background thread pool, logs tracking records to the DB, saves raw JSON results locally, and avoids the hot-folder loop entirely.

### Shared Tech Stack

- **Backend (Docuzone):** Python (Flask), running on port `5000`
- **Frontend (Docuzone):** Vanilla HTML, CSS, JavaScript (SheetJS for Excel preview, Ionicons for icons)
- **Core Engine & REST API:** Python (Flask, PySide6 GUI, CLI entry points), Azure/ABBYY OCR, OpenAI / Ollama LLMs, MS SQL Server database connection (via `pyodbc`)
- **SuperAdmin System:** Python (FastAPI backend), React/TypeScript (Vite frontend), SQL Server
- **Extraction Scripts:** `Extractor.py`, `TestModel.py`, `main.exe`, `run_api.py`


---

## 2. Component 1 — Docuzone Web UI (AgenticCR)

### 2.1. Directory Structure

```text
d:\AgenticCR\
├── app.py                # Main Flask application
├── requirements.txt      # Python dependencies
├── main.exe              # Core extraction engine executable (deployed to hot folders)
├── .env                  # Environment variables
├── README.md             # Project documentation
├── Docuzone/             # Base directory structure copied to a target hot folder on instance creation
├── LabelExractor/        # Python scripts for testing/extraction (Extractor.py, TestModel.py)
│   └── Documents/        # Temporary storage for uploaded documents during testing
├── Extracted JSON/       # Output directory for JSON files from extraction scripts
├── Templates/            # Pre-defined JSON templates for extraction fields
└── static/               # Frontend assets served by Flask
    ├── index.html        # Main user interface
    ├── style.css         # UI styling (glassmorphism, dark/light themes)
    └── app.js            # Frontend logic and state management
```

---

### 2.2. Backend API Endpoints (`app.py`)

#### `GET /`
Serves `static/index.html`.

#### `POST /api/create-config`
- **Purpose:** Initializes a local Hot Folder environment for a specific AI model.
- **Payload:** `path`, `headers`, `tableFields`, `modelName`.
- **Action:** Creates subdirectories (`input`, `archive`, `output`, `config`, `logs`), copies the `Docuzone` directory, creates `config/UserPrompt.txt`, and copies `main.exe` to the target folder.

#### `POST /api/save-config`
- **Purpose:** Updates the extraction configuration (`UserPrompt.txt`) in an existing hot folder.
- **Payload:** `localConfigPath`, `headers`, `tableFields`, `rules`.
- **Action:** Overwrites `config/UserPrompt.txt` with updated headers, tables, and rules.

#### `POST /api/extract`
- **Purpose:** Runs `main.exe` in the specified hot folder.
- **Payload:** `localConfigPath`, `headers`, `tableFields`, `rules`.
- **Action:** Saves config, unblocks `main.exe` via PowerShell (`Unblock-File`), and launches it using `subprocess.Popen`. Streams stdout to `run.log` and tracks the process in `ACTIVE_PROCESSES`.

#### `GET /api/status`
- **Purpose:** Polls the status of the running `main.exe` process.
- **Query Param:** `path` (local hot folder path).
- **Returns:** Whether the process is still running and the contents of `run.log`.

#### `GET /api/templates`
- **Purpose:** Retrieves a list of available JSON templates.
- **Action:** Scans `Templates/` (built-in) and `Extracted JSON/` folders and returns filenames.

#### `GET /api/templates/<folder>/<filename>`
- **Purpose:** Serves a specific template file.

#### `POST /api/upload-extract`
- **Purpose:** Uploads a document and dynamically extracts data to create a template.
- **Payload:** `file`, `userPrompt` (optional).
- **Action:** Saves file to `LabelExractor/Documents/`, runs `Extractor.py` synchronously, returns output JSON.

#### `POST /api/test-model`
- **Purpose:** Tests the current field configuration against an uploaded document.
- **Payload:** `file`, `userPrompt` (combined rules and fields).
- **Action:** Saves file, runs `TestModel.py` synchronously, returns output JSON.

---

### 2.3. Frontend Architecture (`app.js` & `index.html`)

The frontend is a Single Page Application (SPA) managing projects, AI model instances, and extraction configurations.

#### State Management (`app.js`)

| State Property | Description |
|---|---|
| `state.projects` | Array of projects; each has an ID, name, and list of instances. |
| `state.currentProjectId` | ID of the currently active project. |
| `state.currentInstanceId` | ID of the currently active instance. |
| `state.instanceData` | Dictionary of per-instance data: headers, table columns, rules, dirty state, `localConfigPath`. |

#### UI Layout (`index.html`)

**Sidebar (`#sidebar`):**
- Lists all projects.
- "Create Project" button opens the Project Modal.
- Clicking a project expands it to show AI model instances and an "Add AI Model" button.

**Main Workspace (`#workspace`):**
- Top breadcrumbs showing `Project Name / Instance Name`.
- Action buttons: `Apply Template`, `Extract Document`, `Test Model`, `Publish`, `Run AI Model`.

**Left Panel — Document Viewer:**
- File upload area for PDFs, Images, or Excel files.
- Previews documents using `<iframe>` (PDF), `<img>` (images), or SheetJS (Excel).

**Right Panel — Fields Container:**
- **Config Mode (`#config-mode-view`):** Default view. Users add/remove Headers and Table Columns.
- **Validation Mode (`#validation-mode-view`):** Shown after extraction or testing. Displays extracted data with edit icons to add field-level Rules (e.g., "Extract as DD/MM/YYYY").

**Environment Connection Section:**
- Shows the status of the configured Hot Folder.
- Displays `/input`, `/archive`, `/output`, `/config/UserPrompt.txt`, `/logs`, and `main.exe` as status badges.

**Live Log Overlay (`#log-overlay-layer`):**
- Appears when "Run AI Model" is clicked.
- Polls `/api/status` every second to display real-time `run.log` contents until the process finishes.

---

### 2.4. Key User Flows

#### 1. Create Project / Create AI Model
- User creates a project, then creates an AI model inside it.
- Creating an AI model requires specifying an absolute path to a Target Hot Folder.
- On save, calls `/api/create-config` to set up the folder structure.

#### 2. Configure Fields (Config Mode)
- User manually adds Headers (Fields of Interest - FOI) and Table Columns.
- Modifying fields marks the instance as "Dirty", surfacing the "Publish" button.

#### 3. Apply Template
- User opens the `Apply Template` modal, selects a JSON template.
- Frontend fetches the JSON, parses it, and auto-populates Headers and Table columns.

#### 4. Extract Document (Dynamic Extraction)
- User uploads a document and clicks `Extract Document`.
- Calls `/api/upload-extract`. Backend runs `Extractor.py` to auto-discover fields.
- UI switches to **Validation Mode**, showing discovered fields and extracted values.

#### 5. Test Model
- User configures fields, uploads a document, clicks `Test Model`.
- Calls `/api/test-model`, passing current fields and rules as prompts.
- Backend runs `TestModel.py`. UI switches to **Validation Mode** with results.

#### 6. Validation Mode Mechanics
- Users review extracted values.
- Clicking the edit (pencil) icon on any field opens an input for a specific **Rule**.
- Rules are saved in `state.instanceData[id].foiRules` and `tableRules`.
- "Validate Again" / "Test Again" re-runs extraction with the newly added rules.
- "Done" returns to Config Mode.

#### 7. Publishing Changes
- When fields or rules change, the `Publish` button appears.
- Clicking `Publish` calls `/api/save-config` to write `UserPrompt.txt`. State becomes "Clean".

#### 8. Run AI Model
- Clicking `Run AI Model` with unpublished changes triggers a warning modal ("Publish & Run" or "Run Anyway").
- A "Pre-Flight Prompt" modal allows final review of the generated prompt.
- Calls `/api/extract` to launch `main.exe` in the background.
- The Live Log Overlay opens and polls `/api/status` every second until the process finishes.

---

## 3. Component 2 — AgenticDocuZone Core Engine

### 3.1. The 3-Layer Architecture

| Layer | Location | Role |
|---|---|---|
| **Layer 1: Directive** | `directives/` | Markdown SOPs defining goals, inputs, tools, outputs, and edge cases in natural language. |
| **Layer 2: Orchestration** | AI Agent | Reads directives, calls execution tools in sequence, handles errors, updates directives with learnings. |
| **Layer 3: Execution** | `src/`, `scripts/` | Deterministic Python scripts performing actual business logic (API calls, data processing, file I/O). |

---

### 3.2. Directory Structure

```text
d:\CodeBase\AgenticDocuZone\
├── main.py                       # Entry point for PySide6 GUI
├── CLI.py                        # Entry point for CLI
├── run_api.py                    # Entry point for Flask REST API server
├── config.dat                    # File containing Model_ID used for DB query
├── README.md                     # Setup and overview
├── requirements.txt              # Python dependencies
├── .env                          # Secrets, API Keys, and DB connection details (not committed)
│
├── directives/                   # Layer 1 (SOPs)
│   ├── AGENT.md                  # Agent operating principles and 3-layer architecture definition
│   └── skills/                   # Modular agent capabilities
│
├── scripts/                      # Runnable scripts for testing
│   ├── Tester.py
│   └── AllExtractor.py
│
├── src/                          # Layer 3 (Execution / Deterministic Logic)
│   ├── __init__.py
│   ├── ABBYY.py                  # Alternative OCR using ABBYY Cloud SDK (supports English, Arabic) to Excel
│   ├── detect_file_type.py       # Detects file extension (pdf, image, excel)
│   ├── detect_pdf_type.py        # Detects if PDF is "scanned" or "digital"
│   ├── pdf_to_images.py          # Converts scanned PDFs to high-resolution (300 DPI) images for best OCR quality
│   ├── extract_text_azure.py     # Extracts text from images via Azure OCR to Excel
│   ├── visualize_text.py         # Plots OCR bounding boxes onto a high-res PDF canvas
│   ├── merge_pdfs.py             # Merges single-page plotted PDFs into a multi-page PDF
│   ├── extract_pdf_data.py       # Main extraction wrapper using OpenAI for PDFs (returns parsed JSON dict)
│   ├── extract_pdf_data_ollama.py# Main extraction wrapper using Ollama for PDFs (returns parsed JSON dict)
│   ├── excel_reader.py           # Reads Excel inputs into a text string
│   ├── gpt_extractor.py          # Prompts LLM with text & UserPrompt to get structured JSON
│   ├── json_to_excel.py          # Converts extracted JSON to final Excel output
│   ├── api/                      # REST API Blueprint and Worker implementation
│   │   ├── __init__.py
│   │   ├── api_server.py         # Flask job routes (submit, status, result)
│   │   └── worker.py             # Background thread pipeline execution
│   └── utils/
│       ├── logger.py             # System logger and CSV/GUI logging handlers
│       ├── file_manager.py       # Cache, input, output, and archive directory management
│       └── db_operations.py      # Database functions for all inserts, updates, fetches, and read queries
│
└── Base Folders (Auto-created at runtime)
    ├── input/                    # Drop raw documents here
    ├── output/                   # Final extracted Excel files and REST API json results saved here
    ├── archive/                  # Successfully processed originals moved here
    ├── logs/                     # Execution logs in CSV format
    └── Cache/                    # Temporary: pdf_folder, plotted_folder, images_folder,
                                  #            json_output_folder, excel_output_folder
```


### 3.3. Execution Workflow (Step-by-Step)

#### Step 1: Initialization & Environment Setup
- Loads environment variables from `.env` (including database connection configuration).
- Reads the `Model_ID` from the `config.dat` file located in the application directory.
- Connects to the database using `get_db_connection` (via `pyodbc`).
- Fetches the extraction `Prompt` (`get_model_prompt`) and `Project_ID` (`get_project_id`) from the database based on the `Model_ID`.
- Inserts a record into `Execution_Master` table with status `"Running"` using the fetched `Project_ID`, `Model_ID`, and local host name (`socket.gethostname()`) as `Triggered_By` and `Created_By`. This returns `execution_id`.
- Detects the base directory and sets up the folders (`input`, `output`, `archive`, `logs`) via `setup_base_folders`.
- Generates dynamic temporary cache folders using `get_cache_folders` and `create_cache_folders`.

#### Step 2: Input Ingestion Loop
- Iterates over all files in `input/` via `get_input_files`.
- For each file:
  - Deletes and recreates the cache folders to ensure a clean slate.
  - Derives the document's MIME type and computes the file size (KB) and page count.
  - Inserts a record for the document in the `Document_Table` with status `"Processing"` and audited fields (using the `execution_id` and hostname). This returns `doc_id`.
  - Logs the start of processing via the CSV logger and the PySide6 UI signals.

#### Step 3: File Type Detection & Routing
- Inserts an `Execution_Audit` record with `Stage="File_Detection"` and `Stage_Status="Started"`.
- Runs `get_file_type` to determine if the file is a PDF/image or Excel file, then updates the `Execution_Audit` stage to `"Completed"`.

**Branch A — PDF or Image Processing:**
1. `detect_pdf_type` determines if the PDF is `"scanned"` or `"digital"`.
2. **If Scanned (or Image):**
   - Inserts `Execution_Audit` stage `"OCR_Processing"` with status `"Started"`.
   - Converts PDF/image pages to individual images via `convert_pdf_to_images`.
   - For each image page, runs OCR (`extract_text_to_excel`) and bounding box visualization (`visualize_text_high_res`).
   - Merges the plotted pages back into a single digital-like PDF via `merge_pdfs`.
   - Updates `Execution_Audit` stage `"OCR_Processing"` to `"Completed"`.
3. **If Digital:**
   - Bypasses the OCR and visualization pipeline entirely.
4. **Data Extraction (both paths converge here):**
   - Inserts `Execution_Audit` stage `"LLM_Extraction"` with status `"Started"`.
   - Text + base64 page images are sent to the LLM (`extract_pdf_data_main`) along with the `Prompt` retrieved from the database to obtain a structured JSON dictionary.
   - Updates `Execution_Audit` stage `"LLM_Extraction"` to `"Completed"`.

**Branch B — Excel Processing:**
- Inserts `Execution_Audit` stage `"LLM_Extraction"` with status `"Started"`.
- Uses `read_excel_to_text` to extract raw string data from the Excel sheets.
- Passes the text and retrieved `Prompt` to `extract_gpt_data` to obtain the structured JSON dictionary.
- Updates `Execution_Audit` stage `"LLM_Extraction"` to `"Completed"`.

#### Step 4: Output Generation & Database Write
- Takes the structured JSON from the LLM and uses `convert_json_to_excel` to generate the final Excel file in `output/`.
- **Database Output Storage:**
  - **Headers (`Header_Data_Output`):** Inserts extracted key-value header fields into the database. To prevent duplicate rows for multi-page documents, header fields are extracted from the **first page only** and inserted **once per document** with `Page_Number = 1`.
  - **Table Data (`Table_Data_Output`):** Inserts extracted tabular cells row by row, cell by cell, specifying the correct page index and row index for each cell value.
- Updates the document's record in `Document_Table` to `"Completed"` (or `"Failed"` on error, logging the traceback to `Execution_Audit` stage `"LLM_Extraction"` as `"Failed"`).

#### Step 5: Cleanup & Archival
- Moves the original file from `input/` to `archive/` via `move_to_archive`.
- Deletes cache folders via `delete_cache_folder`.
- Logs success to the CSV logger.

---

### 3.4. Internal Modules Reference (`src/`)

#### Main Applications

| Module | Description |
|---|---|
| `main.py` | PySide6 GUI. Runs execution in a `WorkerThread`, communicates via Signals (`log_signal`, `status_signal`, `progress_signal`, `finished_signal`). Uses `SignalLogHandler` to pipe Python logging to the frontend. |
| `CLI.py` | Executes the identical processing loop synchronously in the console. |
| `run_api.py` | Standalone runner to start the Flask REST API server on port `5001`. |

#### Layer 3 Execution Scripts

| Module | Key Functions |
|---|---|
| `src.detect_file_type` | `get_file_type(file_path)` → `"pdf"`, `"excel"`, `"image"`, or `"unknown"` |
| `src.detect_pdf_type` | `detect_pdf_type(pdf_path)` → `"scanned"` or `"digital"` |
| `src.pdf_to_images` | `convert_pdf_to_images(pdf_path, output_folder)` → saves pages as high-resolution (300 DPI) `.png` to cache |
| `src.extract_text_azure` | `extract_text_to_excel(image_path, output_excel_path, page_number)` → Azure OCR with bounding box coordinates saved to intermediate Excel |
| `src.ABBYY` | `extract_text_to_excel(image_path, output_excel_path, page_number)` → ABBYY Cloud OCR (English, Arabic) with bounding box coordinates saved to intermediate Excel |
| `src.visualize_text` | `visualize_text_high_res(excel_path, output_pdf_path)` → Plots OCR-detected text onto blank high-res PDF canvas. Includes `_load_font_chain()`, `_select_font()`, `_bidi_reorder()` helpers. |
| `src.merge_pdfs` | `merge_pdfs(input_folder, output_folder, input_file_name)` → Merges per-page plotted PDFs into one combined PDF |
| `src.extract_pdf_data` | `extract_text_from_pdf(pdf_path)`, `extract_data_with_openai(pdf_text, user_prompt, page_images)`, `_get_page_images_base64(pdf_path)`, `main(pdf_path, output_folder, ...)` |
| `src.extract_pdf_data_ollama` | Same interface as above, but routes LLM calls to Ollama instead of OpenAI |
| `src.excel_reader` | `read_excel_to_text(file_path)` → Reads all sheets and returns data as a formatted text string |
| `src.gpt_extractor` | `extract_data(excel_text, user_prompt)` → Standard OpenAI API call, returns structured dict |
| `src.json_to_excel` | `convert_json_to_excel(json_data, original_filename, output_path)` → Normalizes nested JSON, writes formatted Excel deliverable |
| `src.api.api_server` | Flask Blueprint routes for async jobs (`POST /api/v1/jobs`, `GET /api/v1/jobs/<id>`, `GET /api/v1/jobs/<id>/result`). |
| `src.api.worker` | `process_pdf_job()` background worker doing pipeline execution and OCR generation. |

#### Helper Utilities (`src/utils/`)

| Module | Key Functions |
|---|---|
| `src.utils.logger` | `SignalLogHandler` (bridges background thread logs to PySide6 UI), `get_logger(name)`, `log_to_csv(BASE_DIR, start_time, file_name, log_type, status, remarks)` |
| `src.utils.file_manager` | `setup_base_folders(base_dir)`, `get_cache_folders(base_dir)`, `create_cache_folders(base_dir)`, `delete_cache_folder(base_dir)`, `get_input_files(input_dir)`, `move_to_archive(file_path, archive_dir)` |
| `src.utils.db_operations` | `get_db_connection(server, database, username, password)`, `get_model_prompt(conn, model_id)`, `get_project_id(conn, model_id)`, `Insert_Execution_Master(...)`, `Update_Execution_Master(...)`, `Insert_Document_Table(...)`, `Update_Document_Table(...)`, `Insert_Execution_Audit(...)`, `Insert_Header_Data_Output(...)`, `Insert_Table_Data_Output(...)`, `Get_Execution_Status(...)`, `Get_Execution_Audits(...)`, `Get_Document_Status(...)` |


---

## 4. Component 3 — Super Admin System

The **Super Admin System** is a sub-tool within the AgenticDocuZone ecosystem designed as a centralized control panel for administrative management.

### 4.1. Directory Structure

```text
SuperAdmin/
├── backend/                   # FastAPI backend application
│   ├── database.py            # SQL Server database connection
│   ├── main.py                # API endpoints and logic
│   └── schemas.py             # Pydantic validation schemas
└── frontend/                  # React Vite frontend application
    ├── src/
    │   ├── api.ts             # API client functions
    │   └── pages/             # React views (CustomerList, CustomerDetails, etc.)
```

### 4.2. Key Features

- **Authentication & Role-Based Access:** Secures login differentiating between System Admins (overall managers) and Customer Admins (restricted to specific tenant).
- **Customer Management:** End-to-end CRUD capabilities for managing client organizations (tenants).
- **User Management:** Associate and manage users securely under specific customers.
- **Billing & Consumption Dashboard:** Monitors and visualizes document extraction usage, tallying total documents and pages processed by the Core Engine via interactive charts.

---

## 5. Internal Mechanics & Design Decisions

### Database-Driven Prompts & Config
The Engine no longer relies on a static `config/UserPrompt.txt` file inside the local directory. Instead, config/prompt management is centralized:
1. The engine reads `Model_ID` from a local file named `config.dat`.
2. It establishes a database connection on start.
3. It fetches the extraction prompt from the `Model` table via `get_model_prompt` and gets the `Project_ID` via `get_project_id`. This allows real-time prompt updating from the web UI without needing to rewrite configuration files to local disk hot folders.

### Audit Trails & Database Execution Logging
During execution, five database tables are updated in real-time to log execution details and outputs:
- **`Execution_Master`**: Created on execution start (state `"Running"`) and updated on completion (state `"Completed"`, `"Failed"`, or `"Partial"`).
- **`Document_Table`**: Tracks details of each document processed (status `"Processing"`, `"Completed"`, or `"Failed"`, along with MIME type, size in KB, and page count).
- **`Execution_Audit`**: Audits execution stages in real-time (`File_Detection`, `OCR_Processing`, `LLM_Extraction`) with start and end timestamps, status (`Started`, `Completed`, or `Failed`), and remarks.
- **`Header_Data_Output`**: Stores extracted key-value fields.
- **`Table_Data_Output`**: Stores extracted table cells per row, page, and column name.

### Connection Lifetime Management
To prevent connection overhead in single-user modes, a single connection is established at the beginning of the `CLI.py` run or `main.py` worker thread run.
For multi-threaded environments (like the REST API), connections are established on a **per-job basis** to maintain thread safety. In all execution paths, the active database connection is safely closed inside a `finally` block to prevent leaks.

### Hostname-Based Auditing
Audit columns such as `Triggered_By`, `Created_By`, and `Updated_By` are populated dynamically using the computer's hostname fetched via `socket.gethostname()`. This provides a reliable trail identifying which client machine executed the extraction runner.

### Isolated Cache Sandboxing (REST API)
To prevent race conditions during concurrent API requests, the API server dynamically sandboxes each job's temporary workspace in `Cache_<execution_id>/` (e.g. `Cache_20117/Cache/Images`). All intermediate files are isolated and completely deleted inside a `finally` block at job completion or failure.

### REST API JSON Persistence
To solve local scalability constraints, the API stores the raw extracted JSON payload directly in the database under the `Json_Output` column (defined as `nvarchar(max)`) in `Document_Table` during execution. The `GET /api/v1/jobs/<id>/result` endpoint retrieves and returns this string. As a secondary fallback/debug option, a copy of the JSON payload is also saved locally under `output/<execution_id>.json` on disk. If a job fails, the API scans the last `Execution_Audit` stage log to find and return the failure traceback message.



### Header Data Deduplication Design
Because a document may span multiple pages, the LLM extraction returns an array of per-page extractions (`Pages`). However, header fields (like Invoice Number, PO Number, Order Date) are document-level metadata. 
- **Design decision**: To avoid duplicate entries in the database, the Engine extracts header values from the **first page only** of the document and performs a **single insert** into `Header_Data_Output` per field with `Page_Number = 1`. 
- Tabular row data is still processed page by page, and cell values are inserted into `Table_Data_Output` with their respective `Page_Number` indices.

### Security Bypass
`app.py` uses PowerShell's `Unblock-File` command before executing `main.exe` to prevent Windows Defender / Mark-of-the-Web (MotW) execution blocks on downloaded binaries.

### Async Execution & Real-Time Logs
`main.exe` is launched using `subprocess.Popen` without blocking Flask. Real-time logs are achieved by:
1. Flushing unbuffered Python output from the process into `run.log`.
2. A separate `/api/status` polling endpoint reads `run.log` and returns its content.
3. The frontend polls this endpoint every second and updates the Live Log Overlay.

### PDF Processing Design
Scanned PDFs go through a full OCR → Visualization → Merge pipeline before extraction. This "re-renders" the scanned document as a digital PDF, allowing the downstream LLM to work with clean, positioned text rather than raw image blobs.

---

## 6. How to Extend This Project

Follow these principles based on the **Layer 1 Directives**:

1. **Core Business Logic goes to `src/`** — Do not add heavy deterministic logic inside `CLI.py` or `main.py`. Build a module in `src/` and import it.
2. **LLM usage must be separate** — LLMs handle routing or structured extraction. File parsing, manipulation, and I/O remain deterministic Python.
3. **Respect the Cache** — All intermediary steps (OCR images, temp JSON, plotted PDFs) must occur inside `create_cache_folders` and will be deleted by `delete_cache_folder`. For persistence, save to `output/` or database output tables.
4. **Update Directives** — If a core behavior changes or an architectural adjustment is needed, update `directives/AGENT.md` or the related skills documentation.
5. **New Database Functions** — Database utility functions belong in `src/utils/db_operations.py`. If a schema change or a new query is required, add a helper function there and export it through `src/utils/__init__.py` and `src/__init__.py`.
6. **New Field Types** — If adding a new extraction field type beyond Headers and Table Columns, update both the database storage logic in the engine (`main.py` / `CLI.py`) and the Web UI schema parsing logic.

