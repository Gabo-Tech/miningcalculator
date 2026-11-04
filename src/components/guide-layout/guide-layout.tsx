import { component$, Slot } from "@builder.io/qwik";
import { SiteFooter } from "../site-footer/site-footer";
import { SiteHeader } from "../site-header/site-header";

export const GuideLayout = component$<{ title: string; eyebrow: string }>(
  ({ title, eyebrow }) => {
    return (
      <main class="page guide-page">
        <SiteHeader />
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
