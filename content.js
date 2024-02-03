/**
 * This file contains the content script that is injected into the webpage to allow 
 * the user to extract the recipe from the current webpage.
 * 
 * Author: Braden Zingler
 * Email: bgzingler@wisc.edu
 * Last updated: 2/2/2024
 */


// Show the button and add the CSS file when the page is ready
$(document).ready(function () {
    if (isRecipePage()) {
        showButton();
    }
});


// Selectors for recipe pages
recipe_selectors = [
    '.wprm-recipe-container',
    '.ingredients-body',
    '.ingredients',
    '.tasty-recipes', 
    '.recipe-ingredients',
    '.instructions',
    '.mntl-structured-ingredients', 
    '.recipe__ingredients',
    '#zrdn-recipe-container',
    '.directions',
    '.recipe__instructions',
    '.recipe-directions',
    '.mntl-recipe-steps'
]


/* This function adds a button to show the recipe*/
function showButton() {

    // create button
    let button = document.createElement('div');
    button.id = 'recipe-extractor-button';

    // icon information
    let base64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAC/VBMVEVHcEzKoX0IBgTJoHyEVSil7kzWwrDJoHzmSzvj4+PTsZTOrZADAgHTsZMFBAPEm3jTsZPKon8FAQENBAPAmXcCAACne1LjSjum7kzLpIG9l3XMpoPLo4DNpoTSr5DLpIHOqIjPq4vKoX4AAACqiGnSsJHQrIzJqIvSr5DTsZTQq4vNpoQXDgrQq4vQq4vLo4DUspXKoX7Sr5HUs5bRrY7TsZTUs5bSsJLRrY7TsZTUs5bUspXQsJXIoHwAAACYeF0AAABrVUIIBgWui2y2kXGUMCY6LiTDsqTJoXyFxwi/mHaFVim4x2VIGBKm7EwBAAAAAAAmDAlyJR0AAABaHRfRrY67nIE1KiElHhfQrI04LCJ6YUuriGorIhvCm3gDAgLNq4/Qq4zUs5ZvWETTsZSTdVvTsZPUs5Z3X0odFxI4LCJMPC8/MielOCx3XknRs5mWd1yKblXQq4ssIxvNqorOq4zIn3wBAQEdCQfaW0d6KB/e19DHa1PDnHnmTDsuJBykNird0snmSzzmSzvUu6bmTDvAPzKSdFrgSTreSTlIFxKAZk+YMicIAgLmSzvj4uHnSzvcRzmMYDfgX0qsiWqth2bFnXmvhmB+USaZc1B0SyOYeV7GhT/lTjzMmHbReUHEcjzJonvOTTd/bUvRSDe5xWW4r0TYRzjhSjqwwke9kkCo5ku6PTCu21a1zV6izkio50yq30utz0i7l0G0tEW6PTDKoX3nTDzk5OTXwrCm702ne1PAmXbDsqSFVim0nYbQRTbKon7MpILi39zZ2kbf2dPMpYPOrI7PqonZyLrg2tWUa0aoi2/lTTzVRjfmSzvRRTbKoHzFqnSm7Uy2rkTAtG7TuaPh3dnayr3Pr5PBj2/i4N7jTz7OcFjmTDzlUT/AmXfXeF2JYz+DVSjUz8qZgWqmiW6AUyeRaUK/n4HX0cvDm3jZRzjjSjvbSDi6wmWy01un6Ey3p0PAo0Su21bJYDmm7ky4o0LYSji9vGrMVDim7k3TRjfCfT2lwnw7kbv1AAAA/3RSTlMA/gT8/v7+/v7+OgoCNCXyJv4eAfIS/v7+/vC08O/82IOd/CPb8LkHkTL+/Bz88/6R/u+d7diD09MxRLr+/A3GF5sq39uwZ/7//v7+/mr+GwtKlAZ+RAhZRkRXo7lA9RAI7LRNJ8I1s6YFEERFzbP+iarsVP7+/hgR/o3+/vEYV73+xHr+78vC9vEnr4YS9P54Av7+uP7+/v7+/okGrv7+/v7+Tf7+/v7+/v7+0/7+o/7+/v7+0v///////////////////////////v////////////////////////////////////////////////////////////////////5DvfAEAAADEElEQVRIx9WWdVDcQBTGOSMJHA7F3d3dtZ0CRetu1N3d3d3d3XPXFOgBgxUtUnd3d5lp7rIH2VzS8m/fbOY2m/fb73uXZDdqav9BOIcFDQh0tLJyDOwTFNbrn+la/n5lJXo4juA4r6CkzM8/56/poeFu3ggU3m7hrpzpmj6e1Nz0hut5+miy5+sGF1JJpXSMPAqD+7HlawT4AhvqU8bCvnwDNFjyveSTKWY9jxVdpyuQzUuF0B2N0wDpzQgYwHvrMuoN4TU7UMcwrGgc7IoXAlfuUoBAClKsuBBSQApc6Pmu7jgTkF7jQQDuHkoDnCB5uSUyRsCmEKfm/BxTXFVBWgwr4KZaTYAtwgZgV2AAsVXmd7BkB4oZgKUzANrzELYaMCyC8dd2BoANzq4gLYcVcBsAmHMBV3kwYA4Aa4TDElYKX7AGgAWXgnQurGABADtOoBwG7AAg4LQ0C74gAIAOp8IlWGEaABI4gSIYSABAN05LK8BISoriZy0ARjIUnl8kIy+vNdkUg5fr6ol93+sQfAsA+jKAC8L8fGFubluyyQcbP5kQhIj4eaxxDwAGG8KWWgnJUJ7sOm4iaicSnSYPkxNbATGKqVD5TAjqbPNOVN9wiCDO/vh95uvHbasoYAgTePRECbx93/BZdoQgTn77JZPVoispYFA0w9LmjcDS9h27ZQeM94tEp6pQeSyfThFDI1WKphTuv3pjLJHs/fDlcI0ElZBtDgXwu3IUvUYx78HandUoFbNB2R4OkMKLSqBwV6KY+HW1MdWRzFO+193N6MDjBwC4A/JqUNBBlYC4Sw8a8PRhMgXcAnlNbVHTUsPvaKasYUOyULia6k5CGTG/eTXjd3IACi83VVSsoxRuMxWW0tZLA+2BkdQdXJ97DzzRN6pgYOFiaA3vOSaa8aSPnwo7mmwAbxPiCTOWGNLfGcPhw+gKMyeq7FwGRnFJsQvidQQCnfj+sUlxRvqJqBJAEz1Yd1NxVIy+vba2vX5MlJg8NUo9R9k5mrqsZd8S/LSM7MzM7Iw0fsu/P7LS07NA9w8Y3j+FBDSaoQAAAABJRU5ErkJggg==';
    let image = document.createElement('img');
    image.src = base64;
    image.id = 'icon-img';
    button.innerText += 'Show Recipe';


    // append button to page, add button functionality
    document.body.appendChild(button);
    document.getElementById('recipe-extractor-button').appendChild(image);
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
    div.appendChild(header);
    return div;
}


/* This function extracts the recipe from the current webpage */
function showRecipe() {
    let div = createDiv();

    // the overlay greys the background out
    const overlay = document.createElement('div');
    overlay.id = 'recipe-overlay';
    document.body.appendChild(overlay);

    // disable scrolling in background
    document.body.style.overflowY = 'hidden';

    // add close button
    let closeButton = document.createElement('button');
    closeButton.id = 'recipe-close-button';
    closeButton.textContent = 'Exit';
    closeButton.addEventListener('click', () => {
        div.remove();
        overlay.remove();
        document.body.style.overflowY = 'auto'; // re-enable scrolling
        showButton();
    });
    div.appendChild(closeButton);

    // iterate through each selector
    recipe_selectors.forEach(function (s) {
        let recipe = document.querySelector(s);
        if (recipe) {

            // clone the recipe node
            let clone = recipe.cloneNode(true);
            clone.style.margin = '20px';

            // add to page
            div.appendChild(clone);
            document.body.appendChild(div);

            return false;
        }
        return true;
    });
}


/* This function determines if the current webpage is a recipe page */
function isRecipePage() {

    // check if page is google
    if (window.location.hostname.includes("google")) {
        return false;
    }

    // Get all text of page
    var text = $("body").text().toLowerCase();

    // Use regex to find keywords
    var keywords = ["ingredients", "recipe"];
    var regex = new RegExp(keywords.join("|"), "i");
    var found = text.match(regex);
    return found;
}