import logger from '../utils/logger.js';

const API_BASE = 'https://api.operationshero.com/v1';
const ACCOUNT_ID = 'bfb5ba24-de95-4eb9-aa25-7c118300b568';
const API_KEY = '6aa2b15fac7e45c0b1b607394bb39e34db36a1e560dc471987db9677bec9717d';

const SCHOOL_LOCATIONS = {
  'kossman': '748dba0b-9b01-4408-b2c2-d6bc7f8fc536',
  'cucinella': '5cba7ac4-15f2-40d4-8299-2ef48c3d728e',
  'central-office': '76863b6d-0bf7-43d3-83f4-754677f7a962',
  'long-valley': '399acf3a-8515-473e-86b1-ac1f7237b945',
  'old-farmers': 'b80ca82a-d847-4229-a454-417639eb044f',
  'flocktown': '9a33a5d7-73a8-4d46-b452-c883423a3cfb'
};

const REPORTING_CATEGORY = '089b147c-ba5a-40ac-b059-3fc015d5ef87';
const DEFAULT_REQUESTER = 'fc027fe5-89f2-4b47-ac7f-391fd6741d22';
const DEFAULT_WORKFLOW = 'f701bb6e-266c-44bf-8af6-d57a9178b2dc';

export async function createOperationsHeroTicket({
  schoolId,
  deviceType,
  fullName,
  issueType,
  deviceBarcode,
  notes,
  isStaff
}) {
  try {
    const locationId = SCHOOL_LOCATIONS[schoolId];
    if (!locationId) {
      throw new Error(`Invalid school location: ${schoolId}`);
    }

    const summaryParts = [
      `Device Type: ${deviceType}`,
      `Serial/Asset Tag: ${deviceBarcode}`,
      `Issue: ${issueType}`,
      `Submitted By: ${fullName} (${isStaff ? 'Staff' : 'Student'})`,
      notes && `Additional Notes: ${notes}`,
      '\nSubmitted via Device Checkout Kiosk'
    ].filter(Boolean).join('\n');

    const response = await fetch(`${API_BASE}/accounts/${ACCOUNT_ID}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        location: locationId,
        metadata: {
          Directions_Room_Number: 'Loaner Cart'
        },
        priority: 'standard',
        reportingCategory: REPORTING_CATEGORY,
        requester: DEFAULT_REQUESTER,
        status: 'new',
        summary: summaryParts,
        type: 'triggered',
        workflow: DEFAULT_WORKFLOW,
        estimatedCost: null,
        estimatedHours: null,
        scheduledRequestId: null,
        scheduling: {
          start: null,
          due: null,
          completed: null
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error('Operations Hero API error:', errorData);
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error creating Operations Hero ticket:', error);
    throw error;
  }
}
