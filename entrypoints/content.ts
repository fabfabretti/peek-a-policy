export default defineContentScript({
  matches: ["https://*.example.com/*", "http://example.org/*"],
  main() {
    console.log("Hello content.");
  },
});
