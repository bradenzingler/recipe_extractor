/**
 * This file is used to handle the state behavior of the popup.html file.
 * It handles the settings switches and the toggle button for the extension.
 */
document.addEventListener('DOMContentLoaded', function() {


    /***************** Settings for toggling the extension *************/
    let button = document.getElementById('toggle-extension');
    // restore the state of the button
    chrome.storage.sync.get('enabled', function(data) {
        button.textContent = data.enabled ? 'Enabled' : 'Disabled';
        button.style.backgroundColor = data.enabled ? 'green' : 'red';
    });
    // add listener for the button
    button.addEventListener('click', () => {
        button.textContent = button.textContent === 'Enabled' ? 'Disabled' : 'Enabled';
        button.style.backgroundColor = button.textContent === 'Enabled' ? 'green' : 'red';
        chrome.storage.sync.set({enabled: button.textContent === 'Enabled'});
    });


    /******************** Settings for night mode *******************/
    let nightMode = document.querySelector('#night-mode');
    // save the state of the immediatePopup if it changes
    nightMode.addEventListener('change', function() {        
        chrome.storage.sync.set({nightMode: nightMode.checked});
    });
    // check the box if nightmode is true, restore the state
    chrome.storage.sync.get('nightMode', function(data) {
        nightMode.checked = data.nightMode;
        document.body.style.backgroundColor = nightMode.checked ? '#333' : 'white';
        document.body.style.color = nightMode.checked ? 'white' : '#333';
    });
    // Add listener for night mode changes
    chrome.storage.onChanged.addListener(function(changes, namespace){
        document.body.style.backgroundColor = nightMode.checked ? '#333' : 'white';
        document.body.style.color = nightMode.checked ? 'white' : '#333';
    });


});

