import { AppShell } from "@/components/AppShell";
import { reviews } from "@/lib/data";

export default function ReviewsPage() {
  return (
    <AppShell
      title="Review Manager"
      subtitle="After every completed job, automatically ask for the review."
    >
      <div className="stat-grid">
        <div className="stat">
          <span>Google Reviews</span>
          <strong>128</strong>
          <small>4.9 average</small>
        </div>
        <div className="stat">
          <span>Facebook Reviews</span>
          <strong>46</strong>
          <small>4.8 average</small>
        </div>
        <div className="stat">
          <span>Average rating</span>
          <strong>4.9</strong>
          <small>Last 90 days</small>
        </div>
        <div className="stat">
          <span>Response rate</span>
          <strong>92%</strong>
          <small>Request → review</small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Automatic ask</h2>
          <div className="quote-preview">
            <p>Thanks for choosing us!</p>
            <p className="stars">★★★★★ Leave a review.</p>
            <p style={{ color: "var(--ink-soft)", marginTop: "0.6rem" }}>
              Sent by text after job completion. Follow-up once if no review in 48 hours.
            </p>
          </div>
        </section>

        <section className="panel">
          <h2>Latest reviews</h2>
          <div className="list">
            {reviews.map((review) => (
              <div className="list-row" key={review.author + review.text}>
                <span className="badge">{review.source}</span>
                <div>
                  <div className="stars">{"★".repeat(review.rating)}</div>
                  <p>{review.text}</p>
                  <small style={{ color: "var(--ink-soft)" }}>{review.author}</small>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
