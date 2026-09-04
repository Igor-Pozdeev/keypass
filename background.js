// Фоновый скрипт плагина KeyPass

// Следим за изменением активной вкладки
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // При загрузке страницы отправляем сообщение content.js
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
  }
});

// Обрабатываем сообщения от content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'loginFormDetected') {
    // Сохраняем информацию о форме входа
    console.log('Обнаружена форма входа на странице:', message.url);

    // Можно добавить логику для отображения уведомления или сохранения данных
    // Например, показать уведомление в интерфейсе плагина

    // Отправляем ответ
    sendResponse({ status: 'received' });
    return true;
  }
});

// Добавляем обработчик для создания нового пароля через контекстное меню
chrome.runtime.onInstalled.addListener(() => {
  // Создаем контекстное меню
  chrome.contextMenus.create({
    id: "savePassword",
    title: "Сохранить пароль в KeyPass",
    contexts: ["all"]
  });
});

// Обработчик для контекстного меню
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "savePassword") {
    // Отправляем сообщение в content.js для сохранения пароля
    chrome.tabs.sendMessage(tab.id, {
      action: "savePassword"
    });
  }
});

// Следим за активной вкладкой для отслеживания изменений
chrome.tabs.onActivated.addListener((activeInfo) => {
  // Можно реализовать логику для обновления состояния плагина
});