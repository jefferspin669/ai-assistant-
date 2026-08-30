import Image from "next/image";
import Link from "next/link";

const outcomes = [
  { title: "Answer every call", body: "Atlas picks up, recognizes the customer, and books the job." },
  { title: "Never lose a lead", body: "Missed calls get a follow-up instead of going cold." },
  { title: "Keep the schedule full", body: "Cancellations open a slot. Atlas fills it from the waitlist." },
  { title: "Know your numbers", body: "Home shows revenue, jobs, and tasks — labeled LIVE, CONNECTED, or DEMO." },
  { title: "Automate repetitive work", body: "You approve the risky ones. Atlas handles the rest." },
];

export default function HomePage() {
  return (
    <div>
      <nav className="site-nav" aria-label="Primary">
        <Link href="/" className="logo">
          Atlas
        </Link>
        <div className="site-nav-links">
          <a href="#product">Product</a>
          <Link href="/login">Sign in</Link>
          <Link className="btn btn-primary" href="/signup">
            Create account
          </Link>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-media" aria-hidden="true">
          <Image
            src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=2400&q=80"
            alt=""
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="container hero-content">
          <p className="brand-mark">Atlas</p>
          <h1>Your business, run with AI.</h1>
          <p>
            Atlas answers customers, books appointments, follows up on leads, manages work, and
            tells you what needs your attention.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/signup">
              Create your account
            </Link>
            <Link className="btn btn-ghost" href="/app">
              See the product
            </Link>
          </div>
          <div className="exchange" aria-label="Atlas examples">
            <div className="exchange-line exchange-owner">“Can you take the next call?”</div>
            <div className="exchange-line exchange-reply">
              “Yes. I’ll recognize them, check the calendar, and book it.”
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="section" id="product">
          <div className="container">
            <div className="section-head">
              <h2>Built for shops that live on the phone</h2>
              <p>
                Start with an AI receptionist and scheduling. Everything else in Atlas sits behind
                that loop — not in front of it.
              </p>
            </div>
            <div className="module-grid">
              {outcomes.map((item) => (
                <article className="module" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>One conversation with the owner</h2>
              <p>Ask Atlas. Confirm the action. Watch Home, Calendar, and Tasks update.</p>
            </div>
            <div className="vision-chat">
              <div className="bubble bubble-user">How did we do this week?</div>
              <div className="bubble bubble-ai">
                I’ll answer from your books and calendar — and I’ll label anything that is still DEMO
                until a bank or phone is connected.
              </div>
              <div className="bubble bubble-user">Move John’s 2 PM to tomorrow.</div>
              <div className="bubble bubble-ai">
                Calendar updates here. Customer and technician texts wait on a real phone connection.
              </div>
            </div>
            <div style={{ marginTop: "1.25rem" }}>
              <Link className="btn btn-dark" href="/app">
                Open Atlas
              </Link>
            </div>
          </div>
        </section>

        <section className="container final-cta">
          <h2>Every business deserves an intelligent workforce, regardless of its size.</h2>
          <p>Start with calls and the calendar. Grow from there.</p>
          <Link className="btn btn-dark" href="/signup">
            Create your account
          </Link>
        </section>
      </main>

      <footer className="container footer">
        <span>Atlas — your business, run with AI</span>
        <span>Receptionist first. Operating system later.</span>
      </footer>
    </div>
  );
}
