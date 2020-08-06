chrome.runtime.onInstalled.addListener(function (details) {
    var defaultSettings = {
        allowlistPages: [],
        allowlistSites: [],
    };

    if (details.reason === "install") {
        chrome.storage.local.set(defaultSettings, function () {
            alert("Extension successfully installed");
        });
    }
});