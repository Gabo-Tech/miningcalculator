import { component$, Slot } from "@builder.io/qwik";
import { SiteFooter } from "~/components/site-footer/site-footer";

export default component$(() => {
  return (
    <>
      <Slot />
      <SiteFooter />
    </>
  );
});
