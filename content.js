chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureScreenshot') {
    html2canvas(document.body).then(canvas => {
      sendResponse({screenshot: canvas.toDataURL()});
    });
    return true;
  }
});