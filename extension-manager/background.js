// Just for keyboard shortcut support
chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    // The popup will open automatically via manifest
    console.log('Extension Manager opened via keyboard shortcut');
  }
});