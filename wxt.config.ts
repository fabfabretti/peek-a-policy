import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  srcDir: "src",
  manifest: {
    permissions: ["webNavigation"],
    webAccessibleResources: [
      {
        resources: ["*"], // Include all files and folders in the public directory
        matches: ["<all_urls>"], // Allow access from all URLs within the extension
      },
    ],
  },
});
