import { component$, useSignal } from "@builder.io/qwik";
import { type DocumentHead } from "@builder.io/qwik-city";
import { CopySnippet } from "../../components/copy-snippet/copy-snippet";
import { SiteFooter } from "../../components/site-footer/site-footer";
import { SiteHeader } from "../../components/site-header/site-header";
import {
  EMBED_PAGE_DESCRIPTION,
  EMBED_PAGE_PATH,
  EMBED_PAGE_TITLE,
  EMBED_SIZES,
  EMBED_THEMES,
  INDEX_PATH,
  buildEmbedSnippet,
  embedFrameSrc,
  embedPreviewPath,
  type EmbedSize,
  type EmbedTheme,
} from "../../lib/seo/resources";
import { absoluteUrl, pageMeta } from "../../lib/seo/site";

export default component$(() => {
  const theme = useSignal<EmbedTheme>("auto");
  const sizeId = useSignal<EmbedSize["id"]>("standard");
  const size =
    EMBED_SIZES.find((item) => item.id === sizeId.value) ?? EMBED_SIZES[1];
  const snippet = buildEmbedSnippet(theme.value, size);
  const previewSrc = embedPreviewPath(theme.value);

  return (
    <main class="page guide-page">
      <SiteHeader />
      <article class="card section-flow">
        <p class="eyebrow">For crypto blogs and comparison posts</p>
        <h1>Embed this mining profit calculator</h1>
        <p>
          Give readers a live Bitcoin ASIC profit check without sending them
          away. The widget is one iframe: it does not set cookies, load
          analytics, or change the styles on your page. Paste the snippet as
          written, including the sentence under the iframe. That sentence is a
          normal followed link to Mining Profit Lab.
        </p>
        <div>
          <p class="embed-option-label">Theme</p>
          <div class="chip-row" role="group" aria-label="Theme">
            {EMBED_THEMES.map((item) => (
              <button
                key={item}
                type="button"
                class={theme.value === item ? "chip active" : "chip"}
                aria-pressed={theme.value === item}
                data-theme={item}
                onClick$={(_, el) => {
                  const next = el.dataset.theme;
                  if (next === "auto" || next === "light" || next === "dark")
                    theme.value = next;
                }}
              >
                {item === "auto" ? "Auto" : item === "light" ? "Light" : "Dark"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p class="embed-option-label">Size</p>
          <div class="chip-row" role="group" aria-label="Size">
            {EMBED_SIZES.map((item) => (
              <button
                key={item.id}
                type="button"
                class={sizeId.value === item.id ? "chip active" : "chip"}
                aria-pressed={sizeId.value === item.id}
                data-size={item.id}
                onClick$={(_, el) => {
                  const next = el.dataset.size;
                  if (
                    next === "compact" ||
                    next === "standard" ||
                    next === "wide"
                  )
                    sizeId.value = next;
                }}
              >
                {item.label} · {item.maxWidth}px
              </button>
            ))}
          </div>
        </div>
        <div>
          <p class="embed-option-label">Live preview</p>
          <figure class="embed-preview">
            <iframe
              src={previewSrc}
              title="Mining Profit Lab mining profit calculator preview"
              style={{
                width: "100%",
                maxWidth: `${size.maxWidth}px`,
                height: `${size.height}px`,
                border: "0",
              }}
              loading="eager"
            />
            <figcaption>
              <p>
                Powered by <a href={absoluteUrl("/")}>Mining Profit Lab</a>
              </p>
            </figcaption>
          </figure>
        </div>
        <CopySnippet
          key={snippet}
          id="embed-snippet"
          label="Embed code"
          value={snippet}
          buttonLabel="Copy embed code"
          rows={5}
        />
        <p>
          The snippet always points at {embedFrameSrc(theme.value)} so it keeps
          working after you paste it onto your site. Auto theme follows the
          reader&apos;s light or dark setting. Leave the credit paragraph
          outside the iframe.
        </p>
        <p class="guide-actions">
          <a class="btn" href="/">
            Open the full calculator
          </a>
          <a class="btn btn-ghost" href={INDEX_PATH}>
            Bitcoin mining profitability index
          </a>
        </p>
      </article>
      <SiteFooter />
    </main>
  );
});

export const head: DocumentHead = pageMeta({
  title: EMBED_PAGE_TITLE,
  description: EMBED_PAGE_DESCRIPTION,
  pathname: EMBED_PAGE_PATH,
});
