import { z } from 'zod';
import { generateUUID } from '../utils';

// Schema for repair tickets
export const RepairTicketSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  deviceType: z.enum(['chromebook', 'windows', 'mac', 'other']),
  deviceBarcode: z.string(),
  issueType: z.string(),
  notes: z.string().optional(),
  schoolId: z.string(),
  isStaff: z.boolean(),
  createdAt: z.string(),
  operationsHeroId: z.string().optional(),
  status: z.enum(['open', 'closed']).default('open')
});

export type RepairTicket = z.infer<typeof RepairTicketSchema>;

const REPAIR_TICKETS_KEY = 'repair_tickets';

export async function saveRepairTicket(data: Omit<RepairTicket, 'id' | 'createdAt'>): Promise<RepairTicket> {
  const stored = localStorage.getItem(REPAIR_TICKETS_KEY);
  const tickets = stored ? JSON.parse(stored) : [];

  const newTicket: RepairTicket = {
    ...data,
    id: generateUUID(),
    createdAt: new Date().toISOString()
  };

  tickets.push(newTicket);
  localStorage.setItem(REPAIR_TICKETS_KEY, JSON.stringify(tickets));
  return newTicket;
}

export async function fetchRepairTickets(params: {
  startDate?: string;
  endDate?: string;
  deviceBarcode?: string;
  fullName?: string;
  issueType?: string;
  schoolId?: string;
  isStaff?: boolean;
  status?: 'open' | 'closed';
}): Promise<RepairTicket[]> {
  const stored = localStorage.getItem(REPAIR_TICKETS_KEY);
  if (!stored) return [];

  try {
    let tickets = JSON.parse(stored) as RepairTicket[];
    
    if (params.startDate) {
      tickets = tickets.filter(ticket => ticket.createdAt >= params.startDate!);
    }
    if (params.endDate) {
      tickets = tickets.filter(ticket => ticket.createdAt <= params.endDate!);
    }
    if (params.deviceBarcode) {
      tickets = tickets.filter(ticket => 
        ticket.deviceBarcode.toLowerCase().includes(params.deviceBarcode!.toLowerCase())
      );
    }
    if (params.fullName) {
      tickets = tickets.filter(ticket => 
        ticket.fullName.toLowerCase().includes(params.fullName!.toLowerCase())
      );
    }
    if (params.issueType) {
      tickets = tickets.filter(ticket => ticket.issueType === params.issueType);
    }
    if (params.schoolId) {
      tickets = tickets.filter(ticket => ticket.schoolId === params.schoolId);
    }
    if (typeof params.isStaff === 'boolean') {
      tickets = tickets.filter(ticket => ticket.isStaff === params.isStaff);
    }
    if (params.status) {
      tickets = tickets.filter(ticket => ticket.status === params.status);
    }

    return tickets.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error parsing repair tickets:', error);
    return [];
  }
}

export async function exportRepairTickets(params: Parameters<typeof fetchRepairTickets>[0]): Promise<string> {
  const tickets = await fetchRepairTickets(params);
  
  const headers = [
    'Date',
    'Time',
    'Name',
    'Device Type',
    'Device Barcode',
    'Issue Type',
    'Notes',
    'School',
    'Staff/Student',
    'Status'
  ];

  const rows = tickets.map(ticket => {
    const date = new Date(ticket.createdAt);
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      ticket.fullName,
      ticket.deviceType,
      ticket.deviceBarcode,
      ticket.issueType,
      ticket.notes || '',
      ticket.schoolId,
      ticket.isStaff ? 'Staff' : 'Student',
      ticket.status
    ].map(field => `"${field}"`);
  });

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}
