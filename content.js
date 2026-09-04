// Скрипт контент-скрипта для обнаружения форм входа и автоматического заполнения паролей

// Функция для проверки, является ли элемент полем ввода пароля
function isPasswordInput(element) {
  return element.type === 'password' ||
         (element.getAttribute('type') === 'password') ||
         (element.getAttribute('autocomplete') === 'current-password') ||
         (element.getAttribute('name') && element.getAttribute('name').toLowerCase().includes('password'));
}

// Функция для проверки, является ли элемент полем ввода имени пользователя
function isUsernameInput(element) {
  return element.type === 'text' ||
         (element.getAttribute('type') === 'text') ||
         (element.getAttribute('autocomplete') === 'username') ||
         (element.getAttribute('name') &&
          (element.getAttribute('name').toLowerCase().includes('user') ||
           element.getAttribute('name').toLowerCase().includes('login') ||
           element.getAttribute('name').toLowerCase().includes('email')));
}

// Функция для автоматического заполнения формы
function autoFillForm(passwords) {
  if (!passwords || passwords.length === 0) return;

  // Находим поля ввода на странице
  const inputs = document.querySelectorAll('input');

  let usernameInput = null;
  let passwordInput = null;

  // Ищем поля ввода имени пользователя и пароля
  inputs.forEach(input => {
    if (isUsernameInput(input) && !usernameInput) {
      usernameInput = input;
    } else if (isPasswordInput(input) && !passwordInput) {
      passwordInput = input;
    }
  });

  // Если нашли оба поля, заполняем их
  if (usernameInput && passwordInput && passwords.length > 0) {
    // Используем первый пароль из списка
    const firstPassword = passwords[0];

    usernameInput.value = firstPassword.username || '';
    passwordInput.value = firstPassword.password;

    // Генерируем события для правильной работы форм
    usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

// Функция для поиска и обработки форм входа на странице
function processLoginPage() {
  // Проверяем, есть ли форма входа
  const forms = document.querySelectorAll('form');

  forms.forEach(form => {
    // Проверяем, содержит ли форма поля ввода пароля
    const passwordInputs = form.querySelectorAll('input[type="password"]');

    if (passwordInputs.length > 0) {
      // Форма входа найдена - отправляем сообщение в фоновый скрипт
      chrome.runtime.sendMessage({
        action: 'loginFormDetected',
        url: window.location.href,
        title: document.title
      });
    }
  });
}

// Функция для получения паролей из хранилища
async function getPasswords() {
  try {
    const result = await chrome.storage.sync.get(['passwords']);
    return result.passwords || [];
  } catch (error) {
    console.error('Ошибка при получении паролей:', error);
    return [];
  }
}

// Основная функция, которая запускается при загрузке страницы
async function main() {
  // Проверяем, является ли текущая страница страницей входа
  processLoginPage();

  // Получаем пароли из хранилища
  const passwords = await getPasswords();

  // Автоматически заполняем форму если это страница входа и есть сохраненные пароли
  if (passwords.length > 0) {
    autoFillForm(passwords);
  }
}

// Запускаем основную функцию при загрузке страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}

// Слушаем сообщения от фонового скрипта
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fillLoginForm') {
    // Получаем пароли и заполняем форму
    getPasswords().then(passwords => {
      autoFillForm(passwords);
    });
  }
});