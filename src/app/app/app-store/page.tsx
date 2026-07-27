import { FeatureView } from "@/components/FeatureView";
import { appStoreModules } from "@/lib/atlas-platform";

export default function AppStorePage() {
  return (
    <FeatureView
      title="Atlas App Store"
      subtitle="Third-party developers publish modules — businesses install only what they need."
      sections={[
        {
          type: "custom",
          node: (
            <div className="pack-grid">
              {appStoreModules.map((mod) => (
                <section className="panel" key={mod.name}>
                  <h2>{mod.name}</h2>
                  <p className="panel-lead">{mod.blurb}</p>
                  <div className="list-row">
                    <span className="badge ok">{mod.installs} installs</span>
                    <button className="btn btn-outline">Install</button>
                  </div>
                </section>
              ))}
            </div>
          ),
        },
      ]}
    />
  );
}
