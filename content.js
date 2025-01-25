chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  
  if (request.type === 'navigate') {
    window.location.href = request.url;
    sendResponse({success: true});
    return true;
  }
  
  sendResponse({error: 'Unknown action'});
  return true;
});