/**
 * This file contains the content script that is injected into the webpage to allow 
 * the user to extract the recipe from the current webpage.
 * 
 * Author: Braden Zingler
 * Email: bgzingler@wisc.edu
 * Last updated: 2/12/2024
 */
var nightMode = false;
var enabled = false;
var blacklist;
var ignored = ['recipe-extractor-button', 'button-container', 'recipe-text', 'icon-img', 'recipe-close-button', 'recipe-overlay'];

/* instructions selectors */
recipe_selectors = [
    '.wprm-recipe-ingredient',          // damndelicious.net ingredients
    '.wprm-recipe-instruction',         // damndelicious.net instructions
    '.ingredient-lists',                // delish.com ingredients
    '.directions > li > ol > li',       // delish.com instructions
    '.ingredients',
    '.recipe-ingredients',
    '.instructions',
    '.mntl-structured-ingredients', 
    '.recipe__ingredients',
    '#zrdn-recipe-container',
    '#tasty-recipes-70437',
    '.recipe__instructions',
    '.recipe-directions',
    '.mntl-recipe-steps',
    '.Wrapper-dxnTBC',
    '.InstructionListWrapper-dcpygI',
    '#structured-ingredients_1-0',      // simplyrecipes.com ingredients
    '#structured-project__steps_1-0',   // simplyrecipes.com instructions
    '.o-Ingredients__m-Body',           // foodnetwork.com ingredients
    '#mod-recipe-method-1',             // foodnetwork.com instructions
];
/* ingredients selectors */
ingr_selectors = [

];


// Initial loading of page 
chrome.storage.sync.get('blacklist', function(data) {
    blacklist = data.blacklist;
    // Fetch the toggle state from storage
    chrome.storage.sync.get('enabled', function(data) {
        enabled = data.enabled;
        // Check if the extension is enabled and it's a recipe page
        if (enabled && isRecipePage()) {
            // Restore nightMode setting
            chrome.storage.sync.get(['nightMode'], function (result) {
                nightMode = result.nightMode;
                nightMode ? updateNightMode(nightMode) : updateNightMode(false);
            });
            
            // Restore immediatePopup setting
            chrome.storage.sync.get(['immediatePopup'], function (result) {
                // if immediatePopup is true, give a second for all elements to load
                result.immediatePopup ? (setTimeout(() => showRecipe(), 0)) : showButton();
            });
        }
    });
});


/************** EVENT LISTENERS ******************/
// Add listener for toggle changes
chrome.storage.onChanged.addListener(function(changes, namespace){
    if (changes.enabled) toggleExtension(changes.enabled.newValue);    
});

// Add listener for night mode changes only if it is a recipe page
chrome.storage.onChanged.addListener(function(changes, namespace){
    if (changes.nightMode && isRecipePage()) updateNightMode(changes.nightMode.newValue);    
});
/************** END EVENT LISTENERS **************/


/* This function handles changes in night mode settings */
function updateNightMode(newValue) {
    // Update nightMode setting
    nightMode = newValue;
    let elements = document.querySelectorAll('*');

    // Apply night-mode styles
    elements.forEach(element => {
        if (!ignored.includes(element.id)) {
            element.style.backgroundColor = (nightMode && enabled) ? '#333' : 'white';
            element.style.color = (nightMode && enabled) ? 'white' : '#333';
        }
    });
}


/* This function handles changes in extension visibility settings */
function toggleExtension(newValue) {
    enabled = newValue;
    if (isRecipePage() && enabled) {
        showButton();
        // Restore night mode
        chrome.storage.sync.get(['nightMode'], function (result) {
            nightMode = result.nightMode;
            nightMode ? updateNightMode(nightMode) : updateNightMode(false);
        });
    } else if(document.getElementById('recipe-popup')) {
        // popup is up and the extension is disabled
        document.getElementById('recipe-popup') ? closePopup() : document.getElementById('recipe-popup');
        updateNightMode(nightMode);
        document.getElementById('recipe-extractor-button').remove();
    } else {
        updateNightMode(nightMode);
        document.getElementById('recipe-extractor-button').remove();
    }
}


/* This function adds a button to show the recipe*/
function showButton() {
    if (document.getElementById('recipe-extractor-button')) return;

    let button = document.createElement('button');
    button.id = 'recipe-extractor-button';
    button.draggable = 'true';
    let base64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAC/VBMVEVHcEzKoX0IBgTJoHyEVSil7kzWwrDJoHzmSzvj4+PTsZTOrZADAgHTsZMFBAPEm3jTsZPKon8FAQENBAPAmXcCAACne1LjSjum7kzLpIG9l3XMpoPLo4DNpoTSr5DLpIHOqIjPq4vKoX4AAACqiGnSsJHQrIzJqIvSr5DTsZTQq4vNpoQXDgrQq4vQq4vLo4DUspXKoX7Sr5HUs5bRrY7TsZTUs5bSsJLRrY7TsZTUs5bUspXQsJXIoHwAAACYeF0AAABrVUIIBgWui2y2kXGUMCY6LiTDsqTJoXyFxwi/mHaFVim4x2VIGBKm7EwBAAAAAAAmDAlyJR0AAABaHRfRrY67nIE1KiElHhfQrI04LCJ6YUuriGorIhvCm3gDAgLNq4/Qq4zUs5ZvWETTsZSTdVvTsZPUs5Z3X0odFxI4LCJMPC8/MielOCx3XknRs5mWd1yKblXQq4ssIxvNqorOq4zIn3wBAQEdCQfaW0d6KB/e19DHa1PDnHnmTDsuJBykNird0snmSzzmSzvUu6bmTDvAPzKSdFrgSTreSTlIFxKAZk+YMicIAgLmSzvj4uHnSzvcRzmMYDfgX0qsiWqth2bFnXmvhmB+USaZc1B0SyOYeV7GhT/lTjzMmHbReUHEcjzJonvOTTd/bUvRSDe5xWW4r0TYRzjhSjqwwke9kkCo5ku6PTCu21a1zV6izkio50yq30utz0i7l0G0tEW6PTDKoX3nTDzk5OTXwrCm702ne1PAmXbDsqSFVim0nYbQRTbKon7MpILi39zZ2kbf2dPMpYPOrI7PqonZyLrg2tWUa0aoi2/lTTzVRjfmSzvRRTbKoHzFqnSm7Uy2rkTAtG7TuaPh3dnayr3Pr5PBj2/i4N7jTz7OcFjmTDzlUT/AmXfXeF2JYz+DVSjUz8qZgWqmiW6AUyeRaUK/n4HX0cvDm3jZRzjjSjvbSDi6wmWy01un6Ey3p0PAo0Su21bJYDmm7ky4o0LYSji9vGrMVDim7k3TRjfCfT2lwnw7kbv1AAAA/3RSTlMA/gT8/v7+/v7+OgoCNCXyJv4eAfIS/v7+/vC08O/82IOd/CPb8LkHkTL+/Bz88/6R/u+d7diD09MxRLr+/A3GF5sq39uwZ/7//v7+/mr+GwtKlAZ+RAhZRkRXo7lA9RAI7LRNJ8I1s6YFEERFzbP+iarsVP7+/hgR/o3+/vEYV73+xHr+78vC9vEnr4YS9P54Av7+uP7+/v7+/okGrv7+/v7+Tf7+/v7+/v7+0/7+o/7+/v7+0v///////////////////////////v////////////////////////////////////////////////////////////////////5DvfAEAAADEElEQVRIx9WWdVDcQBTGOSMJHA7F3d3dtZ0CRetu1N3d3d3d3XPXFOgBgxUtUnd3d5lp7rIH2VzS8m/fbOY2m/fb73uXZDdqav9BOIcFDQh0tLJyDOwTFNbrn+la/n5lJXo4juA4r6CkzM8/56/poeFu3ggU3m7hrpzpmj6e1Nz0hut5+miy5+sGF1JJpXSMPAqD+7HlawT4AhvqU8bCvnwDNFjyveSTKWY9jxVdpyuQzUuF0B2N0wDpzQgYwHvrMuoN4TU7UMcwrGgc7IoXAlfuUoBAClKsuBBSQApc6Pmu7jgTkF7jQQDuHkoDnCB5uSUyRsCmEKfm/BxTXFVBWgwr4KZaTYAtwgZgV2AAsVXmd7BkB4oZgKUzANrzELYaMCyC8dd2BoANzq4gLYcVcBsAmHMBV3kwYA4Aa4TDElYKX7AGgAWXgnQurGABADtOoBwG7AAg4LQ0C74gAIAOp8IlWGEaABI4gSIYSABAN05LK8BISoriZy0ARjIUnl8kIy+vNdkUg5fr6ol93+sQfAsA+jKAC8L8fGFubluyyQcbP5kQhIj4eaxxDwAGG8KWWgnJUJ7sOm4iaicSnSYPkxNbATGKqVD5TAjqbPNOVN9wiCDO/vh95uvHbasoYAgTePRECbx93/BZdoQgTn77JZPVoispYFA0w9LmjcDS9h27ZQeM94tEp6pQeSyfThFDI1WKphTuv3pjLJHs/fDlcI0ElZBtDgXwu3IUvUYx78HandUoFbNB2R4OkMKLSqBwV6KY+HW1MdWRzFO+193N6MDjBwC4A/JqUNBBlYC4Sw8a8PRhMgXcAnlNbVHTUsPvaKasYUOyULia6k5CGTG/eTXjd3IACi83VVSsoxRuMxWW0tZLA+2BkdQdXJ97DzzRN6pgYOFiaA3vOSaa8aSPnwo7mmwAbxPiCTOWGNLfGcPhw+gKMyeq7FwGRnFJsQvidQQCnfj+sUlxRvqJqBJAEz1Yd1NxVIy+vba2vX5MlJg8NUo9R9k5mrqsZd8S/LSM7MzM7Iw0fsu/P7LS07NA9w8Y3j+FBDSaoQAAAABJRU5ErkJggg==';

    button.innerHTML = `
    <div id='button-container'>
        <p id='recipe-text'>Show Recipe</p>
    </div>
    <img src=${base64} id='icon-img'/>
    `;
    
    /*<p id='draggable-section'>Drag me!</p> to be added within the button container*/

    document.body.appendChild(button);

    /* Make the button clickable */
    button.addEventListener('click', () => {
        showRecipe();
        button.remove();
    });
}


/* This function creates the popup div */
function createDiv() {
    let div = document.createElement('div');
    div.id = 'recipe-popup';

    // add header
    let header = document.createElement('h1');
    header.textContent = "Recipe Extractor";
    header.style.color = nightMode ? 'white' : 'black';
    div.appendChild(header);

    return div;
}


/* This function extracts the recipe from the current webpage */
function showRecipe() {
    let div = createDiv();

    // escape key closes the popup
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closePopup();
        }
    });

    // add close button
    let closeButton = document.createElement('button');
    closeButton.id = 'recipe-close-button';
    closeButton.textContent = 'Exit';
    div.appendChild(closeButton);
    closeButton.addEventListener('click', () => { closePopup(); });

    // add recipe title
    let header = document.createElement('h2');
    header.textContent = document.title;
    div.appendChild(header);

    let isIng = true;
    let rHeader = false;
    let iHeader = false;

    // add ingredients and instructions information
    recipe_selectors.forEach(function (s) {
        let recipes = document.querySelectorAll(s);
        recipes.forEach(recipe => {
            if (recipe) {
                // TODO this code needs to be cleaned up
                if (isIng && !iHeader) {
                    if (recipe.querySelector('h2')) recipe.querySelector('h2').remove()

                    let ingredientsHeader = document.createElement('h3');
                    ingredientsHeader.id = 'i-header';
                    ingredientsHeader.textContent = 'Ingredients';
                    ingredientsHeader.style.marginTop = '5%';

                    div.appendChild(ingredientsHeader);
                    div.appendChild(document.createElement('hr'));
                    isIng = false;
                    iHeader = true;
                } else if (!isIng && !rHeader) {
                    if (recipe.querySelector('h2')) recipe.querySelector('h2').remove()

                    let recipeHeader = document.createElement('h3');
                    recipeHeader.id = 'r-header';
                    recipeHeader.textContent = 'Instructions';
                    recipeHeader.style.marginTop = '5%';

                    div.appendChild(recipeHeader);
                    div.appendChild(document.createElement('hr'));
                    rHeader = true;
                }
                standardizeFormatting();
                let clone = recipe.cloneNode(true);
                div.appendChild(clone);
            }
        });
    });

    // remove all existing styles and html
    let elements = document.querySelectorAll("*");
    elements.forEach(el=>{
        if(el.tagName==="LINK" || el.tagName==="STYLE") el.remove();
        else el.removeAttribute("style");
    });
    document.body.innerHTML = '';

    // append new styles and html
    document.body.appendChild(div);
    updateNightMode(nightMode);
    window.scrollTo(0, 0);

    // remove all iframes
    if (document.querySelectorAll('iframe')) {
        document.querySelectorAll('iframe').forEach(iframe => iframe.remove());
    }

    // remove delayed popups
    setTimeout(() => {
        if (enabled && document.getElementById('recipe-popup')) {
            document.body.innerHTML = '';
            document.body.appendChild(div);
        }
    }, 5000);
}

/* This function closes the recipe extractor by simply reloading the page */
function closePopup() {    
    // refresh the page
    location.reload();
}


/* This function standardizes the formatting of the recipe */
function standardizeFormatting() {
    let nodes = document.querySelectorAll('*');

    let sC = ['mntl-sc-block-image', 'css-0'];

    nodes.forEach(node => {
        node.classList.forEach(c => {
            if (c.includes('img') || sC.includes(c)) node.remove();
            }
        );
        if (node.textContent !== '') {
            node.style.fontWeight = 'normal';
            node.style.fontFamily = 'Product Sans, sans-serif';
        }
        if (document.querySelectorAll('iframe')) {
            document.querySelectorAll('iframe').forEach(iframe => iframe.remove());
        }
        /* Remove all strong tags and append their text to the parent */
        // if(document.querySelectorAll('strong')) {
        //     // take all text within parent of the strong and make it into new li 
        //     document.querySelectorAll('strong').forEach(strong => {
        //         let parent = strong.parentElement;
        //         parent.textContent += strong.textContent;
        //         strong.remove();
        //     });
            
        // }
    });
}


/* This function determines if the current webpage is a recipe page */
function isRecipePage() {
    for (let i = 0; i < recipe_selectors.length; i++) {
        if (document.querySelector(recipe_selectors[i])) {
            return true;
        }
    }
}