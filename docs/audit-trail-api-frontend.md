# Audit Trail API Documentation for Frontend Developers

## Base URL
```
https://api.urogy.in
```

## Authentication
No authentication required for audit endpoints.

## Endpoints

### 1. Create Audit Record
**POST** `/audit-records`

Creates a new audit record for tracking questionnaire completion.

**Request Body:**
```json
{
  "key": "ABC12345",
  "timestamp": "2024-01-15T14:30:00",
  "path": [
    {
      "node": {
        "id": "start",
        "text": "Welcome to the questionnaire"
      },
      "selectedOptionIndex": 0
    },
    {
      "node": {
        "id": "symptoms",
        "text": "Do you experience urinary symptoms?",
        "options": [
          {
            "text": "Yes, frequently",
            "nextNode": "severity"
          },
          {
            "text": "Occasionally",
            "nextNode": "lifestyle"
          }
        ]
      },
      "selectedOptionIndex": 0
    }
  ],
  "finalRecommendation": "APP",
  "quid6Result": {
    "totalScore": 15,
    "stressScore": 5,
    "urgeScore": 5,
    "overallIncontinenceImpact": 5,
    "interpretation": "Mild symptoms detected"
  }
}
```

**Field Descriptions:**
- `key` (string, required): 8-character alphanumeric identifier (auto-converted to uppercase)
- `timestamp` (string, required): ISO 8601 timestamp when questionnaire was completed
- `path` (array, required): Array of questionnaire steps taken by user
  - `node.id` (string): Unique identifier for the question/step
  - `node.text` (string): The question or content shown to user
  - `node.options` (array, optional): Available answer choices
  - `selectedOptionIndex` (number, optional): Index of option user selected
- `finalRecommendation` (string, required): Must be one of: "APP", "Surgeon", "PT"
- `quid6Result` (object, optional): QUID-6 questionnaire results if applicable
  - `totalScore` (number): Total QUID-6 score (0-21)
  - `stressScore` (number): Stress incontinence score (0-9)  
  - `urgeScore` (number): Urge incontinence score (0-9)
  - `overallIncontinenceImpact` (number): Impact score (0-3)
  - `interpretation` (string): Human-readable interpretation

**Success Response (201):**
```json
{
  "message": "Audit record created successfully",
  "data": {
    "key": "ABC12345"
  }
}
```

**Error Responses:**
```json
// 400 - Key already exists
{
  "message": "Audit key already exists",
  "status": false
}

// 422 - Validation error
{
  "detail": [
    {
      "loc": ["body", "key"],
      "msg": "ensure this value has at least 8 characters",
      "type": "value_error.any_str.min_length"
    }
  ]
}
```

---

### 2. Get Audit Record
**GET** `/audit-records/{key}`

Retrieves a specific audit record by its key.

**Path Parameters:**
- `key` (string): The 8-character audit record key

**Success Response (200):**
```json
{
  "message": "Audit record retrieved successfully",
  "data": {
    "key": "ABC12345",
    "timestamp": "2024-01-15T14:30:00",
    "path": [
      {
        "node": {
          "id": "start",
          "text": "Welcome to the questionnaire"
        },
        "selectedOptionIndex": 0
      }
    ],
    "finalRecommendation": "APP",
    "quid6Result": {
      "totalScore": 15,
      "stressScore": 5,
      "urgeScore": 5,
      "overallIncontinenceImpact": 5,
      "interpretation": "Mild symptoms detected"
    }
  }
}
```

**Error Response (404):**
```json
{
  "message": "Audit key does not exist",
  "status": false
}
```

---

### 3. Check Key Exists
**GET** `/audit-records/{key}/exists`

Checks if an audit key already exists (useful before creating new records).

**Path Parameters:**
- `key` (string): The audit record key to check

**Success Response (200):**
```json
{
  "message": "Key existence checked",
  "data": {
    "exists": true
  }
}
```

---

### 4. Get All Audit Records
**GET** `/audit-records`

Retrieves paginated list of all audit records (for admin/backup purposes).

**Query Parameters:**
- `limit` (integer, optional): Number of records to return (1-1000, default: 100)
- `offset` (integer, optional): Number of records to skip (default: 0)

**Example:**
```
GET /audit-records?limit=50&offset=100
```

**Success Response (200):**
```json
{
  "message": "Audit records retrieved successfully",
  "data": {
    "records": [
      {
        "key": "ABC12345",
        "timestamp": "2024-01-15T14:30:00",
        "path": [...],
        "finalRecommendation": "APP",
        "quid6Result": {...}
      }
    ],
    "total": 150,
    "limit": 50,
    "offset": 100
  }
}
```

---

### 5. Get Storage Statistics
**GET** `/audit-records/stats`

Returns statistics about audit record storage for monitoring.

**Success Response (200):**
```json
{
  "message": "Audit statistics retrieved",
  "data": {
    "recordCount": 1250,
    "estimatedSizeKB": 850
  }
}
```

---

### 6. Health Check
**GET** `/health`

Health check endpoint for the audit trail service.

**Success Response (200):**
```json
{
  "message": "Audit trail service is healthy",
  "data": {
    "status": "healthy",
    "database": "connected",
    "timestamp": "2024-01-15T14:30:00.123456"
  }
}
```

**Error Response (500):**
```json
{
  "message": "Audit trail service is unhealthy",
  "data": {
    "status": "unhealthy",
    "database": "disconnected",
    "timestamp": "2024-01-15T14:30:00.123456"
  }
}
```

---

## Usage Examples

### JavaScript/Fetch Example
```javascript
// Create audit record
async function createAuditRecord(auditData) {
  const response = await fetch('https://api.urogy.in/audit-records', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(auditData)
  });
  
  if (response.ok) {
    const result = await response.json();
    console.log('Audit record created:', result.data.key);
    return result;
  } else {
    const error = await response.json();
    console.error('Failed to create audit record:', error.message);
    throw new Error(error.message);
  }
}

// Check if key exists before creating
async function checkKeyExists(key) {
  const response = await fetch(`https://api.urogy.in/audit-records/${key}/exists`);
  const result = await response.json();
  return result.data.exists;
}

// Get audit record
async function getAuditRecord(key) {
  const response = await fetch(`https://api.urogy.in/audit-records/${key}`);
  
  if (response.ok) {
    const result = await response.json();
    return result.data;
  } else if (response.status === 404) {
    return null; // Record not found
  } else {
    throw new Error('Failed to fetch audit record');
  }
}
```

### Axios Example
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.urogy.in',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Create audit record
const createAuditRecord = async (auditData) => {
  try {
    const response = await api.post('/audit-records', auditData);
    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      throw new Error('Audit key already exists');
    }
    throw error;
  }
};

// Get audit record
const getAuditRecord = async (key) => {
  try {
    const response = await api.get(`/audit-records/${key}`);
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};
```

---

## Error Handling

All endpoints return consistent error formats:

**Client Errors (4xx):**
```json
{
  "message": "Human readable error message",
  "status": false
}
```

**Server Errors (5xx):**
```json
{
  "message": "Internal server error",
  "status": false
}
```

**Validation Errors (422):**
```json
{
  "detail": [
    {
      "loc": ["body", "fieldName"],
      "msg": "validation error message",
      "type": "error_type"
    }
  ]
}
```

---

## Best Practices

1. **Always check key existence** before creating new audit records to avoid 400 errors
2. **Generate unique 8-character keys** (uppercase alphanumeric only)
3. **Include proper timestamps** in ISO 8601 format
4. **Handle 404 errors gracefully** when retrieving records
5. **Use appropriate finalRecommendation values**: "APP", "Surgeon", or "PT"
6. **Include comprehensive path data** to track user journey through questionnaire
7. **Add QUID-6 results when available** for better analytics