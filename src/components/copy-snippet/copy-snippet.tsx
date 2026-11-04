import { component$, useSignal, $ } from "@builder.io/qwik";

export const CopySnippet = component$<{
  id: string;
  label: string;
  value: string;
  buttonLabel: string;
  rows?: number;
}>(({ id, label, value, buttonLabel, rows = 4 }) => {
  const status = useSignal("");
  const markCopied = $(() => {
    status.value = "Copied";
  });
  const markManual = $(() => {
    status.value = "Snippet selected. Copy it with your browser.";
  });

  return (
    <div class="cite-box">
      <label for={id}>{label}</label>
      <textarea
        id={id}
        class="snippet-field"
        readOnly
        rows={rows}
        value={value}
        spellcheck={false}
      />
      <div class="guide-actions">
        <button
          class="btn"
          type="button"
          onClick$={async (event) => {
            const root = (event.target as HTMLElement).closest(".cite-box");
            const area = root?.querySelector("textarea");
            const text = area?.value ?? "";
            try {
              await navigator.clipboard.writeText(text);
              await markCopied();
            } catch {
              area?.focus();
              area?.select();
              const copied = document.execCommand("copy");
              if (copied) await markCopied();
              else await markManual();
            }
          }}
        >
          {buttonLabel}
        </button>
        <span role="status">{status.value}</span>
      </div>
    </div>
  );
});
