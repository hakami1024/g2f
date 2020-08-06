function toggleFilter(event) {
    var toggleFilterchecked = document.getElementById('notification').checked;
    chrome.storage.local.get(['allowlistSites'], function (item) {
        let allowlist_sites = item['allowlistSites'];
        let currentHost = document.getElementById('current_site').innerText;
        let allowlisted = allowlist_sites.includes(currentHost);
        if (toggleFilterchecked && allowlisted) {
            allowlist_sites = allowlist_sites.filter(item => item !== currentHost);
            let notifPage = document.getElementById("notification_page");
            notifPage.checked = true;
            notifPage.disabled = false;
            notifPage.addEventListener('click', toggleFilterPage);
            document.getElementById('notification_page_slider').classList.remove("disabled");
        } else if (!toggleFilterchecked && !allowlisted) {
            allowlist_sites.push(currentHost);
            let notifPage = document.getElementById("notification_page");
            notifPage.removeEventListener('click', toggleFilterPage);
            notifPage.checked = false;
            notifPage.disabled = true;
            document.getElementById('notification_page_slider').classList.add("disabled");
            chrome.storage.local.get(['allowlistPages'], function (item_pages) {
                let allowlist_pages = item_pages['allowlistPages'];
                let new_allowlist_pages = [];
                for (let p of allowlist_pages) {
                    if (!p.includes(currentHost)) {
                        new_allowlist_pages.push(p);
                    }
                }
                chrome.storage.local.set({'allowlistPages': new_allowlist_pages});
            })
        }
        chrome.storage.local.set({'allowlistSites': allowlist_sites}, function () {
            chrome.tabs.reload();
        });
    });
}

function toggleFilterPage(event) {
    var toggleFilterchecked = document.getElementById('notification_page').checked;
    chrome.storage.local.get(['allowlistPages'], function (item) {
        let allowlist_pages = item['allowlistPages'];

        let currentUrl = document.getElementById("current_page").innerText;
        if (toggleFilterchecked && (allowlist_pages.includes(currentUrl))) {
            allowlist_pages = allowlist_pages.filter(item => item !== currentUrl)
        } else if (!toggleFilterchecked && !(allowlist_pages.includes(currentUrl))) {
            allowlist_pages.push(currentUrl);
        }
        chrome.storage.local.set({'allowlistPages': allowlist_pages}, function () {
            chrome.tabs.reload();
        });
    });
}

function restoreOptions() {
    chrome.storage.local.get(['allowlistSites'], function (item_sites) {
        chrome.storage.local.get(['allowlistPages'], function (item_pages) {
            console.log('in restoreOptions');
            let currentUrl = document.getElementById("current_page").innerText;
            let currentHost = document.getElementById('current_site').innerText;
            if (currentHost === "" || currentUrl === "") {
                console.error('No currentHost or currentUrl set');
            }
            let allowlist_sites = item_sites['allowlistSites'];
            let allowlist_pages = item_pages['allowlistPages'];
            let allowSite = allowlist_sites.includes(currentHost);
            document.getElementById('notification').checked = !allowSite;
            document.getElementById('notification_page').checked = !allowSite && !(allowlist_pages.includes(currentUrl));
            if (allowSite) {
                document.getElementById('notification_page').disabled = true;
                document.getElementById('notification_page_slider').classList.add("disabled");
            } else {
                document.getElementById('notification_page').disabled = false;
                document.getElementById('notification_page_slider').classList.remove("disabled");
            }
        });
    });
}

window.onload = function () {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        let tmp = document.createElement('a');
        tmp.href = tabs[0].url.toString();
        document.getElementById("current_site").innerText = tmp.hostname;
        document.getElementById('current_page').innerText = tmp.href;
        console.log(tmp.href);
    });
};

document.addEventListener('DOMContentLoaded', function () {
    restoreOptions();
    document.getElementById("notification").addEventListener('click', toggleFilter);
    document.getElementById("notification_page").addEventListener('click', toggleFilterPage);
    console.log("DOM Loaded");
});
