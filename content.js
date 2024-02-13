
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
var ignored = ['recipe-close-button', 'recipe-overlay'];
var ogHTML = document.body.innerHTML;
var ogCSS = document.head.innerHTML;


/* instructions selectors */
recipe_selectors = [
    '.wprm-recipe-instruction',                 // damndelicious.net instructions
    '.directions > li > ol > li',               // delish.com instructions
    '.direction-list',                          // food.com instructions FINISH UP
    'mntl-sc-block-group--LI',                  // allrecipes.com instructions
    '.InstructionListWrapper-dcpygI',           // epicurious.com instructions
    '#structured-project__steps_1-0',           // simplyrecipes.com instructions
    '#mod-recipe-method-1',                     // foodnetwork.com instructions
    '.grouped-list',                            // bbcgoodfood.com instructions
    '.field-instructionstext',                  // countrycrock.com instructions
    '.cooked-recipe-directions',                // lifeandhealth.org instructions
    '.tasty-recipes-instructions-body > ol > li', // sallysbakingaddiction.com instructions
    '.recipe-instructions > div > ol',          // gordonramsay.com instructions
    '.mntl-recipe-steps > div > ol',            // southernliving.com instructions
];
/* ingredients selectors */
ingr_selectors = [
    '.Wrapper-dxnTBC',                          // epicurious.com ingredients
    '.mntl-structured-ingredients__list-item',  // allrecipes.com, southernliving.com ingredients
    '.wprm-recipe-ingredient',                  // damndelicious.net ingredients
    '.ingredient-lists > li > p',               // delish.com ingredients
    '#structured-ingredients_1-0',              // simplyrecipes.com ingredients
    '.o-Ingredients__m-Body',                   // foodnetwork.com ingredients
    '.ingredient-list',                         // food.com ingredients
    '.recipe__ingredients',                     // bbcgoodfood.com ingredients
    '.field-ingredientstext',                   // countrycrock.com ingredients
    '.cooked-recipe-ingredients',               // lifeandhealth.org ingredients
    '.tasty-recipes-ingredients-body > ul > li', // sallysbakingaddiction.com ingredients
    '.recipe-ingredients',                      // gordonramsay.com ingredients
];



// Fetch the toggle state from storage
chrome.storage.sync.get('enabled', function(data) {
    enabled = data.enabled;
    // Check if the extension is enabled and it's a recipe page
    if (enabled && isRecipePage()) {
        showRecipe();
        // Restore nightMode setting
        chrome.storage.sync.get(['nightMode'], function (result) {
            nightMode = result.nightMode;
            nightMode ? updateNightMode(nightMode) : updateNightMode(false);
        });
    }
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
        showRecipe();
        
    } else if(document.getElementById('recipe-popup')) {
        // popup is up and the extension is disabled
        document.getElementById('recipe-popup') ? closePopup() : null;
    } 
    // Update nightMode setting
    updateNightMode(nightMode);
}


/* This function creates the popup div with a simple header */
function createDiv() {
    let div = document.createElement('div');
    div.id = 'recipe-popup';
    let header = document.createElement('h1');
    header.textContent = "Recipe Extractor";
    div.appendChild(header);
    return div;
}


/* This function extracts the recipe from the current webpage */
function showRecipe() {
    let div = createDiv();


    /* Close popup functionality */
    document.addEventListener('keydown', function(event) {if (event.key === 'Escape') closePopup();});
    let closeButton = document.createElement('button');
    closeButton.id = 'recipe-close-button';
    closeButton.textContent = 'Disable Recipe Extractor';
    div.appendChild(closeButton);
    closeButton.addEventListener('click', () => { chrome.storage.sync.set({enabled: false}); });


    // add recipe title
    let header = document.createElement('h2');
    header.textContent = document.title;
    div.appendChild(header);

    // TODO make this way more concise, lots of duplicate code here
    let rHeader = false;
    let iHeader = false;

    // add ingredients first
    ingr_selectors.forEach(function (s) {
        let recipes = document.querySelectorAll(s);
        recipes.forEach(recipe => {
            if (recipe) {
                // remove any existing headers
                if (recipe.querySelector('h2')) recipe.querySelector('h2').remove()
                if (recipe.querySelector('h3')) recipe.querySelector('h3').remove()

                if (!rHeader) {
                    let ingredientsHeader = document.createElement('h3');
                    ingredientsHeader.id = 'i-header';
                    ingredientsHeader.textContent = 'Ingredients';
                    ingredientsHeader.style.marginTop = '5%';
                    div.appendChild(ingredientsHeader);
                    div.appendChild(document.createElement('hr'));
                    rHeader = true;
                }
                recipe.style.listStyle = 'none';
                div.appendChild(recipe); 
            }
        });
    });

    // add instructions
    recipe_selectors.forEach(function (s) {
        let recipes = document.querySelectorAll(s);
        recipes.forEach(recipe => {
            if (recipe) {
                // remove any existing headers
                if (recipe.querySelector('h2')) recipe.querySelector('h2').remove()
                if (recipe.querySelector('h3')) recipe.querySelector('h3').remove()

                if (!iHeader) {
                    let ingredientsHeader = document.createElement('h3');
                    ingredientsHeader.id = 'i-header';
                    ingredientsHeader.textContent = 'Instructions';
                    ingredientsHeader.style.marginTop = '5%';
                    div.appendChild(ingredientsHeader);
                    div.appendChild(document.createElement('hr'));
                    iHeader = true;
                }
                recipe.style.listStyle = 'none';
                div.appendChild(recipe); 
            }
        });
        // TODO here is where error handling will be
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
    // Restore night mode
    chrome.storage.sync.get(['nightMode'], function (result) {
        nightMode = result.nightMode;
        nightMode ? updateNightMode(nightMode) : updateNightMode(false);
    });

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


/* Closes the recipe extractor. */
function closePopup() { 
    enabled = false;
    location.reload();
}


/* This function standardizes the formatting of the recipe */
function standardizeFormatting() {
    let nodes = document.querySelectorAll('*');

    // random problematic classes and tags to remove
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
    });
    // iterate through clones children
    for (let i = 0; i < clone.children.length; i++) {
        let child = clone.children[i];
        if (child.tagName === 'a') {
            child.remove();
        }
    }
}


/* This function determines if the current webpage is a recipe page */
function isRecipePage() {
    for (let i = 0; i < recipe_selectors.length; i++) {
        if (document.querySelector(recipe_selectors[i])) {
            return true;
        }
    }
}