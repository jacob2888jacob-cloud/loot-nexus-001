// Admin dashboard: login gate + order list/status management.
(function () {
    const loginView = document.getElementById('admin-login');
    const dashboardView = document.getElementById('admin-dashboard');
    const loginForm = document.getElementById('admin-login-form');
    const loginError = document.getElementById('admin-login-error');
    const passwordInput = document.getElementById('admin-password');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const ordersDiv = document.getElementById('admin-orders');
    const tabs = document.getElementById('admin-tabs');
    const refreshBtn = document.getElementById('admin-refresh');
    const logoutBtn = document.getElementById('admin-logout');

    let allOrders = [];
    let activeStatus = 'all';

    function show(el) { el.classList.remove('hidden'); }
    function hide(el) { el.classList.add('hidden'); }

    async function checkSession() {
        try {
            const res = await fetch('/api/admin/me');
            const data = await res.json();
            if (data.authenticated) {
                show(dashboardView);
                hide(loginView);
                loadOrders();
            } else {
                show(loginView);
                hide(dashboardView);
            }
        } catch (err) {
            show(loginView);
            hide(dashboardView);
        }
    }

    togglePasswordBtn.addEventListener('click', () => {
        const showing = passwordInput.type === 'text';
        passwordInput.type = showing ? 'password' : 'text';
        togglePasswordBtn.innerHTML = showing ? "<i class='bx bx-hide'></i>" : "<i class='bx bx-show'></i>";
        togglePasswordBtn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
        togglePasswordBtn.setAttribute('aria-pressed', String(!showing));
        passwordInput.focus();
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hide(loginError);
        const password = document.getElementById('admin-password').value;
        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            if (!res.ok) {
                loginError.textContent = 'Incorrect password. Try again.';
                show(loginError);
                return;
            }
            document.getElementById('admin-password').value = '';
            show(dashboardView);
            hide(loginView);
            loadOrders();
        } catch (err) {
            loginError.textContent = 'Something went wrong. Please try again.';
            show(loginError);
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        show(loginView);
        hide(dashboardView);
    });

    tabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.admin-tab');
        if (!btn || btn.id === 'admin-refresh') return;
        tabs.querySelectorAll('.admin-tab').forEach((t) => t.classList.remove('active'));
        btn.classList.add('active');
        activeStatus = btn.dataset.status;
        renderOrders();
    });

    refreshBtn.addEventListener('click', loadOrders);

    async function loadOrders() {
        ordersDiv.innerHTML = '<p class="admin-empty">Loading orders…</p>';
        try {
            const res = await fetch('/api/orders');
            if (res.status === 401) {
                show(loginView);
                hide(dashboardView);
                return;
            }
            const data = await res.json();
            allOrders = data.orders || [];
            renderStats();
            renderOrders();
        } catch (err) {
            ordersDiv.innerHTML = '<p class="admin-empty">Failed to load orders. Try refreshing.</p>';
        }
    }

    function renderStats() {
        const pending = allOrders.filter((o) => o.status === 'pending').length;
        const processing = allOrders.filter((o) => o.status === 'processing').length;
        const completed = allOrders.filter((o) => o.status === 'completed');
        const revenue = completed.reduce((sum, o) => sum + Number(o.total), 0);

        document.getElementById('stat-pending').textContent = pending;
        document.getElementById('stat-processing').textContent = processing;
        document.getElementById('stat-completed').textContent = completed.length;
        document.getElementById('stat-revenue').textContent = `$${revenue.toFixed(2)}`;
    }

    function renderOrders() {
        const list =
            activeStatus === 'all' ? allOrders : allOrders.filter((o) => o.status === activeStatus);

        if (list.length === 0) {
            ordersDiv.innerHTML = '<p class="admin-empty">No orders here.</p>';
            return;
        }

        ordersDiv.innerHTML = '';
        list.forEach((order) => {
            const card = document.createElement('div');
            card.className = 'admin-order';

            const itemsHtml = order.items
                .map((i) => `<li>${escapeHtml(i.name)} — $${Number(i.price).toFixed(2)}</li>`)
                .join('');

            const created = new Date(order.created_at).toLocaleString();

            card.innerHTML = `
                <div class="admin-order-top">
                    <span class="admin-order-id">Order #${order.id}</span>
                    <span class="admin-badge admin-badge-${order.status}">${order.status}</span>
                </div>
                <ul class="admin-order-items">${itemsHtml}</ul>
                <div class="admin-order-meta">
                    <span><strong>Total:</strong> $${Number(order.total).toFixed(2)}</span>
                    <span><strong>Contact:</strong> ${order.contact ? escapeHtml(order.contact) : '—'}</span>
                    <span><strong>Placed:</strong> ${created}</span>
                </div>
                <div class="admin-order-actions">
                    <label>Status:
                        <select data-id="${order.id}" class="admin-status-select">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </label>
                </div>
            `;
            ordersDiv.appendChild(card);
        });

        ordersDiv.querySelectorAll('.admin-status-select').forEach((select) => {
            select.addEventListener('change', async (e) => {
                const id = e.target.dataset.id;
                const status = e.target.value;
                e.target.disabled = true;
                try {
                    const res = await fetch(`/api/orders/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status }),
                    });
                    if (!res.ok) throw new Error('Update failed');
                    const data = await res.json();
                    const idx = allOrders.findIndex((o) => o.id === data.order.id);
                    if (idx !== -1) allOrders[idx] = data.order;
                    renderStats();
                    renderOrders();
                } catch (err) {
                    alert('Failed to update order status. Please try again.');
                    e.target.disabled = false;
                }
            });
        });
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    checkSession();
})();
