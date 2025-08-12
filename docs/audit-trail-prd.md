# Scheduling Assistant Audit Trail Feature

## Product Requirements Document

### Overview
Add audit trail capability to the Scheduling Assistant to enable quality assurance and compliance review of provider assignment decisions without collecting or storing personal health information.

### Problem Statement
Currently, there is no way to retrospectively review how the Scheduling Assistant arrived at specific provider recommendations. This creates challenges for:
- Quality assurance of scheduling decisions
- Compliance audits
- Process improvement and optimization
- Training and education of scheduling staff

### Solution
Implement an audit trail system that generates unique audit keys for each completed workflow, stores the decision path, and provides a lookup interface for retrospective review.

## Requirements

### Functional Requirements

#### FR1: Audit Key Generation
- System generates a unique 8-character alphanumeric audit key (e.g., `A1B2C3D4`) upon workflow completion
- Keys must be unique and non-predictable
- Keys are generated only when a final provider recommendation is reached

#### FR2: Audit Data Storage
- Store complete decision path including:
  - All questions presented and answers selected
  - QUID-6 assessment results (if applicable)
  - Final provider recommendation
  - Timestamp of completion
- Data stored locally in browser localStorage
- No personal health information (PHI) collected or stored

#### FR3: Audit Key Display
- Display audit key prominently in provider recommendation section
- Include instructional text: "Copy this audit key into appointment notes"
- Provide visual display of key with copy functionality
- Both clicking the text field and copy icon copies key to clipboard

#### FR4: Audit Lookup Interface
- New page at `/scheduling/audit` for audit key lookup
- Search input field for entering audit keys
- Display complete audit trail when valid key is entered
- Human-readable format showing decision flow and final recommendation

#### FR5: Access Control
- Audit lookup accessible via link from scheduling page
- Not included in main navigation
- No authentication required (consistent with current application)

### Non-Functional Requirements

#### NFR1: Storage Efficiency
- Optimize data storage to handle ~50 records per week (~2,600 annually)
- Compress stored data to minimize localStorage usage
- No automatic expiration of audit records

#### NFR2: Usability
- Audit key must be easy to read and type manually if needed
- Copy functionality must work reliably across browsers
- Audit trail display must be clear and understandable by non-technical staff

#### NFR3: Privacy
- Zero PHI collection or storage
- Audit records contain only workflow decision data
- No patient identifiers or clinical details beyond workflow path

## User Stories

### US1: Scheduler Creates Audit Trail
**As a** scheduler using the Scheduling Assistant  
**I want** an audit key generated when I complete a workflow  
**So that** I can copy it into the appointment notes for future reference

**Acceptance Criteria:**
- Audit key appears when final provider recommendation is shown
- Key is easily copyable with one click and feedback indicating successful copy is provided
- Clear instructions provided for scheduler

### US2: Quality Assurance Review
**As a** quality assurance reviewer  
**I want** to look up audit trails using audit keys  
**So that** I can verify that patients were scheduled with appropriate providers

**Acceptance Criteria:**
- Can enter audit key and retrieve complete decision path
- Decision path is presented in readable format
- Shows timestamp and final recommendation

### US3: Process Improvement Analysis
**As a** practice manager  
**I want** to review audit trails of scheduling decisions  
**So that** I can identify patterns and improve our workflow

**Acceptance Criteria:**
- Audit trail shows complete decision logic
- QUID-6 results displayed when applicable
- Timestamp enables temporal analysis

## Technical Implementation

### Data Structure
```typescript
interface AuditRecord {
  key: string;                // 8-character alphanumeric
  timestamp: string;          // ISO timestamp
  path: PathStep[];          // Complete decision path
  finalRecommendation: string; // Provider type (APP/Surgeon/PT)
  quid6Result?: Quid6Result; // QUID-6 data if applicable
}
```

### Storage
- Browser localStorage with key prefix `scheduling-audit-`
- JSON serialization with compression
- Maximum storage consideration: ~2,600 records annually

### UI Components
- Audit key display component in provider recommendation
- Copy-to-clipboard functionality
- New audit lookup page with search and results display
- Navigation link from scheduling page

## Success Metrics
- Audit keys successfully generated for 100% of completed workflows
- Copy functionality works across all supported browsers
- Audit lookup successfully retrieves records with valid keys
- Zero PHI inadvertently collected or stored

## Implementation Timeline
- Phase 1: Audit key generation and display (Week 1)
- Phase 2: Audit lookup interface (Week 2)
- Phase 3: Testing and refinement (Week 3)

## Risks and Mitigation
- **Risk:** localStorage size limits reached
  - **Mitigation:** Monitor usage, implement data compression
- **Risk:** Browser compatibility issues with copy functionality
  - **Mitigation:** Test across target browsers, provide fallback manual copy
- **Risk:** Accidental PHI collection
  - **Mitigation:** Code review, explicit PHI exclusion in data model

## Future Considerations
- Allow providers to "score" the audit with "was this appropriately scheduled? on a scale of 1-10"
- Export audit data for external analysis
- Integration with practice management systems
- Advanced search and filtering capabilities
- Automated compliance reporting