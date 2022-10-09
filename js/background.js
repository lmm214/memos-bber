chrome.contextMenus.create({
    title: "记下 “%s”",
    contexts: ['selection'],
    onclick: function(info, tab){
        //设定打开页面的一些初始值
        console.log(info);
        chrome.storage.sync.set({open_action: "save_text",open_content:info.selectionText}, function() {
            chrome.windows.create({
                url: chrome.extension.getURL("html/popup.html"),
                left: 50,
                top: 50,
                width: 550,
                height: 300,
                type: "popup"
            });
        });
    }
});