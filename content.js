var allowlistSites = {};
var allowlistPages = {};
var origin_site, origin_page;
var filterOn = false;
var xpathDocText = '//*[not(self::script or self::style)]/text()[normalize-space(.) != ""]';
const DEBUG = false;

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
        if(DEBUG) {
            console.log(e);
        }
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
        if(DEBUG){
            console.log(e);
        }
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
            // if(DEBUG){
                // console.log(mutation);
            // }
            checkNode(mutation);
        });
    });
    // Remove 'guys' from new objects
    observer.observe(document, observerConfig);
}

function replaceText(textNode) {
    var wordRegex = new RegExp("\\bguy(s|z)\\b", 'gi');
    if(wordRegex.test(textNode.data) === true){
        textNode.data = textNode.data.replace(wordRegex, function (match) {
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

    if (evalResult.snapshotLength > 0 && DEBUG) {
        console.log('in filterWords');
        if (node.tagName in nodeTypes) {
            nodeTypes[node.tagName]++;
        } else {
            nodeTypes[node.tagName] = 0;
        }
    }

    for (let i = 0; i < evalResult.snapshotLength; i++) {
        let textNode = evalResult.snapshotItem(i);
        // if(DEBUG) console.log(textNode.data);
        replaceText(textNode);
    }
}

function checkNode(mutation) {
    mutation.addedNodes.forEach(function (node) {
        if (!isForbiddenNode(node)) {
            // if(DEBUG) {
                // console.log(node);
                // console.log(node.isContentEditable);
                // console.log(node.tagName);
                // console.log(node.className);
                // console.log(node.parentNode);
                // if(node.parentNode){
                    // console.log(node.parentNode.attributes);
                    // console.log(node.parentNode.className);
                //     console.log(node.parentNode.parentNode);
                //     if(node.parentNode.parentNode){
                //         console.log(node.parentNode.parentNode.attributes);
                //         if(node.parentNode.parentNode.parentNode){
                //             console.log(node.parentNode.parentNode.parentNode);
                //             console.log(node.parentNode.parentNode.parentNode.attributes);
                //             console.log(node.parentNode.parentNode.parentNode.parentNode);
                //         }
                //     }
                // }
            // }
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

function formInParents(node, depth=4){
    let i = 0;
    curNode = node.parentNode;
    while(i<depth && curNode){
        let tag = curNode.tagName ? curNode.tagName.toLowerCase() : "";
        if(tag === "form"){
            return true;
        }
        i++;
        curNode = curNode.parentNode;
    }
    return false;
}

function isForbiddenNode(node) {
    return node.isContentEditable ||
        !node.tagName ||
        (node.parentNode && node.parentNode.isContentEditable) ||
        (node.tagName.toLowerCase() === "textarea" ||
                node.tagName.toLowerCase() === "input" ||
                node.tagName.toLowerCase() === "button" ||
                node.tagName.toLowerCase() === "script" ||
                node.tagName.toLowerCase() === "style" ||
                node.tagName.toLowerCase() === 'svg' ||
                node.tagName.toLowerCase() === 'g' ||
                node.tagName.toLowerCase() === 'path' ||
                node.tagName.toLowerCase() === 'grammarly-extension' ||
                node.tagName.toLowerCase() === 'link' ||
                node.tagName.toLowerCase() === 'img') ||
        svgInParents(node) ||
        (node.attributes && node.attributes['contenteditable'] && node.attributes['contenteditable'] === 'true') ||
        formInParents(node);
}

loadSettings();
