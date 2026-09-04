// Получаем ссылки на элементы DOM
const passwordList = document.getElementById('password-list');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const addPasswordBtn = document.getElementById('add-password-btn');

// Функция для отображения списка паролей
function displayPasswords(passwords) {
  passwordList.innerHTML = '';

  if (passwords.length === 0) {
    passwordList.innerHTML = '<div class="no-passwords">Пароли не найдены</div>';
    return;
  }

  passwords.forEach(password => {
    const item = document.createElement('div');
    item.className = 'password-item';
    item.innerHTML = `
      <div class="password-title">${password.title}</div>
      <div class="password-url">${password.url}</div>
      <div class="password-actions">
        <button class="btn btn-open" data-id="${password.id}">Открыть</button>
        <button class="btn btn-copy" data-id="${password.id}">Копировать</button>
        <button class="btn btn-edit" data-id="${password.id}">Изменить</button>
        <button class="btn btn-delete" data-id="${password.id}">Удалить</button>
      </div>
    `;
    passwordList.appendChild(item);
  });

  // Добавляем обработчики событий для кнопок
  document.querySelectorAll('.btn-open').forEach(button => {
    button.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      openUrl(id);
    });
  });

  document.querySelectorAll('.btn-copy').forEach(button => {
    button.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      copyPassword(id);
    });
  });

  document.querySelectorAll('.btn-edit').forEach(button => {
    button.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      editPassword(id);
    });
  });

  document.querySelectorAll('.btn-delete').forEach(button => {
    button.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      deletePassword(id);
    });
  });
}

// Функция для отображения формы добавления пароля
function showAddPasswordForm() {
  // Создаем форму добавления пароля
  const form = document.createElement('div');
  form.className = 'password-form';
  form.id = 'add-password-form';
  form.innerHTML = `
    <h3>Добавить пароль</h3>
    <div class="form-group">
      <label for="title">Название:</label>
      <input type="text" id="title" required>
    </div>
    <div class="form-group">
      <label for="url">URL сайта:</label>
      <input type="text" id="url" required>
    </div>
    <div class="form-group">
      <label for="username">Имя пользователя:</label>
      <input type="text" id="username">
    </div>
    <div class="form-group">
      <label for="password">Пароль:</label>
      <input type="password" id="password" required>
    </div>
    <div class="form-actions">
      <button class="btn btn-cancel" id="cancel-btn">Отмена</button>
      <button class="btn btn-save" id="save-btn">Сохранить</button>
    </div>
  `;

  // Вставляем форму перед кнопкой добавления
  addPasswordBtn.parentNode.insertBefore(form, addPasswordBtn);

  // Добавляем обработчики событий для формы
  document.getElementById('save-btn').addEventListener('click', savePassword);
  document.getElementById('cancel-btn').addEventListener('click', () => {
    form.remove();
  });

  // Показываем форму (убираем display: none)
  form.style.display = 'block';
}

// Функция для сохранения пароля
async function savePassword() {
  const title = document.getElementById('title').value;
  const url = document.getElementById('url').value;
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (!title || !url || !password) {
    alert('Пожалуйста, заполните все обязательные поля');
    return;
  }

  try {
    // Получаем текущие пароли из хранилища
    const result = await chrome.storage.sync.get(['passwords']);
    const passwords = result.passwords || [];

    // Создаем новый пароль
    const newPassword = {
      id: Date.now().toString(), // Простой способ генерации уникального ID
      title,
      url,
      username,
      password,
      created: new Date().toISOString()
    };

    // Добавляем пароль в список
    passwords.push(newPassword);

    // Сохраняем обновленный список паролей
    await chrome.storage.sync.set({ passwords });

    // Скрываем форму и обновляем отображение
    document.getElementById('add-password-form').remove();

    // Обновляем отображение списка паролей
    displayPasswords(passwords);

    // Отправляем сообщение в фоновый скрипт для обновления интерфейса
    chrome.runtime.sendMessage({
      action: 'updatePasswordList'
    });

    alert('Пароль успешно сохранен');
  } catch (error) {
    console.error('Ошибка при сохранении пароля:', error);
    alert('Ошибка при сохранении пароля');
  }
}

// Функция для копирования пароля в буфер обмена
async function copyPassword(id) {
  try {
    const passwords = await chrome.storage.sync.get(['passwords']);
    const password = passwords.passwords.find(p => p.id === id);

    if (password) {
      // Копируем пароль в буфер обмена
      await navigator.clipboard.writeText(password.password);

      // Отображаем уведомление о копировании
      alert(`Пароль для "${password.title}" скопирован в буфер обмена`);
    }
  } catch (error) {
    console.error('Ошибка при копировании пароля:', error);
    alert('Ошибка при копировании пароля');
  }
}

// Функция для редактирования пароля
function editPassword(id) {
  // Открываем модальное окно или переходим на страницу редактирования
  alert(`Редактирование пароля с ID: ${id}`);
}

// Функция для удаления пароля
async function deletePassword(id) {
  if (!confirm('Вы уверены, что хотите удалить этот пароль?')) {
    return;
  }

  try {
    const passwords = await chrome.storage.sync.get(['passwords']);
    passwords.passwords = passwords.passwords.filter(p => p.id !== id);

    await chrome.storage.sync.set({ passwords: passwords.passwords });

    // Обновляем отображение списка паролей
    displayPasswords(passwords.passwords);
  } catch (error) {
    console.error('Ошибка при удалении пароля:', error);
    alert('Ошибка при удалении пароля');
  }
}

// Функция для открытия URL сайта в новой вкладке
async function openUrl(id) {
  try {
    const result = await chrome.storage.sync.get(['passwords']);
    const passwords = result.passwords || [];
    const password = passwords.find(p => p.id === id);

    if (password && password.url) {
      chrome.tabs.create({ url: password.url });
    } else {
      alert('URL не найден для этого элемента');
    }
  } catch (error) {
    console.error('Ошибка при открытии URL:', error);
    alert('Ошибка при открытии сайта');
  }
}


// Функция для поиска паролей
function searchPasswords() {
  const searchTerm = searchInput.value.toLowerCase();

  chrome.storage.sync.get(['passwords'], (result) => {
    let filteredPasswords = result.passwords || [];

    if (searchTerm) {
      filteredPasswords = filteredPasswords.filter(password =>
        password.title.toLowerCase().includes(searchTerm) ||
        password.url.toLowerCase().includes(searchTerm)
      );
    }

    displayPasswords(filteredPasswords);
  });
}

// Функция для загрузки всех паролей при открытии всплывающего окна
function loadPasswords() {
  chrome.storage.sync.get(['passwords'], (result) => {
    displayPasswords(result.passwords || []);
  });
}

// Добавляем обработчики событий
searchButton.addEventListener('click', searchPasswords);
searchInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    searchPasswords();
  }
});

addPasswordBtn.addEventListener('click', showAddPasswordForm);

// Загружаем список паролей при открытии всплывающего окна
loadPasswords();

// Слушаем сообщения от content.js для обновления списка паролей
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updatePasswordList') {
    loadPasswords();
  }
});