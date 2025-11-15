
(function() {
  'use strict';
  
  const STORAGE_KEY = 'leningrad_feedback_items';

  let feedbackForm;
  let feedbackList;
  let feedbackCount;
  let template;
  let clearAllButton;

  document.addEventListener('DOMContentLoaded', function() {

    feedbackForm = document.getElementById('feedback-form');
    feedbackList = document.getElementById('feedback-list');
    feedbackCount = document.getElementById('feedback-count');
    template = document.getElementById('feedback-item-template');
    clearAllButton = document.getElementById('clear-all-button');

    if (!feedbackForm || !feedbackList || !template) {
      console.error('Не найдены необходимые элементы формы');
      return;
    }

    initFormHandlers();
    initCharacterCounter();

    if (clearAllButton) {
      clearAllButton.addEventListener('click', clearAllFeedback);
    }

    addMockFeedbackIfEmpty();
    loadFeedbackFromStorage();
    
    console.log('✅ Форма обратной связи инициализирована');
  });

  function addMockFeedbackIfEmpty() {
    const existingFeedback = getFeedbacksFromStorage();
    
    if (existingFeedback.length === 0) {
      const now = Date.now();
      const mockFeedbacks = [
        {
          id: now + '_1',
          name: 'Анна Петрова',
          email: 'anna.petrova@example.com',
          phone: '+7 (921) 555-12-34',
          category: 'positive',
          rating: '5',
          message: 'Отличный проект! Очень интересно узнать историю города через призму времени. Особенно понравилась галерея с фотографиями объектов до и после блокады. Спасибо создателям за проделанную работу!',
          date: new Date(Date.now() - 86400000 * 2).toISOString(),
          agree: true
        },
        {
          id: now + '_2',
          name: 'Дмитрий Соколов',
          email: 'dmitry.sokolov@example.com',
          phone: '',
          category: 'suggestion',
          rating: '4',
          message: 'Хороший проект, но хотелось бы видеть больше информации о конкретных объектах. Возможно, стоит добавить аудиогиды или видеоэкскурсии. Также было бы здорово реализовать интерактивную карту с возможностью построения маршрутов.',
          date: new Date(Date.now() - 86400000 * 5).toISOString(),
          agree: true
        },
        {
          id: now + '_3',
          name: 'Мария Иванова',
          email: 'maria.ivanova@example.com',
          phone: '+7 (812) 333-44-55',
          category: 'positive',
          rating: '5',
          message: 'Замечательная идея! Мой дедушка пережил блокаду, и для меня этот проект имеет особое значение. Очень важно сохранять память о тех страшных событиях и показывать, как город возродился.',
          date: new Date(Date.now() - 86400000 * 7).toISOString(),
          agree: true
        }
      ];

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mockFeedbacks));
        console.log('✅ Добавлены 3 мок-отзыва для демонстрации');
      } catch (error) {
        console.error('❌ Ошибка сохранения мок-отзывов:', error);
      }
    }
  }

  function validateField(field) {
    const errorElement = document.getElementById(`${field.id}-error`);
    let errorMessage = '';

    if (field.hasAttribute('required') && !field.value.trim()) {
      errorMessage = 'Это поле обязательно для заполнения';
    }

    else if (field.hasAttribute('minlength')) {
      const minLength = parseInt(field.getAttribute('minlength'));
      if (field.value.trim().length < minLength) {
        errorMessage = `Минимальная длина: ${minLength} символов`;
      }
    }

    else if (field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (field.value && !emailRegex.test(field.value)) {
        errorMessage = 'Введите корректный email';
      }
    }

    else if (field.type === 'tel' && field.value) {
      const phoneRegex = /^[+]?[0-9]{10,15}$/;
      const cleanPhone = field.value.replace(/[\s()-]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        errorMessage = 'Введите корректный номер телефона';
      }
    }

    if (errorMessage && errorElement) {
      errorElement.textContent = errorMessage;
      errorElement.classList.add('show');
      field.style.borderColor = '#d32f2f';
      return false;
    } else if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.remove('show');
      if (field.value) {
        field.style.borderColor = '#4caf50';
      } else {
        field.style.borderColor = '';
      }
      return true;
    }
    
    return true;
  }

  function validateRating() {
    const ratingInputs = document.querySelectorAll('input[name="rating"]');
    const errorElement = document.getElementById('rating-error');
    const isChecked = Array.from(ratingInputs).some(input => input.checked);
    
    if (!isChecked) {
      if (errorElement) {
        errorElement.textContent = 'Пожалуйста, выберите оценку';
        errorElement.classList.add('show');
      }
      return false;
    } else {
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
      }
      return true;
    }
  }

  function initFormHandlers() {

    const fields = feedbackForm.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
      field.addEventListener('blur', function() {
        validateField(this);
      });
      
      field.addEventListener('input', function() {
        if (this.classList.contains('error')) {
          validateField(this);
        }
      });
    });

    const ratingInputs = document.querySelectorAll('input[name="rating"]');
    ratingInputs.forEach(input => {
      input.addEventListener('change', validateRating);
    });

    feedbackForm.addEventListener('submit', handleFormSubmit);

    feedbackForm.addEventListener('reset', function() {
      setTimeout(() => {
        const errors = feedbackForm.querySelectorAll('.error-message');
        errors.forEach(error => {
          error.classList.remove('show');
          error.textContent = '';
        });
        
        const fields = feedbackForm.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
          field.style.borderColor = '';
        });
        
        updateCharacterCount();
      }, 0);
    });
  }

  function initCharacterCounter() {
    const messageField = document.getElementById('message');
    const charCount = document.getElementById('char-count');
    
    if (messageField && charCount) {
      messageField.addEventListener('input', updateCharacterCount);
      updateCharacterCount();
    }
  }
  
  function updateCharacterCount() {
    const messageField = document.getElementById('message');
    const charCount = document.getElementById('char-count');
    
    if (messageField && charCount) {
      const count = messageField.value.length;
      charCount.textContent = count;
      
      if (count > 900) {
        charCount.style.color = '#d32f2f';
      } else {
        charCount.style.color = '';
      }
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    console.log('🚀 Форма отправлена');

    const fields = feedbackForm.querySelectorAll('input:not([type="radio"]), select, textarea');
    let isValid = true;
    
    fields.forEach(field => {
      if (!validateField(field)) {
        isValid = false;
        console.log('❌ Невалидное поле:', field.name);
      }
    });

    if (!validateRating()) {
      isValid = false;
      console.log('❌ Не выбран рейтинг');
    }

    if (!isValid) {
      console.log('⚠️ Форма содержит ошибки');
      showNotification('Пожалуйста, заполните все обязательные поля', 'error');
      return;
    }

    const formData = new FormData(feedbackForm);
    const feedbackItem = {
      id: Date.now().toString(),
      name: formData.get('name').trim(),
      email: formData.get('email').trim(),
      phone: formData.get('phone')?.trim() || '',
      category: formData.get('category'),
      rating: formData.get('rating'),
      message: formData.get('message').trim(),
      date: new Date().toISOString(),
      agree: formData.get('agree') === 'on'
    };

    console.log('💾 Сохраняем отзыв:', feedbackItem);
    saveFeedback(feedbackItem);

    console.log('🎨 Отображаем отзыв на странице');
    renderFeedbackItem(feedbackItem);

    console.log('🧹 Очищаем форму');
    feedbackForm.reset();
    updateCharacterCount();

    feedbackList.scrollTop = 0;

    console.log('✅ Отзыв успешно добавлен!');
    showNotification('Отзыв успешно отправлен!');
  }

  function saveFeedback(feedbackItem) {
    try {
      const feedbacks = getFeedbacksFromStorage();
      console.log('📦 Текущих отзывов в storage:', feedbacks.length);
      feedbacks.unshift(feedbackItem);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbacks));
      console.log('💾 Сохранено в localStorage, теперь отзывов:', feedbacks.length);
      updateFeedbackCount();
    } catch (error) {
      console.error('❌ Ошибка сохранения в localStorage:', error);
      showNotification('Ошибка сохранения отзыва', 'error');
    }
  }
  
  function getFeedbacksFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Ошибка чтения из localStorage:', error);
      return [];
    }
  }
  
  function loadFeedbackFromStorage() {
    const feedbacks = getFeedbacksFromStorage();
    
    if (feedbacks.length === 0) {
      showEmptyState();
    } else {
      hideEmptyState();
      feedbacks.forEach(feedback => renderFeedbackItem(feedback));
    }
    
    updateFeedbackCount();
  }
  
  function deleteFeedback(id) {
    try {
      const feedbacks = getFeedbacksFromStorage();
      const filteredFeedbacks = feedbacks.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredFeedbacks));
      updateFeedbackCount();

      const element = document.querySelector(`[data-id="${id}"]`);
      if (element) {
        element.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
          element.remove();

          if (filteredFeedbacks.length === 0) {
            showEmptyState();
          }
        }, 300);
      }
    } catch (error) {
      console.error('Ошибка удаления из localStorage:', error);
      showNotification('Ошибка удаления отзыва', 'error');
    }
  }
  
  function updateFeedback(id, newMessage) {
    try {
      const feedbacks = getFeedbacksFromStorage();
      const index = feedbacks.findIndex(item => item.id === id);
      
      if (index !== -1) {
        feedbacks[index].message = newMessage;
        feedbacks[index].edited = true;
        feedbacks[index].editedDate = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbacks));
        showNotification('Отзыв успешно обновлен!');
      }
    } catch (error) {
      console.error('Ошибка обновления в localStorage:', error);
      showNotification('Ошибка обновления отзыва', 'error');
    }
  }
  
  function clearAllFeedback() {
    if (confirm('Вы уверены, что хотите удалить все отзывы? Это действие нельзя отменить.')) {
      try {
        localStorage.removeItem(STORAGE_KEY);
        feedbackList.innerHTML = '';
        showEmptyState();
        updateFeedbackCount();
        showNotification('Все отзывы удалены');
      } catch (error) {
        console.error('Ошибка очистки localStorage:', error);
        showNotification('Ошибка очистки отзывов', 'error');
      }
    }
  }

  function renderFeedbackItem(feedbackItem) {
    console.log('🎨 Начинаем отрисовку отзыва:', feedbackItem.name);
    hideEmptyState();
    
    if (!template) {
      console.error('❌ Template не найден!');
      return;
    }
    
    const clone = template.content.cloneNode(true);
    const itemDiv = clone.querySelector('.feedback-item');

    if (!itemDiv) {
      console.error('❌ .feedback-item не найден в template!');
      return;
    }

    itemDiv.setAttribute('data-id', feedbackItem.id);

    clone.querySelector('.author-name').textContent = feedbackItem.name;
    clone.querySelector('.feedback-rating').textContent = '⭐'.repeat(parseInt(feedbackItem.rating));
    clone.querySelector('.feedback-date').textContent = formatDate(feedbackItem.date);
    clone.querySelector('.feedback-category').textContent = getCategoryLabel(feedbackItem.category);
    clone.querySelector('.feedback-message').textContent = feedbackItem.message;

    const editButton = clone.querySelector('.btn-edit');
    const deleteButton = clone.querySelector('.btn-delete');
    
    editButton.addEventListener('click', function() {
      handleEdit(feedbackItem.id);
    });
    
    deleteButton.addEventListener('click', function() {
      if (confirm('Удалить этот отзыв?')) {
        deleteFeedback(feedbackItem.id);
      }
    });

    feedbackList.insertBefore(clone, feedbackList.firstChild);
    console.log('✅ Отзыв добавлен в DOM');
  }

  function handleEdit(id) {
    const feedbackElement = document.querySelector(`[data-id="${id}"]`);
    if (!feedbackElement) return;
    
    const messageElement = feedbackElement.querySelector('.feedback-message');
    const currentMessage = messageElement.textContent;

    feedbackElement.classList.add('editing');

    const textarea = document.createElement('textarea');
    textarea.value = currentMessage;
    textarea.className = 'edit-textarea';

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'edit-actions';
    
    const saveButton = document.createElement('button');
    saveButton.textContent = '✓ Сохранить';
    saveButton.className = 'btn btn-primary btn-sm';
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = '✗ Отменить';
    cancelButton.className = 'btn btn-secondary btn-sm';

    saveButton.addEventListener('click', function() {
      const newMessage = textarea.value.trim();
      
      if (newMessage.length < 10) {
        alert('Отзыв должен содержать минимум 10 символов');
        return;
      }
      
      if (newMessage.length > 1000) {
        alert('Отзыв не должен превышать 1000 символов');
        return;
      }
      
      updateFeedback(id, newMessage);
      messageElement.textContent = newMessage;
      exitEditMode();
    });
    
    cancelButton.addEventListener('click', exitEditMode);
    
    function exitEditMode() {
      feedbackElement.classList.remove('editing');
      textarea.remove();
      actionsDiv.remove();
    }
    
    actionsDiv.appendChild(saveButton);
    actionsDiv.appendChild(cancelButton);
    
    const bodyDiv = feedbackElement.querySelector('.feedback-item-body');
    bodyDiv.appendChild(textarea);
    bodyDiv.appendChild(actionsDiv);
    
    textarea.focus();
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
  
  function getCategoryLabel(category) {
    const labels = {
      'positive': 'Положительный',
      'suggestion': 'Предложение',
      'issue': 'Проблема',
      'question': 'Вопрос',
      'other': 'Другое'
    };
    return labels[category] || category;
  }
  
  function updateFeedbackCount() {
    const feedbacks = getFeedbacksFromStorage();
    if (feedbackCount) {
      feedbackCount.textContent = feedbacks.length;
    }
  }
  
  function showEmptyState() {
    const existingEmpty = feedbackList.querySelector('.no-feedback');
    if (!existingEmpty) {
      const emptyP = document.createElement('p');
      emptyP.className = 'no-feedback';
      emptyP.textContent = 'Пока нет отзывов. Будьте первым!';
      feedbackList.appendChild(emptyP);
    }
  }
  
  function hideEmptyState() {
    const emptyState = feedbackList.querySelector('.no-feedback');
    if (emptyState) {
      emptyState.remove();
    }
  }
  
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${type === 'success' ? '#4caf50' : '#d32f2f'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
    
    @keyframes slideOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(-20px);
      }
    }
  `;
  document.head.appendChild(style);
  
})();
