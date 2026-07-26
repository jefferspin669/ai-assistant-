import Image from "next/image";
import Link from "next/link";
import { roadmap } from "@/lib/data";

const modules = [
  {
    title: "AI Receptionist",
    copy: "Answers like your shop — books, transfers urgent calls, collects info, texts customers, and schedules callbacks.",
  },
  {
    title: "Missed Calls",
    copy: "When nobody picks up, CallFlow texts instantly, collects the job details and photos, and sends you everything.",
  },
  {
    title: "Website Chatbot",
    copy: "Answers prices, hours, services, and FAQs. If it can’t help, it captures a lead instead of losing the visit.",
  },
  {
    title: "Appointments",
    copy: "Drag-and-drop calendar, staff schedules, Google sync, reminders, rescheduling, and no-show tracking.",
  },
  {
    title: "Customer CRM",
    copy: "Every customer profile stores calls, messages, quotes, jobs, payments, photos, and notes.",
  },
  {
    title: "AI Quotes",
    copy: "Type the job. Get a professional estimate, export to PDF, and collect an electronic signature.",
  },
  {
    title: "Review Manager",
    copy: "After every completed job, automatically ask for the review — then track Google, Facebook, and response rate.",
  },
  {
    title: "Marketing Center",
    copy: "Send promotions, holiday specials, coupons, reminders, and birthday discounts from one place.",
  },
  {
    title: "Analytics + AI Insights",
    copy: "Charts for revenue and leads — plus advice like when you’re missing calls and which days make more money.",
  },
];

export default function HomePage() {
  return (
    <div>
      <nav className="site-nav" aria-label="Primary">
        <Link href="/" className="logo">
          CallFlow <span>AI</span>
        </Link>
        <div className="site-nav-links">
          <a href="#product">Product</a>
          <a href="#roadmap">Roadmap</a>
          <a href="#sarah">AI Employee</a>
          <Link className="btn btn-primary" href="/onboarding">
            Hire your AI Employee
          </Link>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-media" aria-hidden="true">
          <Image
            src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=2400&q=80"
            alt=""
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="container hero-content">
          <p className="brand-mark">
            CallFlow <span>AI</span>
          </p>
          <h1>Hire an AI Employee for your front desk.</h1>
          <p>
            One login. One screen. Reception, missed calls, booking, quotes, reviews, and follow-up —
            without hiring another person.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/onboarding">
              Start with your industry
            </Link>
            <Link className="btn btn-ghost" href="/app">
              Open the dashboard
            </Link>
          </div>
          <div className="exchange" aria-label="Product pitch">
            <div className="exchange-line exchange-owner">
              “I can’t afford another employee.”
            </div>
            <div className="exchange-line exchange-reply">
              “You don’t need one. Hire an AI Employee.”
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="section" id="product">
          <div className="container">
            <div className="section-head">
              <h2>Everything on one dashboard.</h2>
              <p>
                When owners log in, they see today’s activity — calls answered, missed calls recovered,
                leads, bookings, revenue estimate, conversations, and reviews.
              </p>
            </div>
            <div className="module-grid">
              {modules.map((module) => (
                <article className="module" key={module.title}>
                  <h3>{module.title}</h3>
                  <p>{module.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="sarah" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="sarah">
              <div>
                <h2>Meet Sarah — your AI employee.</h2>
                <p>
                  Not another software tab. A teammate that answers 24/7, books appointments, sends
                  invoices, follows up, collects payments, and learns your business over time.
                </p>
                <Link className="btn btn-primary" href="/onboarding">
                  Put Sarah on your roster
                </Link>
              </div>
              <div className="sarah-card">
                <h3>Sarah</h3>
                <p style={{ color: "rgba(244,248,247,0.75)" }}>AI Employee · Smith Plumbing</p>
                <ul>
                  <li>Answers calls 24/7</li>
                  <li>Books appointments</li>
                  <li>Sends invoices</li>
                  <li>Follows up with customers</li>
                  <li>Collects payments</li>
                  <li>Learns the business over time</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="roadmap" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>Built in the right order.</h2>
              <p>
                Start with missed-call recovery — the moment revenue leaks — then expand into the full
                AI employee stack.
              </p>
            </div>
            <div className="roadmap">
              {roadmap.map((item, index) => (
                <div className="road-item" key={item}>
                  <span>Step {index + 1}</span>
                  <strong>{item}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container final-cta">
          <h2>You don’t need another hire.</h2>
          <p>You need an AI Employee that never misses the front desk.</p>
          <Link className="btn btn-dark" href="/onboarding">
            Hire CallFlow AI
          </Link>
        </section>
      </main>

      <footer className="container footer">
        <span>CallFlow AI</span>
        <span>From CallbackFlow roots — built for local businesses.</span>
      </footer>
    </div>
  );
}
