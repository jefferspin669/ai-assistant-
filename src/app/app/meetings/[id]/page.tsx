import { MeetingDetailClient } from "./MeetingDetailClient";

// Meetings are stored client-side (localStorage) with runtime-generated ids, so
// there are no stable ids to prerender. We emit a single placeholder shell to
// satisfy `output: export`; real ids are resolved on the client via useParams,
// and detail pages are reached through client-side navigation from the list.
export function generateStaticParams() {
  return [{ id: "demo" }];
}

export default function MeetingDetailPage() {
  return <MeetingDetailClient />;
}
