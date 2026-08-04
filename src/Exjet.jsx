import React, { useEffect, useRef, useState } from "react";
import {
  Menu, X, Phone, Mail, MapPin, ArrowRight, CheckCircle2,
  PlaneTakeoff, Repeat, PackageSearch, Scale, ShieldCheck, Globe2,
  Clock, Users, Wrench, Gavel, FileSignature, ClipboardList,
  Building2, Landmark, PhoneCall, Lock,
} from "lucide-react";

const NAV_LINKS = [
  { href: "#charter", label: "Charter & Jet Cards" },
  { href: "#aircraft-sales", label: "Aircraft Sales" },
  { href: "#cargo", label: "Cargo & ACMI" },
  { href: "#advisory", label: "Advisory" },
  { href: "#contact", label: "Contact" },
];

const VERTICALS = [
  {
    id: "charter",
    index: "01",
    icon: PlaneTakeoff,
    eyebrow: "On-Demand Charter & Jet Cards",
    title: "Fly on your schedule, backed by a vetted global fleet.",
    body: "EXJET arranges on-demand private charter across a global network of vetted operators, from light jets to long-range heavies, alongside guaranteed-availability jet card programs for clients who fly frequently. Every trip is quoted transparently and supported by a dedicated operations desk from first call to touchdown.",
    points: [
      "On-demand charter across light, midsize, super-midsize & heavy jets",
      "Jet card programs with locked rates & guaranteed availability",
      "Empty-leg and one-way repositioning savings",
      "ARGUS / Wyvern-vetted operator network",
      "24/7/365 trip support and in-flight monitoring",
      "Transparent, all-in quoting — no hidden fees",
    ],
    cta: "Request a charter quote",
  },
  {
    id: "aircraft-sales",
    index: "02",
    icon: Repeat,
    eyebrow: "Aircraft Acquisition, Sales & Dry Lease",
    title: "Buy, sell, or lease with an advisor in your corner.",
    body: "From sourcing and valuation to negotiation and closing, EXJET represents buyers and sellers of pre-owned and new business aircraft. We also structure dry lease placements for owners and operators looking to place airframes without crew, matching the right aircraft to the right mission and balance sheet.",
    points: [
      "Buy-side aircraft sourcing, screening & valuation",
      "Sell-side marketing, negotiation & deal management",
      "Pre-purchase inspection & technical records oversight",
      "Registration, escrow & closing coordination",
      "Dry lease structuring & operator placement",
      "Fleet planning and upgrade / trade strategy",
    ],
    cta: "Talk to an acquisitions advisor",
  },
  {
    id: "cargo",
    index: "03",
    icon: PackageSearch,
    eyebrow: "Cargo Charter, ACMI & Dry Lease",
    title: "Freighter capacity when the schedule can't wait.",
    body: "EXJET moves time-critical and outsized freight through on-demand cargo charter, and arranges ACMI (Aircraft, Crew, Maintenance, Insurance) wet-lease capacity for airlines, forwarders, and program operators who need lift without owning the asset. Dry lease placement rounds out the offering for freighter owners.",
    points: [
      "On-demand & AOG cargo charter, door-to-door",
      "ACMI / wet-lease capacity sourcing",
      "Freighter dry-lease structuring & placement",
      "Outsized, project & humanitarian cargo logistics",
      "Global network of certificated cargo operators",
      "Charter brokerage support for forwarders & airlines",
    ],
    cta: "Source cargo capacity",
  },
  {
    id: "advisory",
    index: "04",
    icon: Scale,
    eyebrow: "Business Aviation Consulting & Advisory",
    title: "The specialist bench most operators don't have in-house.",
    body: "EXJET's advisory practice covers the parts of aviation ownership that fall outside day-to-day operations: transaction and regulatory counsel, lien and title resolution, aircraft repossession, interior completions project management, and MRO sourcing and oversight — assembled around each client's specific exposure.",
    points: [
      "Aviation transaction & regulatory legal counsel",
      "Lien, title & FAA / registry resolution",
      "Aircraft repossession & recovery management",
      "Completions & interior refurbishment project management",
      "MRO sourcing, bid management & quality oversight",
      "Owner and operator risk advisory",
    ],
    cta: "Speak with our advisory team",
  },
];

const WHY = [
  {
    icon: Globe2,
    title: "One partner, every vertical",
    body: "Charter, sales, cargo, and advisory under a single point of contact — no re-briefing a new firm for every need.",
  },
  {
    icon: ShieldCheck,
    title: "Vetted, not just listed",
    body: "Operators and counterparties are screened against ARGUS, Wyvern, and IS-BAO standards before they touch a client trip or transaction.",
  },
  {
    icon: Clock,
    title: "24/7/365 operations desk",
    body: "A live desk for trip support, schedule changes, and time-critical cargo — every day of the year, not business hours only.",
  },
  {
    icon: Lock,
    title: "Discretion by default",
    body: "Principals, family offices, and corporate flight departments work with us under strict confidentiality as a baseline, not an add-on.",
  },
  {
    icon: Users,
    title: "Independent representation",
    body: "We represent the client's interest in every transaction — not a single operator, seller, or lessor's inventory.",
  },
  {
    icon: FileSignature,
    title: "Structured, documented process",
    body: "Every engagement — a charter, a sale, a lease, an advisory mandate — follows a clear scope, timeline, and paper trail.",
  },
];

const PROCESS = [
  {
    icon: PhoneCall,
    title: "Discovery call",
    body: "Tell us the mission: a trip, a transaction, a capacity need, or a problem to solve. We scope it in one conversation.",
  },
  {
    icon: ClipboardList,
    title: "Tailored proposal",
    body: "We return options — aircraft, structure, or engagement terms — with transparent pricing and a clear timeline.",
  },
  {
    icon: Building2,
    title: "Execution",
    body: "Our team and network execute: booking the trip, running the transaction, sourcing capacity, or managing the mandate.",
  },
  {
    icon: Landmark,
    title: "Ongoing support",
    body: "A single point of contact stays engaged after close — for the next trip, the next aircraft, or the next question.",
  },
];

const STATS = [
  { value: "4", label: "Integrated aviation verticals" },
  { value: "24/7", label: "Global operations desk" },
  { value: "100%", label: "Vetted operator & partner network" },
  { value: "1", label: "Point of contact, start to finish" },
];

function useScrolled(threshold = 20) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const nodes = el.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    nodes.forEach((n) => observer.observe(n));
    // Only hide elements for animation once observers are actively watching them.
    el.classList.add("reveal-ready");
    return () => observer.disconnect();
  }, []);
  return ref;
}

function BrandMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#0f1526" stroke="#c9a15a" strokeOpacity="0.4" />
      <path
        d="M50 18 L57 45 L83 56 L83 63 L57 56 L53 74 L62 79 L62 85 L50 82 L38 85 L38 79 L47 74 L43 56 L17 63 L17 56 L43 45 Z"
        fill="#c9a15a"
      />
    </svg>
  );
}

function PlanePath() {
  return (
    <svg className="plane-path" viewBox="0 0 600 380" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M20 320 C 140 320, 160 200, 260 190 C 360 180, 400 90, 560 40"
        stroke="url(#pathGrad)"
        strokeWidth="1.5"
        strokeDasharray="2 8"
        strokeLinecap="round"
      />
      <circle cx="20" cy="320" r="3" fill="#c9a15a" />
      <g transform="translate(500,60) rotate(-28)">
        <path
          d="M0 0 L34 4 L48 0 L34 -4 Z M14 -2 L10 -16 L14.5 -16 L20 -2 Z M14 2 L10 16 L14.5 16 L20 2 Z M40 -1 L46 -6 L48 -6 L45.5 -1 Z M40 1 L46 6 L48 6 L45.5 1 Z"
          fill="#e0bd7e"
        />
      </g>
      <defs>
        <linearGradient id="pathGrad" x1="20" y1="320" x2="560" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c9a15a" stopOpacity="0.1" />
          <stop offset="1" stopColor="#c9a15a" stopOpacity="0.9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Header() {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <header className={`site-header${scrolled ? " scrolled" : ""}`}>
        <div className="container">
          <a href="#top" className="brand">
            <BrandMark className="brand-mark" />
            <span>
              EXJET
              <span className="brand-tag">BUSINESS AVIATION</span>
            </span>
          </a>
          <nav className="nav-links">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href}>{link.label}</a>
            ))}
          </nav>
          <div className="header-actions">
            <a className="header-phone" href="tel:+13055550142">
              <Phone size={16} />
              +1 (305) 555-0142
            </a>
            <a href="#contact" className="btn btn-gold">
              Request a Quote
            </a>
            <button className="nav-toggle" aria-label="Open menu" onClick={() => setOpen(true)}>
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>
      <div className={`mobile-menu${open ? " open" : ""}`}>
        <button className="nav-toggle" style={{ position: "absolute", top: 24, right: 28 }} aria-label="Close menu" onClick={() => setOpen(false)}>
          <X size={20} />
        </button>
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </a>
        ))}
        <a href="#contact" className="btn btn-gold" onClick={() => setOpen(false)}>
          Request a Quote
        </a>
      </div>
    </>
  );
}

function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero-grid" aria-hidden="true" />
      <PlanePath />
      <div className="container">
        <div className="hero-content">
          <span className="eyebrow">Global Business Aviation Partner</span>
          <h1>
            Charter, aircraft, cargo,<br />and advisory — <em>under one roof.</em>
          </h1>
          <p className="hero-sub">
            EXJET is a single point of contact across four aviation verticals: on-demand
            charter and jet cards, aircraft acquisition and sales, cargo charter and ACMI,
            and specialist advisory spanning law, liens, completions, and MRO.
          </p>
          <div className="hero-ctas">
            <a href="#contact" className="btn btn-gold btn-lg">
              Request a Quote <ArrowRight size={16} />
            </a>
            <a href="#advisory" className="btn btn-ghost btn-lg">
              Speak to an Advisor
            </a>
          </div>
          <div className="hero-verticals">
            {VERTICALS.map((v) => (
              <a key={v.id} href={`#${v.id}`} className="hero-vertical-chip">
                <v.icon size={16} />
                {v.eyebrow.split(" & ")[0].replace("On-Demand ", "")}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatStrip() {
  return (
    <section className="stat-strip">
      <div className="container">
        {STATS.map((s) => (
          <div key={s.label} className="stat-item">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function VerticalBlock({ vertical, reverse }) {
  const Icon = vertical.icon;
  return (
    <div id={vertical.id} className={`vertical-block${reverse ? " reverse" : ""}`}>
      <div className="vertical-copy reveal">
        <span className="vertical-index">{vertical.index} — {vertical.eyebrow}</span>
        <h3>{vertical.title}</h3>
        <p>{vertical.body}</p>
        <ul className="vertical-list">
          {vertical.points.map((point) => (
            <li key={point}>
              <CheckCircle2 />
              {point}
            </li>
          ))}
        </ul>
        <a className="vertical-cta" href="#contact">
          {vertical.cta} <ArrowRight size={15} />
        </a>
      </div>
      <div className="vertical-visual reveal">
        <span className="visual-frame-num">{vertical.index}</span>
        <Icon className="visual-icon" />
      </div>
    </div>
  );
}

function Verticals() {
  return (
    <section className="section" id="verticals-section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">What We Do</span>
          <h2>Four verticals. One accountable partner.</h2>
          <p>
            Most aviation needs don't stay in one lane — a charter client becomes a buyer,
            an owner needs a lease restructured, a fleet needs advisory support. EXJET is
            built to move with you across all four.
          </p>
        </div>
        {VERTICALS.map((v, i) => (
          <VerticalBlock key={v.id} vertical={v} reverse={i % 2 === 1} />
        ))}
      </div>
    </section>
  );
}

function Why() {
  return (
    <section className="section section-alt">
      <div className="container">
        <div className="section-head center">
          <span className="eyebrow">Why EXJET</span>
          <h2>Built around accountability, not inventory.</h2>
          <p>
            We don't win by owning the most aircraft — we win by representing your interest
            through every vertical, every time.
          </p>
        </div>
        <div className="why-grid">
          {WHY.map((item) => (
            <div key={item.title} className="why-card reveal">
              <item.icon />
              <h4>{item.title}</h4>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Process() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">How It Works</span>
          <h2>A consistent process, whatever the mandate.</h2>
          <p>
            Whether it's a same-week charter or a multi-month aircraft acquisition, engagements
            move through the same four stages.
          </p>
        </div>
        <div className="process-rail">
          {PROCESS.map((step, i) => (
            <div key={step.title} className="process-step reveal">
              <div className="process-num">{String(i + 1).padStart(2, "0")}</div>
              <h4>{step.title}</h4>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="section-tight">
      <div className="container">
        <div className="cta-banner reveal">
          <span className="eyebrow" style={{ justifyContent: "center" }}>Let's Talk</span>
          <h2>Ready to fly, buy, ship, or get advice?</h2>
          <p>
            Tell us the mission and we'll route it to the right team — charter operations,
            acquisitions, cargo, or advisory — usually within one business day.
          </p>
          <div className="hero-ctas">
            <a href="#contact" className="btn btn-gold btn-lg">
              Request a Quote <ArrowRight size={16} />
            </a>
            <a href="tel:+13055550142" className="btn btn-ghost btn-lg">
              <Phone size={16} /> Call the Ops Desk
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactForm() {
  const [status, setStatus] = useState("idle");

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    const name = data.get("name") || "";
    const email = data.get("email") || "";
    const phone = data.get("phone") || "";
    const interest = data.get("interest") || "";
    const message = data.get("message") || "";

    const subject = `New inquiry: ${interest}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Interest: ${interest}`,
      "",
      message,
    ].join("\n");

    window.location.href = `mailto:charter@exjet.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setStatus("sent");
    form.reset();
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" name="name" type="text" required placeholder="Jane Carter" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required placeholder="jane@company.com" />
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" type="tel" placeholder="+1 (___) ___-____" />
        </div>
        <div className="field">
          <label htmlFor="interest">I'm interested in</label>
          <select id="interest" name="interest" defaultValue="On-Demand Charter & Jet Cards">
            <option>On-Demand Charter & Jet Cards</option>
            <option>Aircraft Acquisition, Sales & Dry Lease</option>
            <option>Cargo Charter, ACMI & Dry Lease</option>
            <option>Business Aviation Advisory</option>
            <option>Something else</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="message">Tell us about your mission</label>
        <textarea id="message" name="message" placeholder="Route, dates, aircraft type, or the transaction you have in mind..." />
      </div>
      <button type="submit" className="btn btn-gold" style={{ width: "100%" }}>
        Send Inquiry <ArrowRight size={16} />
      </button>
      {status === "sent" && (
        <p className="form-success">Opening your email client to send this inquiry to our team.</p>
      )}
      <p className="form-note">
        By submitting, you agree to be contacted by EXJET regarding your inquiry. We respond to
        most requests within one business day.
      </p>
    </form>
  );
}

function Contact() {
  return (
    <section className="section section-alt" id="contact">
      <div className="container">
        <div className="contact-grid">
          <div className="reveal">
            <span className="eyebrow">Get In Touch</span>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", color: "var(--ivory)", marginTop: 18 }}>
              One call routes to the right team.
            </h2>
            <p style={{ marginTop: 16, color: "var(--ivory-dim)", fontSize: 16, lineHeight: 1.7 }}>
              Charter and jet card requests are handled by our operations desk 24/7. Sales, cargo,
              and advisory inquiries are routed directly to a lead in that vertical.
            </p>
            <div className="contact-info-list">
              <div className="contact-info-item">
                <Phone />
                <div>
                  <h4>Operations Desk (24/7)</h4>
                  <a href="tel:+13055550142">+1 (305) 555-0142</a>
                </div>
              </div>
              <div className="contact-info-item">
                <Mail />
                <div>
                  <h4>Charter & Jet Cards</h4>
                  <a href="mailto:charter@exjet.com">charter@exjet.com</a>
                </div>
              </div>
              <div className="contact-info-item">
                <Mail />
                <div>
                  <h4>Aircraft Sales & Leasing</h4>
                  <a href="mailto:sales@exjet.com">sales@exjet.com</a>
                </div>
              </div>
              <div className="contact-info-item">
                <Mail />
                <div>
                  <h4>Cargo & ACMI</h4>
                  <a href="mailto:cargo@exjet.com">cargo@exjet.com</a>
                </div>
              </div>
              <div className="contact-info-item">
                <Mail />
                <div>
                  <h4>Advisory & Legal</h4>
                  <a href="mailto:advisory@exjet.com">advisory@exjet.com</a>
                </div>
              </div>
              <div className="contact-info-item">
                <MapPin />
                <div>
                  <h4>Headquarters</h4>
                  <p>Available worldwide — coordinated through our global operator network.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="reveal">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <a href="#top" className="brand">
              <BrandMark className="brand-mark" />
              <span>EXJET</span>
            </a>
            <p>
              A global business aviation partner spanning on-demand charter, aircraft sales,
              cargo capacity, and specialist advisory — represented by one accountable team.
            </p>
          </div>
          <div className="footer-col">
            <h5>Verticals</h5>
            <a href="#charter">Charter & Jet Cards</a>
            <a href="#aircraft-sales">Aircraft Sales & Leasing</a>
            <a href="#cargo">Cargo & ACMI</a>
            <a href="#advisory">Advisory</a>
          </div>
          <div className="footer-col">
            <h5>Company</h5>
            <a href="#top">About</a>
            <a href="#verticals-section">Capabilities</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="footer-col">
            <h5>Contact</h5>
            <a href="tel:+13055550142">+1 (305) 555-0142</a>
            <a href="mailto:charter@exjet.com">charter@exjet.com</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-legal">
            EXJET is an aviation charter broker and advisory firm. EXJET does not own or operate
            aircraft. All flights are performed by FAR Part 135 (or applicable foreign equivalent)
            air carriers, or by the aircraft owner under Part 91, arranged on behalf of clients.
            Aircraft sales, leasing, and advisory services are provided in a brokerage / advisory
            capacity; final terms are subject to applicable regulatory approval and definitive
            agreements.
          </p>
          <p className="footer-copy">© {new Date().getFullYear()} EXJET. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default function Exjet() {
  const ref = useReveal();
  return (
    <div className="exjet" ref={ref}>
      <Header />
      <Hero />
      <StatStrip />
      <Verticals />
      <Why />
      <Process />
      <CtaBanner />
      <Contact />
      <Footer />
    </div>
  );
}
