/* ============================================
   App de Despensa — "No Hay Mercado"
   ============================================ */

class DespensaApp {
    constructor() {
        this.products = this.loadProducts();
        this.editingId = null;
        this.notificationsEnabled = this.loadNotificationPreference();

        // Category config
        this.categories = {
            lacteos: { label: 'Lácteos', emoji: '🥛' },
            carnes: { label: 'Carnes', emoji: '🥩' },
            frutas: { label: 'Frutas', emoji: '🍎' },
            verduras: { label: 'Verduras', emoji: '🥦' },
            granos: { label: 'Granos y Cereales', emoji: '🌾' },
            bebidas: { label: 'Bebidas', emoji: '🥤' },
            limpieza: { label: 'Limpieza', emoji: '🧹' },
            otros: { label: 'Otros', emoji: '📦' },
        };

        this.initDOM();
        this.bindEvents();
        this.render();
    }

    // ─── DOM References ──────────────────────
    initDOM() {
        // Stats
        this.statTotal = document.querySelector('#stat-total .stat-number');
        this.statLow = document.querySelector('#stat-low .stat-number');
        this.statOut = document.querySelector('#stat-out .stat-number');
        this.statBuy = document.querySelector('#stat-buy .stat-number');

        // Alert banner
        this.alertBanner = document.getElementById('alert-banner');
        this.alertBannerText = document.getElementById('alert-banner-text');
        this.btnViewAlerts = document.getElementById('btn-view-alerts');

        // Alerts panel
        this.alertsPanel = document.getElementById('alerts-panel');
        this.alertsGrid = document.getElementById('alerts-grid');
        this.btnCloseAlerts = document.getElementById('btn-close-alerts');

        // Controls
        this.searchInput = document.getElementById('search-input');
        this.filterCategory = document.getElementById('filter-category');
        this.filterStatus = document.getElementById('filter-status');
        this.sortOrder = document.getElementById('sort-order');
        this.btnEnableNotifications = document.getElementById('btn-enable-notifications');
        this.btnExportText = document.getElementById('btn-export-text');
        this.btnAddProduct = document.getElementById('btn-add-product');
        this.btnAddFirst = document.getElementById('btn-add-first');

        // Products
        this.productsGrid = document.getElementById('products-grid');
        this.emptyState = document.getElementById('empty-state');

        // Modal
        this.modalOverlay = document.getElementById('modal-overlay');
        this.modalTitle = document.getElementById('modal-title');
        this.productForm = document.getElementById('product-form');
        this.productId = document.getElementById('product-id');
        this.productName = document.getElementById('product-name');
        this.productCat = document.getElementById('product-category');
        this.productUnit = document.getElementById('product-unit');
        this.productQty = document.getElementById('product-quantity');
        this.productMin = document.getElementById('product-min');
        this.productBuyList = document.getElementById('product-buy-list');
        this.btnCloseModal = document.getElementById('btn-close-modal');
        this.btnCancelModal = document.getElementById('btn-cancel-modal');

        // Toast
        this.toastContainer = document.getElementById('toast-container');
    }

    // ─── Event Binding ───────────────────────
    bindEvents() {
        // Open modal
        this.btnAddProduct.addEventListener('click', () => this.openModal());
        this.btnAddFirst.addEventListener('click', () => this.openModal());

        // Close modal
        this.btnCloseModal.addEventListener('click', () => this.closeModal());
        this.btnCancelModal.addEventListener('click', () => this.closeModal());
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.closeModal();
        });

        // Form submit
        this.productForm.addEventListener('submit', (e) => this.handleSubmit(e));

        // Search & filters
        this.searchInput.addEventListener('input', () => this.render());
        this.filterCategory.addEventListener('change', () => this.render());
        this.filterStatus.addEventListener('change', () => this.render());
        this.sortOrder.addEventListener('change', () => this.render());
        this.btnEnableNotifications.addEventListener('click', () => this.requestNotificationPermission());
        this.btnExportText.addEventListener('click', () => this.exportBuyListText());

        // Quantity +/- buttons in modal
        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = document.getElementById(btn.dataset.target);
                const current = parseInt(target.value) || 0;
                if (btn.dataset.action === 'increase') {
                    target.value = current + 1;
                } else {
                    target.value = Math.max(0, current - 1);
                }
            });
        });

        // Alerts panel
        this.btnViewAlerts.addEventListener('click', () => this.toggleAlertsPanel());
        this.btnCloseAlerts.addEventListener('click', () => this.toggleAlertsPanel(false));

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }

    // ─── Data Persistence ────────────────────
    loadProducts() {
        try {
            const data = localStorage.getItem('despensa_products');
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    saveProducts() {
        localStorage.setItem('despensa_products', JSON.stringify(this.products));
    }

    createId() {
        return window.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    }

    isNotificationSupported() {
        return 'Notification' in window;
    }

    loadNotificationPreference() {
        return localStorage.getItem('despensa_notifications_enabled') === '1';
    }

    saveNotificationPreference(enabled) {
        localStorage.setItem('despensa_notifications_enabled', enabled ? '1' : '0');
    }

    setNotificationButtonState() {
        if (!this.btnEnableNotifications) return;
        if (!this.isNotificationSupported()) {
            this.btnEnableNotifications.textContent = 'Notificaciones no soportadas';
            this.btnEnableNotifications.disabled = true;
            return;
        }

        const permission = Notification.permission;
        if (permission === 'granted') {
            this.notificationsEnabled = true;
            this.btnEnableNotifications.textContent = 'Notificaciones activas';
            this.btnEnableNotifications.classList.add('active');
        } else if (permission === 'denied') {
            this.notificationsEnabled = false;
            this.btnEnableNotifications.textContent = 'Notificaciones bloqueadas';
            this.btnEnableNotifications.classList.remove('active');
        } else {
            this.btnEnableNotifications.textContent = 'Activar notificaciones';
            this.btnEnableNotifications.classList.remove('active');
        }
    }

    requestNotificationPermission() {
        if (!this.isNotificationSupported()) {
            this.showToast('warning', 'El navegador no soporta notificaciones.');
            return;
        }

        Notification.requestPermission().then(permission => {
            const enabled = permission === 'granted';
            this.notificationsEnabled = enabled;
            this.saveNotificationPreference(enabled);
            this.setNotificationButtonState();

            if (enabled) {
                this.showToast('success', 'Notificaciones del navegador activadas');
                this.notifyBrowser('No Hay Mercado', 'Notificaciones activadas para alertas de despensa.');
            } else {
                this.showToast('warning', 'No se activaron las notificaciones del navegador');
            }
        });
    }

    notifyBrowser(title, message) {
        if (!this.isNotificationSupported()) return;
        if (!this.notificationsEnabled) return;
        if (Notification.permission !== 'granted') return;

        try {
            new Notification(title, {
                body: message,
                icon: 'https://www.google.com/s2/favicons?domain=localhost',
                silent: true,
            });
        } catch (error) {
            console.warn('Error mostrando notificación', error);
        }
    }

    // ─── Product CRUD ────────────────────────
    addProduct(product) {
        product.id = this.createId();
        product.createdAt = new Date().toISOString();
        this.products.push(product);
        this.saveProducts();
        this.render();
        this.showToast('success', `"${product.name}" agregado a la despensa`);
        this.notifyBrowser('Producto agregado', `"${product.name}" se agregó a tu despensa.`);
    }

    updateProduct(id, updates) {
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...updates };
            this.saveProducts();
            this.render();
            this.showToast('success', `"${this.products[index].name}" actualizado`);
        }
    }

    deleteProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (product && confirm(`¿Eliminar "${product.name}" de la despensa?`)) {
            this.products = this.products.filter(p => p.id !== id);
            this.saveProducts();
            this.render();
            this.showToast('danger', `"${product.name}" eliminado`);
            this.notifyBrowser('Producto eliminado', `"${product.name}" se eliminó de tu despensa.`);
        }
    }

    changeQuantity(id, delta) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            const newQty = Math.max(0, product.quantity + delta);
            product.quantity = newQty;
            this.saveProducts();
            this.render();

            if (newQty === 0) {
                this.showToast('danger', `⚠️ "${product.name}" se ha agotado`);
                this.notifyBrowser('Producto agotado', `"${product.name}" está agotado.`);
            } else if (newQty <= product.minQuantity) {
                this.showToast('warning', `⚠️ "${product.name}" tiene stock bajo`);
                this.notifyBrowser('Stock bajo', `"${product.name}" tiene stock bajo.`);
            } else if (product.quantity <= product.minQuantity && newQty > product.minQuantity) {
                this.showToast('success', `"${product.name}" repuesto`);
                this.notifyBrowser('Stock repuesto', `"${product.name}" ahora tiene stock suficiente.`);
            }
        }
    }

    // ─── Status Helpers ──────────────────────
    getStatus(product) {
        if (product.needed) return 'buy';
        if (product.quantity === 0) return 'out';
        if (product.quantity <= product.minQuantity) return 'low';
        return 'ok';
    }

    getStatusLabel(status) {
        const labels = {
            ok: '✅ En stock',
            low: '⚠️ Stock bajo',
            out: '🔴 Agotado',
            buy: '🛒 Comprar',
        };
        return labels[status] || '';
    }

    toggleBuyStatus(id) {
        const product = this.products.find(p => p.id === id);
        if (!product) return;

        product.needed = !product.needed;
        this.saveProducts();
        this.render();
        this.showToast('success', product.needed ? `"${product.name}" agregado a la lista de compra` : `"${product.name}" removido de la lista de compra`);
    }

    getAlertProducts() {
        return this.products.filter(p => this.getStatus(p) !== 'ok');
    }

    // ─── Filtering ───────────────────────────
    getFilteredProducts() {
        const search = this.searchInput.value.toLowerCase().trim();
        const category = this.filterCategory.value;
        const status = this.filterStatus.value;

        return this.products.filter(p => {
            if (search && !p.name.toLowerCase().includes(search)) return false;
            if (category !== 'all' && p.category !== category) return false;
            if (status !== 'all' && this.getStatus(p) !== status) return false;
            return true;
        });
    }
    getStatusOrder(product) {
        const status = this.getStatus(product);
        return status === 'buy' ? 0 : status === 'out' ? 1 : status === 'low' ? 2 : 3;
    }

    getSortedProducts(products) {
        const order = this.sortOrder?.value || 'name-asc';
        return [...products].sort((a, b) => {
            switch (order) {
                case 'name-desc':
                    return b.name.localeCompare(a.name, 'es', { sensitivity: 'base' });
                case 'qty-asc':
                    return a.quantity - b.quantity || a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
                case 'qty-desc':
                    return b.quantity - a.quantity || a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
                case 'status':
                    return this.getStatusOrder(a) - this.getStatusOrder(b) || a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
                default:
                    return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
            }
        });
    }

    showElement(el) {
        el.classList.remove('hidden');
    }

    hideElement(el) {
        el.classList.add('hidden');
    }
    // ─── Modal ───────────────────────────────
    openModal(productId = null) {
        this.editingId = productId;
        this.productForm.reset();
        this.productQty.value = 1;
        this.productMin.value = 1;

        if (productId) {
            const product = this.products.find(p => p.id === productId);
            if (product) {
                this.modalTitle.textContent = 'Editar Producto';
                this.productName.value = product.name;
                this.productCat.value = product.category;
                this.productUnit.value = product.unit;
                this.productQty.value = product.quantity;
                this.productMin.value = product.minQuantity;
                this.productBuyList.checked = !!product.needed;
            }
        } else {
            this.modalTitle.textContent = 'Agregar Producto';
            this.productBuyList.checked = false;
        }

        this.modalOverlay.classList.add('active');
        setTimeout(() => this.productName.focus(), 100);
    }

    closeModal() {
        this.modalOverlay.classList.remove('active');
        this.editingId = null;
    }

    handleSubmit(e) {
        e.preventDefault();

        const data = {
            name: this.productName.value.trim(),
            category: this.productCat.value,
            unit: this.productUnit.value,
            quantity: parseInt(this.productQty.value, 10) || 0,
            minQuantity: parseInt(this.productMin.value, 10) || 0,
            needed: this.productBuyList.checked,
        };

        if (!data.name) {
            this.showToast('warning', 'El nombre del producto es obligatorio');
            return;
        }

        if (!data.category) {
            this.showToast('warning', 'Selecciona una categoría para el producto');
            return;
        }

        if (data.quantity < 0 || data.minQuantity < 0) {
            this.showToast('warning', 'Las cantidades no pueden ser negativas');
            return;
        }

        if (data.minQuantity > data.quantity) {
            this.showToast('warning', 'Cantidad mínima mayor que la cantidad actual; el producto aparecerá como stock bajo.');
        }

        // Validar duplicados (comparación sin importar mayúsculas/minúsculas)
        const duplicate = this.products.find(p =>
            p.name.toLowerCase() === data.name.toLowerCase() &&
            p.id !== this.editingId
        );
        if (duplicate) {
            this.showToast('warning', `"${data.name}" ya existe en la despensa`);
            return;
        }

        if (this.editingId) {
            this.updateProduct(this.editingId, data);
        } else {
            this.addProduct(data);
        }

        this.closeModal();
    }

    // ─── Alerts Panel ────────────────────────
    toggleAlertsPanel(show = null) {
        const shouldShow = show !== null ? show : this.alertsPanel.classList.contains('hidden');
        if (shouldShow) {
            this.showElement(this.alertsPanel);
            this.renderAlerts();
        } else {
            this.hideElement(this.alertsPanel);
        }
    }

    renderAlerts() {
        const alerts = this.getAlertProducts();
        if (alerts.length === 0) {
            this.alertsGrid.innerHTML = '<div class="empty-alerts">No hay productos en alerta.</div>';
            return;
        }

        this.alertsGrid.innerHTML = alerts.map(p => {
            const status = this.getStatus(p);
            const cat = this.categories[p.category] || this.categories.otros;
            const badgeClass = status === 'out' ? 'badge-out' : status === 'low' ? 'badge-low' : 'badge-buy';
            const badgeLabel = status === 'out' ? 'Agotado' : status === 'low' ? 'Bajo' : 'Para comprar';
            return `
                <div class="alert-card ${status === 'low' ? 'low' : status === 'buy' ? 'buy' : ''}">
                    <span class="alert-card-emoji">${cat.emoji}</span>
                    <div class="alert-card-info">
                        <h4>${this.escapeHtml(p.name)}</h4>
                        <p>${p.quantity} ${p.unit} restantes</p>
                    </div>
                    <span class="alert-card-badge ${badgeClass}">
                        ${badgeLabel}
                    </span>
                </div>
            `;
        }).join('');
    }

    // ─── Render ──────────────────────────────
    render() {
        this.updateStats();
        this.updateAlertBanner();
        this.renderProducts();
        this.setNotificationButtonState();
        if (!this.alertsPanel.classList.contains('hidden')) {
            this.renderAlerts();
        }
    }

    updateStats() {
        const total = this.products.length;
        const low = this.products.filter(p => this.getStatus(p) === 'low').length;
        const out = this.products.filter(p => this.getStatus(p) === 'out').length;
        const buy = this.products.filter(p => this.getStatus(p) === 'buy').length;

        this.animateNumber(this.statTotal, total);
        this.animateNumber(this.statLow, low);
        this.animateNumber(this.statOut, out);
        this.animateNumber(this.statBuy, buy);
    }

    animateNumber(el, target) {
        const current = parseInt(el.textContent) || 0;
        if (current === target) return;
        el.textContent = target;
        el.style.transform = 'scale(1.3)';
        el.style.transition = 'transform 0.3s ease';
        setTimeout(() => { el.style.transform = 'scale(1)'; }, 300);
    }

    updateAlertBanner() {
        const alerts = this.getAlertProducts();
        if (alerts.length > 0) {
            this.showElement(this.alertBanner);
            const outCount = alerts.filter(p => this.getStatus(p) === 'out').length;
            const lowCount = alerts.filter(p => this.getStatus(p) === 'low').length;
            const buyCount = alerts.filter(p => this.getStatus(p) === 'buy').length;
            const parts = [];
            if (outCount > 0) parts.push(`${outCount} agotado${outCount > 1 ? 's' : ''}`);
            if (lowCount > 0) parts.push(`${lowCount} con stock bajo`);
            if (buyCount > 0) parts.push(`${buyCount} para comprar`);
            this.alertBannerText.textContent = `¡Atención! Tienes ${parts.join(' y ')}`;
        } else {
            this.hideElement(this.alertBanner);
            this.hideElement(this.alertsPanel);
        }
    }

    renderProducts() {
        const filtered = this.getFilteredProducts();

        if (this.products.length === 0) {
            this.hideElement(this.productsGrid);
            this.showElement(this.emptyState);
            return;
        }

        this.hideElement(this.emptyState);
        this.showElement(this.productsGrid);

        if (filtered.length === 0) {
            this.productsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
                    <p>No se encontraron productos con estos filtros</p>
                </div>
            `;
            return;
        }

        const sorted = this.getSortedProducts(filtered);
        this.productsGrid.innerHTML = sorted.map(p => this.renderProductCard(p)).join('');
        this.bindProductEvents();
    }

    renderProductCard(product) {
        const status = this.getStatus(product);
        const cat = this.categories[product.category] || this.categories.otros;
        const percentage = product.minQuantity > 0
            ? Math.min(100, Math.round((product.quantity / (product.minQuantity * 3)) * 100))
            : (product.quantity > 0 ? 100 : 0);

        const fillClass = status === 'out' ? 'fill-out' : status === 'low' || status === 'buy' ? 'fill-low' : '';

        const buyButtonLabel = product.needed ? '✅ En lista' : '🛒 Comprar';
        const buyButtonTitle = product.needed ? 'Quitar de la lista de compra' : 'Marcar para comprar';
        const buyButtonClass = `btn-qty btn-buy${product.needed ? ' active' : ''}`;

        return `
            <div class="product-card status-${status}" data-id="${product.id}">
                <div class="product-card-header">
                    <div class="product-card-info">
                        <span class="product-emoji">${cat.emoji}</span>
                        <div class="product-details">
                            <h3 title="${this.escapeHtml(product.name)}">${this.escapeHtml(product.name)}</h3>
                            <span class="product-category-tag">${cat.label}</span>
                        </div>
                    </div>
                    <div class="product-card-actions">
                        <button class="btn-icon btn-edit" data-id="${product.id}" title="Editar" aria-label="Editar ${this.escapeHtml(product.name)}">✏️</button>
                        <button class="btn-icon btn-delete" data-id="${product.id}" title="Eliminar" aria-label="Eliminar ${this.escapeHtml(product.name)}">🗑️</button>
                    </div>
                </div>
                <div class="product-card-body">
                    <div class="product-stock-bar">
                        <div class="product-stock-fill ${fillClass}" style="width: ${percentage}%"></div>
                    </div>
                    <div class="product-stock-info">
                        <div>
                            <span class="product-quantity">${product.quantity}</span>
                            <span class="product-quantity-unit">${product.unit}</span>
                        </div>
                        <div class="product-min-label">
                            Mínimo: <span>${product.minQuantity}</span>
                            <br>
                            <span class="product-status-badge status-${status}">${this.getStatusLabel(status)}</span>
                        </div>
                    </div>
                </div>
                <div class="product-card-footer">
                    <button class="btn-qty btn-minus" data-id="${product.id}" data-delta="-1" aria-label="Usar ${this.escapeHtml(product.name)}">
                        − Usar
                    </button>
                    <button class="${buyButtonClass}" data-id="${product.id}" data-action="toggle-buy" title="${buyButtonTitle}" aria-label="${buyButtonTitle} ${this.escapeHtml(product.name)}">
                        ${buyButtonLabel}
                    </button>
                    <button class="btn-qty btn-plus" data-id="${product.id}" data-delta="1" aria-label="Reponer ${this.escapeHtml(product.name)}">
                        + Reponer
                    </button>
                </div>
            </div>
        `;
    }

    bindProductEvents() {
        // Edit
        this.productsGrid.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => this.openModal(btn.dataset.id));
        });

        // Delete
        this.productsGrid.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => this.deleteProduct(btn.dataset.id));
        });

        // Quantity change
        this.productsGrid.querySelectorAll('.btn-qty').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'toggle-buy') {
                    return this.toggleBuyStatus(btn.dataset.id);
                }
                this.changeQuantity(btn.dataset.id, parseInt(btn.dataset.delta));
            });
        });
    }

    // ─── Toast Notifications ─────────────────
    showToast(type, message) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '🔴'}</span>
            <span>${this.escapeHtml(message)}</span>
        `;
        this.toastContainer.appendChild(toast);
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 3000);
    }

    exportBuyListText() {
        const buyProducts = this.products.filter(p => this.getStatus(p) === 'buy');
        if (buyProducts.length === 0) {
            this.showToast('warning', 'No hay productos en la lista de compra');
            return;
        }

        const lines = buyProducts.map(p => `- ${p.quantity} ${p.unit} ${p.name}${p.category ? ` (${this.categories[p.category]?.label || p.category})` : ''}`);
        const text = `Lista de compra\nFecha: ${new Date().toLocaleDateString('es-ES')}\n\n${lines.join('\n')}\n\nGenerado con No Hay Mercado`;

        this.copyTextToClipboard(text)
            .then(() => {
                this.showToast('success', 'Lista de compra copiada al portapapeles');
            })
            .catch(() => {
                this.promptExportText(text);
            });
    }

    copyTextToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }

        return new Promise((resolve, reject) => {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'absolute';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();

            try {
                const successful = document.execCommand('copy');
                document.body.removeChild(textarea);
                successful ? resolve() : reject();
            } catch (err) {
                document.body.removeChild(textarea);
                reject(err);
            }
        });
    }

    promptExportText(text) {
        window.prompt('Copia el siguiente texto para tu lista de compra:', text);
    }

    // ─── Utilities ───────────────────────────
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ─── Initialize ──────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DespensaApp();
});
