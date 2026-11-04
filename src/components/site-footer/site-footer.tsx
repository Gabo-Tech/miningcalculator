import { component$ } from "@builder.io/qwik";
import { AUTHOR_NAME, AUTHOR_URL, SISTER_TOOLS } from "../../lib/seo/site";

export const SiteFooter = component$(() => {
  const year = new Date().getFullYear();

  return (
    <footer class="site-footer">
      <p class="credit-note">
        © {year} Mining Profit Lab · Built by{" "}
        <a href={AUTHOR_URL}>{AUTHOR_NAME}</a>
      </p>
      <ul class="sister-links">
        {SISTER_TOOLS.map((tool) => (
          <li key={tool.href}>
            <a href={tool.href}>{tool.name}</a>
          </li>
        ))}
      </ul>
    </footer>
  );
});
