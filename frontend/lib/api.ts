/**
 * REST client helpers for calendar events: maps DTOs with Unix timestamps to Date objects for the UI layer.
 */
import { API_ORIGIN } from "./apiBase"

const API_BASE_URL = `${API_ORIGIN}/api`

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

/** Maps an API event DTO to UI shape with `date` as a JavaScript Date. */
function dtoToEvent(dto: CalendarEventDTO) {
  return {
    ...dto,
    date: new Date(dto.date * 1000), // Convert Unix timestamp to Date
  };
}

/** Converts UI event objects with Date `date` back to Unix seconds for the API. */
function eventToDTO(event: any) {
  return {
    ...event,
    date: Math.floor(event.date.getTime() / 1000), // Convert Date to Unix timestamp
  };
}

export const eventApi = {
  /** GET /events — returns all events with dates as Date objects. */
  async getAllEvents() {
    const response = await fetch(`${API_BASE_URL}/events`);
    if (!response.ok) throw new Error('Failed to fetch events');
    const data: CalendarEventDTO[] = await response.json();
    return data.map(dtoToEvent);
  },

  /** GET /events/:id — fetches one event by id. */
  async getEvent(id: string) {
    const response = await fetch(`${API_BASE_URL}/events/${id}`);
    if (!response.ok) throw new Error('Failed to fetch event');
    const data: CalendarEventDTO = await response.json();
    return dtoToEvent(data);
  },

  /** POST /events — creates an event from a UI model with Date fields. */
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

  /** PUT /events/:id — updates an existing event. */
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

  /** DELETE /events/:id — removes an event. */
  async deleteEvent(id: string) {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete event');
  },

  /** GET filter by type (if backend route exists). */
  async filterByType(type: string) {
    const response = await fetch(`${API_BASE_URL}/events/filter/type/${type}`);
    if (!response.ok) throw new Error('Failed to filter events');
    const data: CalendarEventDTO[] = await response.json();
    return data.map(dtoToEvent);
  },

  /** GET filter by location (if backend route exists). */
  async filterByLocation(location: string) {
    const response = await fetch(`${API_BASE_URL}/events/filter/location/${location}`);
    if (!response.ok) throw new Error('Failed to filter events');
    const data: CalendarEventDTO[] = await response.json();
    return data.map(dtoToEvent);
  },

  /** GET events overlapping a date range (if backend route exists). */
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