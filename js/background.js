chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create(
      {
        type: 'normal',
        title: '发送 “%s” 至 Memos ',
        id: 'Memos-send',
        contexts: ['all']
      },
    )
  })
  chrome.contextMenus.onClicked.addListener(info => {
    chrome.storage.sync.set({open_action: "save_text",open_content:info.selectionText});
  })