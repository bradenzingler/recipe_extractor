let button = document.getElementById('toggle-extension');
let extensionId = 'nmdejojdfbaibbdoddmhddmlhbpoelbn';

// disable the extension
button.addEventListener('click', () => {
        chrome.management.setEnabled(extensionId, false);
    });
