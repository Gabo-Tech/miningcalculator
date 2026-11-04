import { component$ } from "@builder.io/qwik";
import { EMBED_PAGE_PATH, INDEX_PATH } from "../../lib/seo/resources";

export const SiteHeader = component$(() => {
  return (
    <header class="guide-top">
      <a class="hero-brand" href="/">
        Mining Profit Lab
      </a>
      <nav aria-label="Primary">
        <a href="/">Calculator</a>
        <a href="/#coin-guides">Guides</a>
        <a href={INDEX_PATH}>BTC index</a>
        <a href={EMBED_PAGE_PATH}>Embed</a>
      </nav>
    </header>
  );
});
