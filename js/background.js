chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create(
      {
        type: 'normal',
        title: chrome.i18n.getMessage("sendTo") + '“%s”',
        id: 'Memos-send',
        contexts: ['all']
      },
    )
})
let tempCont=''
chrome.contextMenus.onClicked.addListener(info => {
    tempCont += info.selectionText + '\n'
    chrome.storage.sync.set({open_action: "save_text",open_content:tempCont});
})