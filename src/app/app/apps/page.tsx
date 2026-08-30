import { appsHub } from "@/lib/section-hubs";
import { SectionHub } from "@/components/SectionHub";

export default function AppsPage() {
  return (
    <SectionHub
      title="Apps"
      subtitle="Marketplace, files, and connections. Depth features live here instead of the sidebar."
      items={appsHub}
    />
  );
}
