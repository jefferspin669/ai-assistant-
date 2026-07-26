import Image from "next/image";
import Link from "next/link";
import { aiEmployees, roadmap } from "@/lib/data";

const modules = [
  {
    title: "Command Center",
    copy: "Open the app to a morning briefing, then type or speak what you need done.",
  },
  {
    title: "Specialized AI employees",
    copy: "Receptionist, Sales Manager, Scheduler, Marketing Manager, and Business Analyst — one assistant on the surface.",
  },
  {
    title: "Missed-call recovery",
    copy: "When nobody picks up, CallFlow texts instantly, collects job details and photos, and sends you everything.",
  },
  {
    title: "Act, don’t just report",
    copy: "Understand, recommend, and — with your permission — carry out routine work across connected systems.",
  },
  {
    title: "Smart oversight",
    copy: "Reminders and FAQs run automatically. Refunds, price changes, and mass campaigns wait for confirmation.",
  },
  {
    title: "Industry templates",
    copy: "Plumbing, HVAC, clinics, shops, and more — responses and workflows match how your business actually talks.",
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
          <a href="#converse">Conversation</a>
          <a href="#employees">AI Employees</a>
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
          <h1>Hire an AI Employee that helps run the business.</h1>
          <p>
            Not another dashboard to dig through — a teammate that briefs you, recommends the next
            move, and carries out the work.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/app">
              Open Command Center
            </Link>
            <Link className="btn btn-ghost" href="/onboarding">
              Start with your industry
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
              <h2>Many apps collect information. Fewer help you act.</h2>
              <p>
                CallFlow understands what’s happening, recommends what to do next, and — with your
                permission — gets the routine work done.
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

        <section className="section" id="converse" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>Just say what you need.</h2>
              <p>
                “How’s the business doing?” “Fill my Tuesday schedule.” “Move tomorrow’s jobs —
                it’s going to rain.”
              </p>
            </div>
            <div className="vision-chat">
              <div className="bubble bubble-user">How’s the business doing?</div>
              <div className="bubble bubble-ai">
                Revenue is up 12% from last month. You have five new leads, two overdue invoices
                totaling $1,850, and your conversion rate improved to 46%.
              </div>
              <div className="bubble bubble-user">Can you fill my Tuesday schedule?</div>
              <div className="bubble bubble-ai">
                I found six customers waiting for appointments. If I contact them, I estimate I can
                fill four of your six open time slots. Would you like me to proceed?
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="employees" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="sarah">
              <div>
                <h2>One assistant. A whole AI staff behind it.</h2>
                <p>
                  You talk naturally. Specialized employees handle reception, sales, scheduling,
                  marketing, and analysis — each with clear duties and oversight rules.
                </p>
                <Link className="btn btn-primary" href="/app/employees">
                  Meet the AI employees
                </Link>
              </div>
              <div className="sarah-card">
                <h3>Your roster</h3>
                <ul>
                  {aiEmployees.map((employee) => (
                    <li key={employee.id}>
                      {employee.emoji} {employee.name} — {employee.duties[0].toLowerCase()}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="roadmap" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>Add capabilities over time.</h2>
              <p>
                Start with missed-call recovery, then grow into a full AI employee that helps run
                the business — without trying to build everything at once.
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
          <h2>Good morning, Mike.</h2>
          <p>Your AI employees already handled overnight calls. What should they do next?</p>
          <Link className="btn btn-dark" href="/app">
            Enter Command Center
          </Link>
        </section>
      </main>

      <footer className="container footer">
        <span>CallFlow AI</span>
        <span>Understand. Recommend. Act — with oversight.</span>
      </footer>
    </div>
  );
}
