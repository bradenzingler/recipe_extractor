/**
 * This file contains the content script that is injected into the webpage to 
 * extract the recipe from the current webpage.
 * 
 * Last updated: 2/14/2024
 */
var nightMode = false;
var enabled = false;
var ignored = ['recipe-overlay', 'icon-img', 'blacklist-button'];



//https://www.bonappetit.com/recipe/bas-best-chicken-parm fix pictures
/* instructions selectors */
recipe_selectors = [
    '.wprm-recipe-instruction-text',            // damndelicious.net instructions
    '.directions > li > ol > li',               // delish.com instructions
    '.direction-list > li',                          // food.com instructions FINISH UP
    '.mntl-sc-block-group--OL > li > p',        // allrecipes.com instructions
    '.InstructionListWrapper-dcpygI',           // epicurious.com instructions
    '#structured-project__steps_1-0',           // simplyrecipes.com instructions
    '#mod-recipe-method-1',                     // foodnetwork.com instructions
    '.grouped-list',                            // bbcgoodfood.com instructions
    '.field-instructionstext',                  // countrycrock.com instructions
    '.cooked-recipe-directions',                // lifeandhealth.org instructions
    '.tasty-recipes-instructions-body > ol > li', // sallysbakingaddiction.com instructions
    '.recipe-instructions > div > ol',          // gordonramsay.com instructions
    '.mntl-recipe-steps > div > ol',            // southernliving.com instructions
    '.recipe-directions__item',                 // tasteofhome.com instructions
    '.tasty-recipes-instructions > div > ol > li',
    '.recipe-instruction > ol > li',
    '.preparation_step__nzZHP',
    '.recipe-directions > li',
    '.mv-create-instructions > ol > li',
    '.Recipe__instructionStepContent > span > p'
];
/* ingredients selectors */
ingr_selectors = [
    '.Wrapper-dxnTBC',                          // epicurious.com ingredients
    '.mntl-structured-ingredients__list-item',  // allrecipes.com, southernliving.com ingredients
    '.wprm-recipe-ingredient',                  // damndelicious.net ingredients
    '.ingredient-lists > li > p',               // delish.com ingredients
    '#structured-ingredients_1-0',              // simplyrecipes.com ingredients
    '.o-Ingredients__m-Body',                   // foodnetwork.com ingredients
    '.ingredient-list > li',                         // food.com ingredients
    '.recipe__ingredients',                     // bbcgoodfood.com ingredients
    '.Recipe__ingredient',
    '.field-ingredientstext',                   // countrycrock.com ingredients
    '.cooked-recipe-ingredients',               // lifeandhealth.org ingredients
    '.tasty-recipes-ingredients-body > ul > li', // sallysbakingaddiction.com ingredients
    '.recipe-ingredients__list',                // tasteofhome.com ingredients
    '.recipe-ingredients > ul > li',            // gordonramsay.com ingredients
    '.tasty-recipes-ingredients > div > ul > li', //acouplecooks.com
    '.recipe-ingredient > ul > li',
    '.ingredients_ingredients__FLjsC > ul > li',
    '.recipe-ingredients > li',
    '.mv-create-ingredients > ul > li'
];




/* The initial script */
chrome.storage.sync.get('enabled', function(data) {
    enabled = data.enabled;
    let blacklist = getBlacklist();
    blacklist.then((blacklist) => {
            if (blacklist === null || blacklist === undefined) {
                if (enabled && isRecipePage()) {
                    showRecipe();
                    chrome.storage.sync.get(['nightMode'], function (result) {
                        nightMode = result.nightMode;
                        nightMode ? updateNightMode(nightMode) : updateNightMode(false);
                    });
                }
            } else {
                if (!blacklist.includes(window.location.hostname)) {
                    if (enabled && isRecipePage()) {
                        showRecipe();
                        chrome.storage.sync.get(['nightMode'], function (result) {
                            nightMode = result.nightMode;
                            nightMode ? updateNightMode(nightMode) : updateNightMode(false);
                        });
                    }
                }
            }
    });
});




/************** EVENT LISTENERS ******************/
// Add listener for toggle changes
chrome.storage.onChanged.addListener(function(changes, namespace){
    if (changes.enabled) toggleExtension(changes.enabled.newValue); 
    if (changes.nightMode && isRecipePage()) updateNightMode(changes.nightMode.newValue);       
});
/***************** EVENT LISTENERS **************/




/* Get blacklist */
async function getBlacklist() {
    let req = await chrome.storage.local.get(["blacklist"]);
    return req.blacklist;
}




/* Changes night mode settings */
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
        updateNightMode(nightMode);
    } else if(document.getElementById('recipe-popup')) {
        document.getElementById('recipe-popup') ? closePopup() : null;
    } 
}




/* This function creates the recipe popup. */
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

    // Blacklist button functionality
    let blacklistButton = document.createElement('button');
    blacklistButton.id = 'blacklist-button';
    blacklistButton.textContent = `Disable for ${window.location.hostname}`;
    div.appendChild(blacklistButton);
    blacklistButton.addEventListener('click', async () => {
        let hostName = window.location.hostname;
        var dt = await chrome.storage.local.get(["blacklist"]);
        let blacklist = dt.blacklist;
        if (!blacklist) {
            blacklist = [hostName];
        } else if(!blacklist.includes(hostName)) {
            blacklist.push(hostName);
        }
        await chrome.storage.local.set({ blacklist : blacklist});
        location.reload();
    });
   
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
                recipe.style.marginTop = '2%';
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
                recipe.style.marginTop = '2%';
                div.appendChild(recipe); 
            }
        });
});

    // Remove existing styles
    let elements = document.querySelectorAll("*");
    elements.forEach(el=>{
        if(el.tagName==="LINK" || el.tagName==="STYLE") el.remove();
        else el.removeAttribute("style");
    });
    document.body.innerHTML = '';
    document.body.appendChild(div);
    window.scrollTo(0, 0);

    // clean up and apply styles
    standardizeFormatting();
    chrome.storage.sync.get(['nightMode'], function (result) {
        nightMode = result.nightMode;
        nightMode ? updateNightMode(nightMode) : updateNightMode(false);
    });

    // remove delayed popups
    setTimeout(() => {
        if (enabled && document.getElementById('recipe-popup')) {
            document.body.innerHTML = '';
            document.body.appendChild(div);
        }
    }, 5000);
}




/* Closes the recipe extractor popup. */
function closePopup() { 
    location.reload();
    chrome.storage.sync.get(['nightMode'], function (result) {
        nightMode = result.nightMode;
        nightMode ? updateNightMode(nightMode) : updateNightMode(false);
    });
}



/* This function standardizes the formatting of the recipe */
function standardizeFormatting() {
    let nodes = document.querySelectorAll('*');

    // random problematic classes and tags to remove
    let sC = ['mntl-sc-block-image', 'css-0'];

    nodes.forEach(node => {
        node.classList.forEach(c => {
            if (c.includes('img') || sC.includes(c)) node.remove();
        });
        if (node.textContent !== '') {
            node.style.fontWeight = 'normal';
            node.style.fontFamily = 'Product Sans, sans-serif';
        }
    });
    if (document.querySelectorAll('iframe')) {
        document.querySelectorAll('iframe').forEach(iframe => iframe.remove());
    }
}




/* This function determines if the current webpage is a recipe page */
function isRecipePage() {
    for (let i = 0; i < recipe_selectors.length; i++) {
        if (document.querySelector(recipe_selectors[i])) {
            return true;
        }
    }
    for (let i = 0; i < ingr_selectors.length; i++) {
        if (document.querySelector(ingr_selectors[i])) {
            return true;
        }
    }
    return false;
}