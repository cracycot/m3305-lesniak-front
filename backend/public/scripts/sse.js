(function () {
    'use strict';

    function showToast(message, type) {
        const container = document.getElementById('toast-container') || createToastContainer();
        const toast = document.createElement('div');
        toast.className = 'toast toast--' + (type || 'info');
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.innerHTML =
            '<span class="toast__icon">' + (type === 'success' ? '✓' : 'ℹ') + '</span>' +
            '<span class="toast__message">' + escapeHtml(message) + '</span>' +
            '<button class="toast__close" aria-label="Закрыть">&times;</button>';

        toast.querySelector('.toast__close').addEventListener('click', function () {
            removeToast(toast);
        });

        container.appendChild(toast);
        requestAnimationFrame(function () {
            toast.classList.add('toast--visible');
        });

        setTimeout(function () {
            removeToast(toast);
        }, 5000);
    }

    function removeToast(toast) {
        toast.classList.remove('toast--visible');
        toast.classList.add('toast--hiding');
        setTimeout(function () {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }

    function createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.setAttribute('aria-label', 'Уведомления');
        document.body.appendChild(container);
        return container;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function connectSSE() {
        const evtSource = new EventSource('/objects/events');

        evtSource.onmessage = function (event) {
            try {
                const data = JSON.parse(event.data);
                showToast('Добавлен новый объект: ' + data.title, 'success');

                const notification = document.getElementById('objects-sse-notifications');
                if (notification) {
                    const banner = document.createElement('div');
                    banner.className = 'sse-banner';
                    banner.innerHTML =
                        'Появился новый объект <strong>' + escapeHtml(data.title) + '</strong>. ' +
                        '<a href="/objects/' + data.id + '">Посмотреть</a> или ' +
                        '<a href="" onclick="location.reload();return false;">обновить страницу</a>.';
                    notification.appendChild(banner);
                }
            } catch (err) {
                console.error('SSE parse error:', err);
            }
        };

        evtSource.onerror = function () {
            console.warn('SSE connection lost, retrying in 10 s…');
            evtSource.close();
            setTimeout(connectSSE, 10000);
        };
    }

    connectSSE();
})();
