import { component$ } from "@builder.io/qwik";
import { AUTHOR_NAME, AUTHOR_URL, SISTER_TOOLS } from "../../lib/seo/site";

/**
 * Launch badges. Hrefs match the provider embed snippets exactly.
 * Uneed uses the dark badge so it sits on the dark footer.
 */
export const SiteFooter = component$(() => {
  const year = new Date().getFullYear();

  return (
    <footer class="site-footer">
      <div class="featured-on">
        <p class="featured-on-label" id="featured-on-label">
          Featured on
        </p>
        <ul class="featured-on-row" aria-labelledby="featured-on-label">
          <li>
            <a href="https://tinylaunch.com" target="_blank" rel="noopener">
              <img
                src="https://tinylaunch.com/tinylaunch_badge_launching_soon.svg"
                alt="TinyLaunch Badge"
                width={619}
                height={188}
                loading="lazy"
                style={{ width: "202px", height: "auto" }}
              />
            </a>
          </li>
          <li>
            <a
              href="https://launch-list.org/product/mining-profit-lab"
              target="_blank"
              style={{ display: "block", width: "fit-content" }}
            >
              <img
                src="https://launch-list.org/badges/svg/launch_list_badge_featured.svg"
                alt="Launch List Badge"
                width={260}
                height={85}
                loading="lazy"
                style={{ height: "50px", width: "auto" }}
              />
            </a>
          </li>
          <li>
            <a
              href="https://www.uneed.best/tool/mining-profit-lab"
              target="_blank"
              rel="noopener"
            >
              <img
                src="https://www.uneed.best/EMBED3.png"
                alt="Launching Soon on Uneed"
                width={582}
                height={152}
                loading="lazy"
                style={{ width: "250px", height: "auto" }}
              />
            </a>
          </li>
          <li>
            <a href="https://fazier.com" target="_blank">
              <img
                src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=launched&theme=light"
                alt="Fazier badge"
                width={103}
                height={44}
                loading="lazy"
                style={{ width: "120px", height: "auto" }}
              />
            </a>
          </li>
        </ul>
      </div>
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
