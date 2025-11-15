
(function() {
  'use strict';

  const loadStartTime = performance.timing.navigationStart;
  
  function displayLoadTime() {
    const loadEndTime = performance.now();
    const loadTime = (performance.timing.loadEventEnd - performance.timing.navigationStart) / 1000;

    const footer = document.querySelector('footer');
    if (footer) {
      const loadTimeElement = document.createElement('p');
      loadTimeElement.className = 'load-time';
      loadTimeElement.innerHTML = `<small>⏱ Время загрузки страницы: <strong>${loadTime.toFixed(3)}</strong> секунд</small>`;
      loadTimeElement.style.cssText = `
        text-align: center;
        color: rgba(255, 255, 255, 0.8);
        margin-top: 1rem;
        font-size: 0.875rem;
      `;
      footer.appendChild(loadTimeElement);
    }
  }
  
  function highlightActiveNavItem() {
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    const navLinks = document.querySelectorAll('nav[aria-label="Основная навигация"] a');
    
    navLinks.forEach(link => {

      link.classList.remove('active');

      const linkPath = link.pathname;
      const linkHash = link.hash;

      if (currentPath.endsWith('index.html') || currentPath.endsWith('/')) {
        if (linkHash && currentHash === linkHash) {
          link.classList.add('active');
        } else if (!currentHash && (linkHash === '#hero' || link.getAttribute('href') === '#hero')) {
          link.classList.add('active');
        }
      } else {

        if (linkPath === currentPath) {
          link.classList.add('active');
        }
      }
    });
  }
  
  function handleHashChange() {
    highlightActiveNavItem();
  }
  
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');

        if (targetId !== '#' && targetId.length > 1) {
          const targetElement = document.querySelector(targetId);
          
          if (targetElement) {
            e.preventDefault();
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });

            history.pushState(null, null, targetId);
            highlightActiveNavItem();
          }
        }
      });
    });
  }
  
  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('article, section > div').forEach(el => {
      observer.observe(el);
    });
  }
  
  function initPageNavigation() {

    const navLinks = document.querySelectorAll('nav[aria-label="Основная навигация"] a');
    
    navLinks.forEach(link => {

      if (!link.getAttribute('href').startsWith('#')) {
        link.addEventListener('click', function(e) {

          console.log('Переход на страницу:', this.getAttribute('href'));
        });
      }
    });
  }
  
  function enhanceTable() {
    const table = document.querySelector('.stats-table');
    if (table) {
      const rows = table.querySelectorAll('tbody tr');
      
      rows.forEach(row => {
        row.addEventListener('click', function() {

          rows.forEach(r => r.style.backgroundColor = '');

          this.style.backgroundColor = 'rgba(30, 136, 229, 0.15)';
          
          const objectName = this.cells[0].textContent;
          console.log('Выбран объект:', objectName);
        });
      });
    }
  }
  
  document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Страница загружена');

    highlightActiveNavItem();

    initSmoothScroll();

    initScrollAnimations();

    initPageNavigation();

    enhanceTable();

    window.addEventListener('hashchange', handleHashChange);
  });
  
  window.addEventListener('load', function() {

    setTimeout(displayLoadTime, 100);
  });
  
  document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      img.addEventListener('error', function() {
        console.warn('Ошибка загрузки изображения:', this.src);
        this.style.backgroundColor = '#f5f5f5';
        this.style.minHeight = '200px';
      });
    });
  });
  
})();
