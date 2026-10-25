/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

// Em ambientes que bloqueiam o download do Chromium do Remotion, usa o headless shell local se existir
import { existsSync, readdirSync } from "node:fs";
const pw = "/opt/pw-browsers";
if (existsSync(pw)) {
  const shell = readdirSync(pw).find((d) => d.startsWith("chromium_headless_shell"));
  if (shell) Config.setBrowserExecutable(`${pw}/${shell}/chrome-linux/headless_shell`);
}
