export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });

  browser.webNavigation.onCompleted.addListener((details) => {
    console.log("Page loaded");
  });
});
