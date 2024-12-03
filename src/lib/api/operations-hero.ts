import { z } from 'zod';
import { saveRepairTicket } from './repair-tickets';

const API_BASE = 'https://api.operationshero.com/v1';
const ACCOUNT_ID = 'bfb5ba24-de95-4eb9-aa25-7c118300b568';
const API_KEY = '6aa2b15fac7e45c0b1b607394bb39e34db36a1e560dc471987db9677bec9717d';

// School locations mapping for the API
export const SCHOOL_LOCATIONS = {
  'kossman': {
    id: '748dba0b-9b01-4408-b2c2-d6bc7f8fc536',
    name: 'Kossmann School'
  },
  'cucinella': {
    id: '5cba7ac4-15f2-40d4-8299-2ef48c3d728e',
    name: 'Benedict A. Cucinella School'
  },
  'central-office': {
    id: '76863b6d-0bf7-43d3-83f4-754677f7a962',
    name: 'Board of Education'
  },
  'long-valley': {
    id: '399acf3a-8515-473e-86b1-ac1f7237b945',
    name: 'Long Valley Middle School'
  },
  'old-farmers': {
    id: 'b80ca82a-d847-4229-a454-417639eb044f',
    name: 'Old Farmers Road School'
  },
  'flocktown': {
    id: '9a33a5d7-73a8-4d46-b452-c883423a3cfb',
    name: 'Flocktown Road School'
  }
} as const;

// Issue types for repair tickets
export const ISSUE_TYPES = [
  { id: 'broken-screen', name: 'Broken Screen' },
  { id: 'keyboard-issue', name: 'Keyboard Not Working' },
  { id: 'charging-issue', name: 'Not Charging' },
  { id: 'battery-issue', name: 'Battery Problems' },
  { id: 'touchpad-issue', name: 'Touchpad Not Working' },
  { id: 'wifi-issue', name: 'WiFi Connection Issues' },
  { id: 'audio-issue', name: 'Audio Problems' },
  { id: 'software-issue', name: 'Software/OS Issues' },
  { id: 'physical-damage', name: 'Physical Damage' },
  { id: 'other', name: 'Other Issue' }
] as const;

// API Constants
const REPORTING_CATEGORY = '089b147c-ba5a-40ac-b059-3fc015d5ef87';
const DEFAULT_REQUESTER = 'fc027fe5-89f2-4b47-ac7f-391fd6741d22';
const DEFAULT_WORKFLOW = 'f701bb6e-266c-44bf-8af6-d57a9178b2dc';

const RepairTicketSchema = z.object({
  schoolId: z.string().min(1, 'School location is required'),
  deviceType: z.enum(['chromebook', 'windows', 'mac', 'other']),
  noBarcode: z.boolean(),
  fullName: z.string().min(1, 'Full name is required'),
  issueType: z.string().min(1, 'Issue type is required'),
  serialNumber: z.string().min(1, 'Device barcode/serial is required'),
  notes: z.string().optional().or(z.literal('')),
  isStaff: z.boolean().default(false)
});

export type RepairTicketData = z.infer<typeof RepairTicketSchema>;

async function createTicket(data: RepairTicketData) {
  try {
    const validatedData = RepairTicketSchema.parse(data);
    
    // Get location ID from school ID
    const location = SCHOOL_LOCATIONS[data.schoolId as keyof typeof SCHOOL_LOCATIONS];
    if (!location) {
      throw new Error(`Invalid school location: ${data.schoolId}`);
    }
    
    // Compile all information into a detailed summary
    const summaryParts = [
      `Device Type: ${validatedData.deviceType}`,
      `Serial/Asset Tag: ${validatedData.serialNumber}`,
      `Issue: ${validatedData.issueType}`,
      validatedData.notes && `Additional Notes: ${validatedData.notes}`,
      '\nSubmitted via Device Checkout Kiosk'
    ].filter(Boolean).join('\n');

    const apiUrl = `${API_BASE}/accounts/${ACCOUNT_ID}/requests`;

    console.log('Creating ticket with payload:', {
      location: location.id,
      metadata: { Directions_Room_Number: 'Loaner Cart' },
      priority: 'standard',
      reportingCategory: REPORTING_CATEGORY,
      requester: DEFAULT_REQUESTER,
      status: 'new',
      summary: summaryParts,
      type: 'triggered',
      workflow: DEFAULT_WORKFLOW
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        location: location.id,
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
      console.error('API error response:', errorData);
      throw new Error(errorData.response?.message || `API Error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Ticket created successfully:', result);

    // Save the repair ticket to local storage
    await saveRepairTicket({
      fullName: validatedData.fullName,
      deviceType: validatedData.deviceType,
      deviceBarcode: validatedData.serialNumber,
      issueType: validatedData.issueType,
      notes: validatedData.notes,
      schoolId: validatedData.schoolId,
      isStaff: validatedData.isStaff,
      operationsHeroId: result.id,
      status: 'open'
    });

    return result;
  } catch (error) {
    console.error('Error creating repair ticket:', error);
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new Error(`Validation error: ${firstError.message}`);
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}

export const OperationsHeroAPI = {
  createTicket
};
