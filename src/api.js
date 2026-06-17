const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";

async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}

/**
 * Step 1 – Book a ride.
 * Places a Stripe authorization hold and sets the booking to 'offered'.
 * @param {object} payload – trip details, pricing, and paymentMethodId
 * @returns {{ reference: string, bookingId: string }}
 */
export function bookRide(payload) {
  return post("/api/workflow/book-ride", payload);
}

/**
 * Step 2 – Operator accepts from B2B network.
 * Transitions booking from 'offered' → 'accepted' and records operator payout.
 * @param {string} bookingId
 * @param {string} operatorId
 * @returns {{ reference: string, operatorPayout: number }}
 */
export function acceptRide(bookingId, operatorId) {
  return post("/api/workflow/accept-ride", { bookingId, operatorId });
}

/**
 * Step 3 – Complete the ride.
 * Captures the Stripe hold, records platform commission, sets status 'completed'.
 * @param {string} bookingId
 * @param {string} [chauffeurNotes]
 * @returns {{ reference: string, totalCharged: number, operatorPayout: number, platformCommission: number }}
 */
export function completeRide(bookingId, chauffeurNotes) {
  return post("/api/workflow/complete-ride", { bookingId, chauffeurNotes });
}
