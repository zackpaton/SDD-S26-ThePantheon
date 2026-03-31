const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface CalendarEventDTO {
  id: string;
  title: string;
  date: number; // Unix timestamp from C++
  startTime?: string;
  endTime?: string;
  type: "Meeting" | "Holiday" | "Birthday" | "Workshop" | "Other";
  location?: string;
  description?: string;
}

// Helper to convert timestamp to Date
function dtoToEvent(dto: CalendarEventDTO) {
  return {
    ...dto,
    date: new Date(dto.date * 1000), // Convert Unix timestamp to Date
  };
}

// Helper to convert Date to timestamp
function eventToDTO(event: any) {
  return {
    ...event,
    date: Math.floor(event.date.getTime() / 1000), // Convert Date to Unix timestamp
  };
}

export const eventApi = {
  async getAllEvents() {
    const response = await fetch(`${API_BASE_URL}/events`);
    if (!response.ok) throw new Error('Failed to fetch events');
    const data: CalendarEventDTO[] = await response.json();
    return data.map(dtoToEvent);
  },

  async getEvent(id: string) {
    const response = await fetch(`${API_BASE_URL}/events/${id}`);
    if (!response.ok) throw new Error('Failed to fetch event');
    const data: CalendarEventDTO = await response.json();
    return dtoToEvent(data);
  },

  async createEvent(event: any) {
    const dto = eventToDTO(event);
    const response = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!response.ok) throw new Error('Failed to create event');
    const result = await response.json();
    return dtoToEvent(result.event);
  },

  async updateEvent(id: string, event: any) {
    const dto = eventToDTO(event);
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...dto, id }),
    });
    if (!response.ok) throw new Error('Failed to update event');
    const result = await response.json();
    return dtoToEvent(result.event);
  },

  async deleteEvent(id: string) {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete event');
  },

  async filterByType(type: string) {
    const response = await fetch(`${API_BASE_URL}/events/filter/type/${type}`);
    if (!response.ok) throw new Error('Failed to filter events');
    const data: CalendarEventDTO[] = await response.json();
    return data.map(dtoToEvent);
  },

  async filterByLocation(location: string) {
    const response = await fetch(`${API_BASE_URL}/events/filter/location/${location}`);
    if (!response.ok) throw new Error('Failed to filter events');
    const data: CalendarEventDTO[] = await response.json();
    return data.map(dtoToEvent);
  },

  async filterByDateRange(start: Date, end: Date) {
    const startTimestamp = Math.floor(start.getTime() / 1000);
    const endTimestamp = Math.floor(end.getTime() / 1000);
    const response = await fetch(
      `${API_BASE_URL}/events/filter/date-range?start=${startTimestamp}&end=${endTimestamp}`
    );
    if (!response.ok) throw new Error('Failed to filter events');
    const data: CalendarEventDTO[] = await response.json();
    return data.map(dtoToEvent);
  },
};