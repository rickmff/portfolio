import { createFlagsDiscoveryEndpoint } from "flags/next";
import { getProviderData } from "@flags-sdk/vercel";
import * as flags from "@/flags";

// Flags Explorer (Vercel Toolbar) reads the app's flags from here; requests are verified with FLAGS_SECRET.
export const GET = createFlagsDiscoveryEndpoint(async () => getProviderData(flags));
