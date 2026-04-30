/**
 * Client-side checks before POST/PUT /api/events so users get clear messages
 * (aligned with server overlap / fraternity rules that surface as JSON
 * `error`).
 */
export type EventFormFields = {
  eventType: string
  title: string
  description: string
  location: string
  date: string
  startTime: string
  endTime: string
  beneficiary: string
  fundraisingGoal: string
  maxCapacity: string
}

/** Returns a single message describing the first problem, or null if OK. */
export function validateEventFormFields(form: EventFormFields): string | null {
  if (!form.eventType?.trim()) {
    return 'Please select an event type.';
  }
  if (!form.title?.trim()) {
    return 'Title is required.';
  }
  if (!form.location?.trim()) {
    return 'Location is required.';
  }
  if (!form.date?.trim()) {
    return 'Date is required.';
  }
  if (!form.startTime?.trim()) {
    return 'Start time is required.';
  }
  if (!form.endTime?.trim()) {
    return 'End time is required.';
  }

  const start = new Date(`${form.date}T${form.startTime}`);
  const end = new Date(`${form.date}T${form.endTime}`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Date or time is invalid.';
  }
  if (end <= start) {
    return 'End time must be after start time.';
  }

  if (form.eventType === 'Philanthropy') {
    if (!form.beneficiary?.trim()) {
      return 'Beneficiary is required for philanthropy events.';
    }
    const goal = Number(form.fundraisingGoal);
    if (
      form.fundraisingGoal?.trim() === '' ||
      Number.isNaN(goal) ||
      goal <= 0
    ) {
      return 'Enter a valid fundraising goal greater than zero.';
    }
  }

  if (form.eventType === 'Social') {
    const cap = Number(form.maxCapacity);
    if (
      form.maxCapacity?.trim() === '' ||
      Number.isNaN(cap) ||
      !Number.isInteger(cap) ||
      cap <= 0
    ) {
      return 'Maximum capacity must be a positive whole number.';
    }
  }

  return null;
}
