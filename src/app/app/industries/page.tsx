"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/components/LanguageProvider";
import { industryPacks as catalogPacks } from "@/lib/data";
import {
  addTemplateToPack,
  createIndustryPack,
  loadIndustryPacks,
  saveIndustryPacks,
  type IndustryPack,
} from "@/lib/user-workspace";

export default function IndustriesPage() {
  const { t } = useLanguage();
  const [packs, setPacks] = useState<IndustryPack[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📦");
  const [blurb, setBlurb] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [newTplName, setNewTplName] = useState("");
  const [newTplBody, setNewTplBody] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadIndustryPacks();
    setPacks(loaded);
    setSelectedId(loaded[0]?.id ?? null);
    setReady(true);
  }, []);

  const selected = packs.find((pack) => pack.id === selectedId) ?? null;

  function persist(next: IndustryPack[]) {
    setPacks(next);
    saveIndustryPacks(next);
  }

  function addFromCatalog(item: { name: string; emoji: string }) {
    if (packs.some((pack) => pack.name.toLowerCase() === item.name.toLowerCase())) {
      setNote(`“${item.name}” is already in your packs.`);
      return;
    }
    const pack = createIndustryPack({
      name: item.name,
      emoji: item.emoji,
      templateName: `${item.name} FAQ`,
      templateBody: `Common questions, pricing language, and booking rules for ${item.name}.`,
    });
    const next = [pack, ...packs];
    persist(next);
    setSelectedId(pack.id);
    setNote(`Added “${item.name}” pack with a starter template.`);
  }

  function onCreate(e: FormEvent) {
    e.preventDefault();
    const pack = createIndustryPack({
      name,
      emoji,
      blurb,
      templateName,
      templateBody,
    });
    const next = [pack, ...packs];
    persist(next);
    setSelectedId(pack.id);
    setName("");
    setBlurb("");
    setTemplateName("");
    setTemplateBody("");
    setNote(`Created “${pack.name}”.`);
  }

  function onAddTemplate(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const next = addTemplateToPack(packs, selected.id, {
      name: newTplName,
      body: newTplBody,
    });
    persist(next);
    setNewTplName("");
    setNewTplBody("");
    setNote(`Template added to “${selected.name}”.`);
  }

  function removePack(id: string) {
    const next = packs.filter((pack) => pack.id !== id);
    persist(next);
    setSelectedId(next[0]?.id ?? null);
    setNote("Pack removed.");
  }

  return (
    <AppShell
      title="Industry Packs"
      subtitle="Add specialized knowledge packs and templates — not one generic AI for everyone."
    >
      <section className="panel">
        <h2>Catalog — add to your business</h2>
        <p className="panel-lead">Start empty. Click Add pack to install into your library.</p>
        <div className="pack-grid dense">
          {catalogPacks.map((pack) => (
            <article className="panel pack-card" key={pack.name}>
              <span className="employee-emoji" aria-hidden="true">
                {pack.emoji}
              </span>
              <h2>{pack.name}</h2>
              <p style={{ color: "var(--ink-soft)" }}>
                Pricing language, FAQs, booking rules, compliance cues, and templates tuned for{" "}
                {pack.name.toLowerCase()}.
              </p>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => addFromCatalog(pack)}
              >
                Add pack
              </button>
            </article>
          ))}
        </div>
      </section>

      <div className="split">
        <section className="panel">
          <h2>Create a pack</h2>
          <form className="form-grid" onSubmit={onCreate}>
            <label>
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Roofing"
                required
              />
            </label>
            <label>
              Emoji
              <input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} />
            </label>
            <label>
              Description
              <input
                value={blurb}
                onChange={(e) => setBlurb(e.target.value)}
                placeholder="Estimates, warranties, storm season FAQs…"
              />
            </label>
            <label>
              Starter template name
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Estimate script"
              />
            </label>
            <label>
              Template body
              <textarea
                value={templateBody}
                onChange={(e) => setTemplateBody(e.target.value)}
                rows={3}
                placeholder="What techs should say / send…"
              />
            </label>
            <button className="btn btn-dark" type="submit">
              {t("common.add")} pack
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Your packs ({packs.length})</h2>
          {!ready ? <p className="muted-line">Loading…</p> : null}
          {ready && packs.length === 0 ? (
            <p className="muted-line">{t("common.empty")}</p>
          ) : (
            <div className="list">
              {packs.map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  className={selectedId === pack.id ? "compliance-row active" : "compliance-row"}
                  onClick={() => setSelectedId(pack.id)}
                >
                  <span className="badge">{pack.emoji}</span>
                  <div>
                    <p>
                      <strong>{pack.name}</strong>
                    </p>
                    <small className="muted-line">
                      {pack.templates.length} template{pack.templates.length === 1 ? "" : "s"}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          )}
          {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
        </section>
      </div>

      {selected ? (
        <section className="panel">
          <div className="train-head">
            <div>
              <h2>
                {selected.emoji} {selected.name}
              </h2>
              <p className="panel-lead">{selected.blurb}</p>
            </div>
            <button className="btn btn-outline" type="button" onClick={() => removePack(selected.id)}>
              {t("common.remove")}
            </button>
          </div>

          <h3>Templates</h3>
          {selected.templates.length === 0 ? (
            <p className="muted-line">No templates yet — add one below.</p>
          ) : (
            <div className="list" style={{ marginTop: "0.5rem" }}>
              {selected.templates.map((tpl) => (
                <div className="list-row" key={tpl.id}>
                  <span className="badge ok">Template</span>
                  <div>
                    <p>
                      <strong>{tpl.name}</strong>
                    </p>
                    <small className="muted-line">{tpl.body}</small>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form className="form-grid" style={{ marginTop: "1rem" }} onSubmit={onAddTemplate}>
            <label>
              Template name
              <input
                value={newTplName}
                onChange={(e) => setNewTplName(e.target.value)}
                placeholder="Refund script"
                required
              />
            </label>
            <label>
              Template content
              <textarea
                value={newTplBody}
                onChange={(e) => setNewTplBody(e.target.value)}
                rows={3}
                required
              />
            </label>
            <button className="btn btn-dark" type="submit">
              Add template
            </button>
          </form>
        </section>
      ) : null}
    </AppShell>
  );
}
