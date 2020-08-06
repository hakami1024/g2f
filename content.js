var allowlistSites = {};
var allowlistPages = {};
var origin_site, origin_page;
var filterOn = false;
var xpathDocText = '//*[not(self::script or self::style)]/text()[normalize-space(.) != ""]';

console.log("Guys2Folks V1.0 Ready");

function isFilterOn() {
    return !(allowlistSites.includes(origin_site)) && !(allowlistPages.includes(origin_page));
}

function retrieveSettings(xpathDocText, node) {
    try {
        chrome.storage.local.get(['allowlistSites'], function (item_sites) {
            chrome.storage.local.get(['allowlistPages'], function (item_pages) {
                    allowlistSites = item_sites['allowlistSites'];
                    allowlistPages = item_pages['allowlistPages'];
                    origin_site = document.location.origin.replace(/https?:\/\//i, '');
                    origin_page = document.location.href;
                    filterOn = isFilterOn();
                    filterWords(xpathDocText, node);
            });
        });
    } catch(e){
        // if (e.message.includes('Extension context invalidated')) {
        // } else {
            console.log(e);
        // }
    }
}


function loadSettings() {
    try {
        chrome.storage.local.get(['allowlistSites'], function (item_sites) {
            chrome.storage.local.get(['allowlistPages'], function (item_pages) {
                    allowlistSites = item_sites['allowlistSites'];
                    allowlistPages = item_pages['allowlistPages'];
                    origin_site = document.location.origin.replace(/https?:\/\//i, '');
                    origin_page = document.location.href;
                    filterOn = isFilterOn();
                if (filterOn) {
                    filterWords(xpathDocText);
                    mutationObserver();
                }
            });
        });
    } catch(e){
        // if (e.message.includes('Extension context invalidated')) {
        // } else {
            console.log(e);
        // }
    }
}

function mutationObserver() {
    var observerConfig = {
        childList: true,
        subtree: true
    };

    // When DOM is modified, remove 'guys' from inserted node
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            // console.log(mutation);
            checkNode(mutation);
        });
    });
    // Remove 'guys' from new objects
    observer.observe(document, observerConfig);
}

function replaceText(text) {
    var wordRegex = new RegExp("\\bguy(s|z)\\b", 'gi');
    if(wordRegex.test(text) === true){
        text = text.replace(wordRegex, function (match) {
            if(match === match.toLowerCase()){
                return "folks";
            } else if(match === match.toUpperCase() ){
                return "FOLKS";
            } else if(match[0] === match[0].toUpperCase()){
                return "Folks"
            }
            return "folks";
        });
    }
    return text
}

var nodeTypes = {};
function filterWords(xpathExpression, node) {
    if (!filterOn) {
        return;
    }

    node = (typeof node !== 'undefined') ? node : document;
    var evalResult = document.evaluate(
        xpathExpression,
        node,
        null,
        XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
        null
    );

    if (evalResult.snapshotLength > 0) {
        console.log('in filterWords');
        if (node.tagName in nodeTypes) {
            nodeTypes[node.tagName]++;
        } else {
            nodeTypes[node.tagName] = 0;
        }
    }

    for (let i = 0; i < evalResult.snapshotLength; i++) {
        let textNode = evalResult.snapshotItem(i);
        console.log(textNode.data);
        textNode.data = replaceText(textNode.data);
    }
}

function checkNode(mutation) {
    mutation.addedNodes.forEach(function (node) {
        if (!isForbiddenNode(node)) {
            // console.log(node);
            // console.log(node.tagName);
            // console.log(node.className);
            if(allowlistSites === {}){
                retrieveSettings(xpathDocText, node);
            } else {
                filterWords(xpathDocText, node);
            }
        }
    });
}

function svgInParents(node, depth=7){
    let i = 0;
    curNode = node.parentNode;
    while(i<depth && curNode){
        let tag = curNode.tagName ? curNode.tagName.toLowerCase() : "";
        if(tag === "svg" || tag === "g" || tag === "path"){
            return true;
        }
        i++;
        curNode = curNode.parentNode;
    }
    return false;
}

function isForbiddenNode(node) {
    return node.isContentEditable || // DraftJS and many others
        !node.tagName ||
        (node.parentNode && node.parentNode.isContentEditable) || // Special case for Gmail
        (node.tagName.toLowerCase() === "textarea" || // Some catch-alls
                node.tagName.toLowerCase() === "input" ||
                node.tagName.toLowerCase() === "script" ||
                node.tagName.toLowerCase() === "style" ||
                node.tagName.toLowerCase() === 'svg' ||
                node.tagName.toLowerCase() === 'g' ||
                node.tagName.toLowerCase() === 'path' ||
                node.tagName.toLowerCase() === 'grammarly-extension' ||
                node.tagName.toLowerCase() === 'link' ||
                node.tagName.toLowerCase() === 'img') ||
        (origin_site.includes("facebook.com") && ( // processing facebook popups (touching them leads to some coursor focus quirk)
            node.style && node.style.position === "fixed" ||
            node.className.includes("uiContextualLayerPositioner") ||
            (node.attributes && node.attributes['role'] && node.attributes['role'].value === 'option')
        )) ||
        svgInParents(node);
}

loadSettings();
