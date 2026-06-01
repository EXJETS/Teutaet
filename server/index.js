import express from "express";
import pg from "pg";
import Stripe from "stripe";
import { randomBytes } from "crypto";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-11-20.acacia",
});

const PLATFORM_COMMISSION_RATE = 0.20;
const CHAUFFEUR_TIP_RATE = 0.20; // built-in, included in total_passenger

function generateRef() {
  const n = 1000 + (randomBytes(2).readUInt16BE() % 9000);
  const s = randomBytes(1).toString("hex")[0].toUpperCase();
  return `FL-${n}-${s}`;
}

async function logEvent(client, bookingId, fromStatus, toStatus, actor, metadata = null) {
  await client.query(
    `INSERT INTO booking_events (booking_id, from_status, to_status, actor, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [bookingId, fromStatus, toStatus, actor, metadata ? JSON.stringify(metadata) : null]
  );
}

// ─── POST /api/workflow/book-ride ───────────────────────────────────────────
// Step 1: Passenger books → Stripe authorization hold → status = 'offered'
app.post("/api/workflow/book-ride", async (req, res) => {
  const {
    vehicleClass, tripType,
    pickup, pickupGeo, dropoff, dropoffGeo,
    date, time, duration, flightNumber, distanceMiles,
    passengerName, passengerEmail, paymentMethodId,
    baseFare, taxAndFees, total,
  } = req.body;

  if (!vehicleClass || !pickup || !date || !time || !passengerEmail) {
    return res.status(400).json({ ok: false, error: "Missing required booking fields" });
  }

  const tip = +(total * CHAUFFEUR_TIP_RATE).toFixed(2);
  const totalWithTip = +(total + tip).toFixed(2);
  const isDemoMode = !paymentMethodId || paymentMethodId === "pm_demo";

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Upsert Stripe customer
    let customerId = `cus_demo_${Date.now()}`;
    if (!isDemoMode) {
      const existing = await stripe.customers.list({ email: passengerEmail, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const c = await stripe.customers.create({ email: passengerEmail, name: passengerName ?? "Guest" });
        customerId = c.id;
      }

      // Attach payment method (idempotent)
      try {
        await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
      } catch (e) {
        // Already attached – safe to ignore
        if (!e.message?.includes("already been attached")) throw e;
      }
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    }

    // Create authorization hold with manual capture
    let piId = `pi_demo_${Date.now()}`;
    if (!isDemoMode) {
      const pi = await stripe.paymentIntents.create({
        amount: Math.round(totalWithTip * 100),
        currency: "usd",
        customer: customerId,
        payment_method: paymentMethodId,
        capture_method: "manual",
        confirm: true,
        description: `Flex/Lane – ${vehicleClass} transfer`,
        automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      });
      piId = pi.id;
    }

    const reference = generateRef();
    const pickupAt = new Date(`${date}T${time}:00`);

    const { rows } = await client.query(
      `INSERT INTO bookings (
        reference, vehicle_class, trip_type,
        pickup_address, pickup_lat, pickup_lon,
        dropoff_address, dropoff_lat, dropoff_lon,
        pickup_at, duration_hours, distance_miles, flight_number,
        base_fare, tax_and_fees, chauffeur_tip, total_passenger,
        stripe_payment_intent_id, stripe_customer_id,
        status, offered_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,'offered',NOW())
      RETURNING id, reference`,
      [
        reference, vehicleClass, tripType,
        pickup, pickupGeo?.lat ?? null, pickupGeo?.lon ?? null,
        dropoff ?? null, dropoffGeo?.lat ?? null, dropoffGeo?.lon ?? null,
        pickupAt, duration ?? null, distanceMiles ?? null, flightNumber ?? null,
        baseFare, taxAndFees, tip, totalWithTip,
        piId, customerId,
      ]
    );

    await logEvent(client, rows[0].id, null, "offered", "passenger");
    await client.query("COMMIT");

    // Non-blocking broadcast to operator network
    broadcastToNetwork(rows[0].id, reference).catch(console.error);

    res.json({ ok: true, reference: rows[0].reference, bookingId: rows[0].id });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("book-ride:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    client.release();
  }
});

// Simulate GNet/GroundXchange broadcast to registered operators
async function broadcastToNetwork(bookingId, reference) {
  const { rows } = await db.query(`SELECT * FROM operators WHERE is_active = true`);
  for (const op of rows) {
    if (!op.api_endpoint) continue;
    try {
      await fetch(op.api_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, reference, source: "flexlane" }),
        signal: AbortSignal.timeout(4000),
      });
    } catch (e) {
      console.warn(`Operator '${op.name}' unreachable:`, e.message);
    }
  }
}

// ─── POST /api/workflow/accept-ride ────────────────────────────────────────
// Step 2: B2B operator accepts → status = 'accepted', payout computed
app.post("/api/workflow/accept-ride", async (req, res) => {
  const { bookingId, operatorId } = req.body;
  if (!bookingId || !operatorId) {
    return res.status(400).json({ ok: false, error: "bookingId and operatorId are required" });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const { rows: bookings } = await client.query(
      `SELECT * FROM bookings WHERE id = $1 AND status = 'offered' FOR UPDATE`,
      [bookingId]
    );
    if (!bookings.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({ ok: false, error: "Booking not available or already accepted" });
    }

    const { rows: ops } = await client.query(
      `SELECT * FROM operators WHERE id = $1 AND is_active = true`,
      [operatorId]
    );
    if (!ops.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ ok: false, error: "Operator not found" });
    }

    const booking = bookings[0];
    const op = ops[0];
    const payout = +(booking.total_passenger * op.wholesale_rate_multiplier).toFixed(2);

    await client.query(
      `UPDATE bookings SET
        status = 'accepted', operator_id = $1, operator_payout = $2,
        accepted_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [operatorId, payout, bookingId]
    );

    await logEvent(client, bookingId, "offered", "accepted", "operator", { operatorId, payout });
    await client.query("COMMIT");

    res.json({ ok: true, reference: booking.reference, operatorPayout: payout });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("accept-ride:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    client.release();
  }
});

// ─── POST /api/workflow/complete-ride ──────────────────────────────────────
// Step 3: Chauffeur drops off → Stripe capture → commission recorded → 'completed'
app.post("/api/workflow/complete-ride", async (req, res) => {
  const { bookingId, chauffeurNotes } = req.body;
  if (!bookingId) return res.status(400).json({ ok: false, error: "bookingId is required" });

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT * FROM bookings WHERE id = $1 AND status = 'accepted' FOR UPDATE`,
      [bookingId]
    );
    if (!rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({ ok: false, error: "Booking is not in accepted state" });
    }

    const booking = rows[0];
    const isDemoMode = booking.stripe_payment_intent_id.startsWith("pi_demo_");

    let chargeId = `ch_demo_${Date.now()}`;
    if (!isDemoMode) {
      const captured = await stripe.paymentIntents.capture(booking.stripe_payment_intent_id);
      const rawCharge = captured.latest_charge;
      chargeId = typeof rawCharge === "string" ? rawCharge : rawCharge?.id ?? chargeId;
    }

    const commission = +(booking.total_passenger * PLATFORM_COMMISSION_RATE).toFixed(2);

    await client.query(
      `UPDATE bookings SET
        status = 'completed', stripe_charge_id = $1, platform_commission = $2,
        chauffeur_notes = $3, completed_at = NOW(), updated_at = NOW()
       WHERE id = $4`,
      [chargeId, commission, chauffeurNotes ?? null, bookingId]
    );

    await logEvent(client, bookingId, "accepted", "completed", "system", { chargeId, commission });
    await client.query("COMMIT");

    res.json({
      ok: true,
      reference: booking.reference,
      totalCharged: booking.total_passenger,
      operatorPayout: booking.operator_payout,
      platformCommission: commission,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("complete-ride:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    client.release();
  }
});

// ─── Health check ──────────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ ok: true, ts: new Date().toISOString() }));

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => console.log(`Flexlane API running on :${PORT}`));
export default app;
