# AgenticDocuZone REST API — Developer User Manual

This guide outlines how to integrate with the AgenticDocuZone Engine via its REST API to programmatically submit documents, track their processing status, and retrieve the final extracted JSON data.

## Base URL
By default, the REST API runs on port `5001`.
```text
http://localhost:5001
```

## Authentication
All API endpoints require authentication via an API Key. 
- You must pass your API Key in the **`Authorization`** HTTP header.
- The API Key must have active permissions and scope access for the specific `model_id` being queried.

---

## 1. Submit Document (Start Job)
Submit a PDF or Excel document to the core extraction engine.

- **Endpoint**: `POST /api/v1/jobs`
- **Content-Type**: `multipart/form-data`

### Required Headers
| Header | Description |
|---|---|
| `Authorization` | **Mandatory**. Your API Key (e.g., `dz-your-api-key`). |
| `dz-user` | **Mandatory**. Identifier for the human user or system triggering the job. This is logged to the database for auditing purposes. |

### Form Parameters
| Field | Type | Description |
|---|---|---|
| `file` | File | The document to be extracted (must be `.pdf` or `.xlsx`). |
| `model_id` | Integer | The target Model ID configuration containing the desired prompt and rules. |

### cURL Example
```bash
curl -X POST http://localhost:5001/api/v1/jobs \
  -H "Authorization: dz-your-api-key-here" \
  -H "dz-user: john_doe" \
  -F "file=@/path/to/invoice.pdf" \
  -F "model_id=3008"
```

### Success Response (202 Accepted)
```json
{
  "execution_id": 12345,
  "doc_id": 9876,
  "status": "Processing"
}
```

---

## 2. Check Job Status
Poll this endpoint to monitor the progress of a submitted extraction job.

- **Endpoint**: `GET /api/v1/jobs/<execution_id>`

### Required Headers
| Header | Description |
|---|---|
| `Authorization` | **Mandatory**. Your API Key. |

### cURL Example
```bash
curl -X GET http://localhost:5001/api/v1/jobs/12345 \
  -H "Authorization: dz-your-api-key-here"
```

### Success Response (200 OK)
Returns the current `status` (`Running`, `Completed`, `Failed`, or `Partial`), timestamps, document status, and real-time audit logs of the pipeline stages (File Detection, OCR, LLM Extraction).

---

## 3. Retrieve Job Result
Once a job's status is `Completed`, use this endpoint to retrieve the final structured JSON payload containing the extracted Headers and Tables.

- **Endpoint**: `GET /api/v1/jobs/<execution_id>/result`

### Required Headers
| Header | Description |
|---|---|
| `Authorization` | **Mandatory**. Your API Key. |

### cURL Example
```bash
curl -X GET http://localhost:5001/api/v1/jobs/12345/result \
  -H "Authorization: dz-your-api-key-here"
```

### Expected Responses
- **If Completed (200 OK)**: Returns the complete nested JSON structure of the extracted data.
- **If Still Processing (202 Accepted)**: Returns a message indicating the job is still running.
- **If Failed (500 Internal Server Error)**: Returns the failure traceback/remark from the failed stage.
