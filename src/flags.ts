import { flag } from "flags/next";
import { vercelAdapter } from "@flags-sdk/vercel";

/**
 * Feature flags, served by Vercel Flags (project rickmffs-projects/portfolio).
 * Values are switched per environment in the Vercel dashboard or with `vercel flags`, no redeploy.
 * Off Vercel (the VPS) there is no OIDC token, evaluation fails and each flag serves its
 * `defaultValue`, so the site behaves exactly as before the flag existed.
 */

/** The GitHub activity section (contribution graph) at the bottom of the home page. */
export const githubFlag = flag<boolean>({
  key: "Github",
  description: "Show the GitHub activity section on the home page",
  defaultValue: true,
  options: [
    { value: false, label: "Off" },
    { value: true, label: "On" },
  ],
  adapter: vercelAdapter,
});
