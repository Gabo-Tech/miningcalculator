import { component$ } from "@builder.io/qwik";
import { useDocumentHead, useLocation } from "@builder.io/qwik-city";
import { absoluteUrl } from "../../lib/seo/site";

export const RouterHead = component$(() => {
  const head = useDocumentHead();
  const loc = useLocation();
  const canonicalUrl = absoluteUrl(loc.url.pathname);
  const hasRobotsMeta = head.meta.some((meta) => meta.name === "robots");

  return (
    <>
      <title>{head.title}</title>

      <link rel="canonical" href={canonicalUrl} />
      {!hasRobotsMeta && (
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
      )}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

      {head.meta.map((m) => {
        const { key, ...props } = m;
        return <meta key={key} {...props} />;
      })}

      {head.links.map((l) => {
        const { key, ...props } = l;
        return <link key={key} {...props} />;
      })}

      {head.styles.map((s) => (
        <style
          key={s.key}
          {...s.props}
          {...(s.props?.dangerouslySetInnerHTML
            ? {}
            : { dangerouslySetInnerHTML: s.style })}
        />
      ))}

      {head.scripts.map((s) => (
        <script
          key={s.key}
          {...s.props}
          {...(s.props?.dangerouslySetInnerHTML
            ? {}
            : { dangerouslySetInnerHTML: s.script })}
        />
      ))}
    </>
  );
});
