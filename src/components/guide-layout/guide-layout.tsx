import { component$, Slot } from "@builder.io/qwik";
import { SiteFooter } from "../site-footer/site-footer";

export const GuideLayout = component$<{ title: string; eyebrow: string }>(
  ({ title, eyebrow }) => {
    return (
      <main class="page guide-page">
        <header class="guide-top">
          <a class="hero-brand" href="/">
            Mining Profit Lab
          </a>
          <nav aria-label="Guide">
            <a href="/">Calculator</a>
            <a href="/#coin-guides">All guides</a>
          </nav>
        </header>
        <article class="card section-flow">
          <p class="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <Slot />
        </article>
        <SiteFooter />
      </main>
    );
  },
);
