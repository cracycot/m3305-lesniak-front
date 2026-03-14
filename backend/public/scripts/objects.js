
(function() {
  'use strict';

  const API_CONFIG = {
    baseURL: 'https://jsonplaceholder.typicode.com',
    endpoints: {
      posts: '/posts',
      users: '/users',
      albums: '/albums',
      photos: '/photos'
    }
  };

  let loadMoreButton;
  let objectsContainer;
  let loader;
  let errorMessage;
  let errorText;
  let retryButton;
  let template;

  let currentPage = 1;
  let isLoading = false;

  document.addEventListener('DOMContentLoaded', function() {

    loadMoreButton = document.getElementById('load-more-button');
    objectsContainer = document.getElementById('objects-container');
    loader = document.getElementById('loader');
    errorMessage = document.getElementById('error-message');
    errorText = document.getElementById('error-text');
    retryButton = document.getElementById('retry-button');
    template = document.getElementById('object-template');

    if (!loadMoreButton || !objectsContainer) {
      console.error('Не найдены необходимые элементы страницы');
      return;
    }

    initHandlers();
    
    console.log('📡 Скрипт загрузки объектов инициализирован');
  });

  function initHandlers() {
    if (loadMoreButton) {
      loadMoreButton.addEventListener('click', handleLoadMore);
    }
    
    if (retryButton) {
      retryButton.addEventListener('click', handleRetry);
    }
  }

  async function handleLoadMore() {
    if (isLoading) return;

    const dataTypes = ['posts', 'albums', 'users'];
    const randomType = dataTypes[Math.floor(Math.random() * dataTypes.length)];
    
    console.log(`🔄 Загрузка данных типа: ${randomType}`);
    
    await loadData(randomType);
  }

  function handleRetry() {
    hideError();
    handleLoadMore();
  }

  async function loadData(dataType = 'posts') {
    if (isLoading) return;
    
    isLoading = true;
    showLoader();
    hideError();
    
    try {

      const endpoint = API_CONFIG.endpoints[dataType];
      const limit = 6; // Количество элементов для загрузки
      const start = (currentPage - 1) * limit;

      const url = `${API_CONFIG.baseURL}${endpoint}?_start=${start}&_limit=${limit}`;
      
      console.log(`📡 Запрос к API: ${url}`);

      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }, 10000); // Таймаут 10 секунд

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${getErrorMessage(response.status)}`);
      }

      const data = await response.json();
      
      console.log(`✅ Получено ${data.length} элементов`);

      if (data.length === 0) {
        showNotification('Больше нет данных для загрузки', 'info');
        if (loadMoreButton) {
          loadMoreButton.disabled = true;
          loadMoreButton.textContent = 'Все данные загружены';
        }
      } else {
        renderData(data, dataType);
        currentPage++;
      }
      
    } catch (error) {
      console.error('❌ Ошибка загрузки:', error);
      handleError(error);
    } finally {
      isLoading = false;
      hideLoader();
    }
  }

  function fetchWithTimeout(url, options = {}, timeout = 5000) {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Превышено время ожидания запроса')), timeout)
      )
    ]);
  }

  function renderData(items, dataType) {
    items.forEach(item => {
      const element = createDataElement(item, dataType);
      if (element) {
        objectsContainer.appendChild(element);

        setTimeout(() => {
          element.classList.add('fade-in');
        }, 10);
      }
    });
  }

  function createDataElement(item, dataType) {
    if (!template) {
      console.error('Шаблон не найден');
      return null;
    }
    
    const clone = template.content.cloneNode(true);
    const article = clone.querySelector('.object-card');

    switch(dataType) {
      case 'posts':
        clone.querySelector('.object-title').textContent = truncate(item.title, 50);
        clone.querySelector('.object-description').textContent = truncate(item.body, 150);
        clone.querySelector('.object-id').textContent = `ID: ${item.id} | Пост`;
        article.style.borderLeft = '4px solid #1e88e5';
        break;
        
      case 'albums':
        clone.querySelector('.object-title').textContent = truncate(item.title, 50);
        clone.querySelector('.object-description').textContent = `Альбом пользователя #${item.userId}. Коллекция фотографий исторических объектов.`;
        clone.querySelector('.object-id').textContent = `ID: ${item.id} | Альбом`;
        article.style.borderLeft = '4px solid #4caf50';
        break;
        
      case 'users':
        clone.querySelector('.object-title').textContent = item.name;
        clone.querySelector('.object-description').textContent = 
          `${item.email} | ${item.company?.name || 'Компания не указана'}`;
        clone.querySelector('.object-id').textContent = `Пользователь #${item.id} | ${item.address?.city || 'Город не указан'}`;
        article.style.borderLeft = '4px solid #ff9800';
        break;
        
      default:
        clone.querySelector('.object-title').textContent = 'Неизвестный объект';
        clone.querySelector('.object-description').textContent = JSON.stringify(item);
        clone.querySelector('.object-id').textContent = `ID: ${item.id}`;
    }
    
    return clone;
  }

  function handleError(error) {
    let userMessage = '';
    let errorType = 'unknown';

    if (!navigator.onLine) {
      errorType = 'network';
      userMessage = '🌐 Отсутствует подключение к интернету. Проверьте ваше сетевое соединение.';
    } else if (error.message.includes('Превышено время ожидания')) {
      errorType = 'timeout';
      userMessage = '⏱️ Сервер не отвечает. Попробуйте повторить запрос позже.';
    } else if (error.message.includes('HTTP 404')) {
      errorType = 'not-found';
      userMessage = '🔍 Запрашиваемый ресурс не найден на сервере.';
    } else if (error.message.includes('HTTP 500')) {
      errorType = 'server';
      userMessage = '⚙️ Внутренняя ошибка сервера. Попробуйте позже.';
    } else if (error.message.includes('HTTP 403')) {
      errorType = 'forbidden';
      userMessage = '🚫 Доступ к ресурсу запрещен.';
    } else if (error.name === 'TypeError') {
      errorType = 'network';
      userMessage = '🌐 Ошибка сети. API может быть недоступен или требуется VPN.';
    } else {
      errorType = 'unknown';
      userMessage = `❌ Произошла ошибка: ${error.message}`;
    }
    
    console.error(`Тип ошибки: ${errorType}`, error);
    showError(userMessage);
  }

  function getErrorMessage(status) {
    const messages = {
      400: 'Неверный запрос',
      401: 'Требуется авторизация',
      403: 'Доступ запрещен',
      404: 'Ресурс не найден',
      500: 'Внутренняя ошибка сервера',
      502: 'Сервер недоступен',
      503: 'Сервис временно недоступен',
      504: 'Превышено время ожидания'
    };
    return messages[status] || 'Неизвестная ошибка';
  }

  function showLoader() {
    if (loader) {
      loader.style.display = 'block';
    }
    if (loadMoreButton) {
      loadMoreButton.disabled = true;
      loadMoreButton.textContent = 'Загрузка...';
    }
  }
  
  function hideLoader() {
    if (loader) {
      loader.style.display = 'none';
    }
    if (loadMoreButton) {
      loadMoreButton.disabled = false;
      loadMoreButton.textContent = 'Загрузить дополнительные объекты из API';
    }
  }
  
  function showError(message) {
    if (errorMessage && errorText) {
      errorText.textContent = message;
      errorMessage.style.display = 'block';

      errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  
  function hideError() {
    if (errorMessage) {
      errorMessage.style.display = 'none';
    }
  }

  function truncate(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    const colors = {
      success: '#4caf50',
      error: '#d32f2f',
      info: '#2196f3',
      warning: '#ff9800'
    };
    
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${colors[type] || colors.info};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
      max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  const style = document.createElement('style');
  style.textContent = `
    .loader {
      text-align: center;
      padding: 2rem;
      color: var(--color-text-secondary);
    }
    
    .loader__spinner {
      width: 50px;
      height: 50px;
      margin: 0 auto 1rem;
      border: 4px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .error-message {
      background: #ffebee;
      border: 2px solid #d32f2f;
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
      margin: var(--spacing-xl) 0;
      text-align: center;
    }
    
    .error-message h3 {
      color: #d32f2f;
      margin-bottom: var(--spacing-md);
    }
    
    .error-message p {
      color: var(--color-text-primary);
      margin-bottom: var(--spacing-lg);
    }
    
    .retry-button {
      background: #d32f2f;
      color: white;
      border: none;
      padding: var(--spacing-md) var(--spacing-xl);
      border-radius: var(--radius-md);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-base);
    }
    
    .retry-button:hover {
      background: #b71c1c;
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    
    .load-more-button {
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      color: white;
      border: none;
      padding: var(--spacing-lg) var(--spacing-2xl);
      border-radius: var(--radius-lg);
      font-size: var(--font-size-base);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-base);
      box-shadow: var(--shadow-sm);
    }
    
    .load-more-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    
    .load-more-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .object-card {
      background: white;
      padding: var(--spacing-lg);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      border-left: 4px solid var(--color-primary);
      transition: all var(--transition-base);
      opacity: 0;
    }
    
    .object-card.fade-in {
      animation: fadeIn 0.5s ease-out forwards;
    }
    
    .object-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }
    
    .object-title {
      color: var(--color-secondary);
      margin-bottom: var(--spacing-md);
      font-size: var(--font-size-xl);
    }
    
    .object-body {
      margin-bottom: var(--spacing-md);
    }
    
    .object-description {
      color: var(--color-text-primary);
      line-height: 1.6;
    }
    
    .object-footer {
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--color-border);
    }
    
    .object-id {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      font-weight: 500;
    }
  `;
  document.head.appendChild(style);
  
})();
