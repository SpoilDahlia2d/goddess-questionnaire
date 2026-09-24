document.addEventListener('DOMContentLoaded', () => {
  const loginView = document.getElementById('login-view');
  const dashboardView = document.getElementById('dashboard-view');
  const loginForm = document.getElementById('login-form');
  const passwordInput = document.getElementById('password');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');

  const webhookUrlInput = document.getElementById('webhook-url');
  const webhookBadge = document.getElementById('webhook-badge');
  const saveDiscordBtn = document.getElementById('save-discord-btn');
  const testDiscordBtn = document.getElementById('test-discord-btn');

  const submissionsTableBody = document.getElementById('submissions-table-body');
  const noSubmissions = document.getElementById('no-submissions');
  const submissionsCount = document.getElementById('submissions-count');
  const refreshBtn = document.getElementById('refresh-btn');
  const exportCsvBtn = document.getElementById('export-csv-btn');

  const detailModal = document.getElementById('detail-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modalSubId = document.getElementById('modal-sub-id');
  const modalContent = document.getElementById('modal-content');
  const toast = document.getElementById('toast');

  let currentSubmissions = [];

  function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.classList.remove('hidden', 'bg-emerald-600', 'bg-rose-700', 'bg-onyx-700', 'text-white', 'text-black', 'border-emerald-500', 'border-rose-600');
    if (type === 'success') {
      toast.classList.add('bg-emerald-600', 'text-white', 'border', 'border-emerald-500');
    } else if (type === 'error') {
      toast.classList.add('bg-rose-700', 'text-white', 'border', 'border-rose-600');
    } else {
      toast.classList.add('bg-onyx-700', 'text-slate-100', 'border', 'border-gold-500/40');
    }
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3500);
  }

  function getAuthToken() {
    return sessionStorage.getItem('admin_token') || '';
  }

  function setAuthToken(token) {
    sessionStorage.setItem('admin_token', token);
  }

  function clearAuth() {
    sessionStorage.removeItem('admin_token');
    loginView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
    passwordInput.value = '';
  }

  if (getAuthToken()) {
    initDashboard();
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    const pwd = passwordInput.value.trim();

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthToken(data.token);
        initDashboard();
      } else {
        loginError.textContent = data.error || 'Invalid master key for the Throne';
        loginError.classList.remove('hidden');
      }
    } catch (err) {
      loginError.textContent = 'Server connection error';
      loginError.classList.remove('hidden');
    }
  });

  logoutBtn.addEventListener('click', clearAuth);

  async function initDashboard() {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    await loadConfig();
    await loadSubmissions();
  }

  async function loadConfig() {
    try {
      const res = await fetch('/api/admin/config', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (res.status === 401 || res.status === 403) {
        clearAuth();
        return;
      }
      const data = await res.json();
      webhookUrlInput.value = data.discordWebhookUrl || '';
      updateWebhookBadge(data.webhookConfigured);
    } catch (err) {
      console.error('Error loading config:', err);
    }
  }

  function updateWebhookBadge(isConfigured) {
    if (isConfigured) {
      webhookBadge.textContent = 'Discord Connected';
      webhookBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800';
    } else {
      webhookBadge.textContent = 'Not Configured';
      webhookBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-950 text-amber-400 border border-amber-800';
    }
  }

  saveDiscordBtn.addEventListener('click', async () => {
    const url = webhookUrlInput.value.trim();
    saveDiscordBtn.disabled = true;
    saveDiscordBtn.textContent = 'Saving...';

    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ discordWebhookUrl: url })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Webhook saved successfully!');
        updateWebhookBadge(data.webhookConfigured);
      } else {
        showToast(data.error || 'Save failed', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      saveDiscordBtn.disabled = false;
      saveDiscordBtn.textContent = 'Save Webhook';
    }
  });

  testDiscordBtn.addEventListener('click', async () => {
    const url = webhookUrlInput.value.trim();
    if (!url) {
      showToast('Enter a valid Webhook URL first!', 'error');
      return;
    }
    testDiscordBtn.disabled = true;
    testDiscordBtn.textContent = 'Dispatching...';

    try {
      const res = await fetch('/api/admin/test-discord', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ webhookUrl: url })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Test embed dispatched to Discord!');
      } else {
        showToast(data.error || 'Test delivery failed', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      testDiscordBtn.disabled = false;
      testDiscordBtn.textContent = 'Dispatch Test Embed';
    }
  });

  async function loadSubmissions() {
    try {
      const res = await fetch('/api/admin/submissions', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (res.status === 401 || res.status === 403) {
        clearAuth();
        return;
      }
      currentSubmissions = await res.json();
      renderSubmissions(currentSubmissions);
    } catch (err) {
      console.error('Error loading submissions:', err);
    }
  }

  function renderSubmissions(items) {
    submissionsCount.textContent = items.length;
    submissionsTableBody.innerHTML = '';

    if (!items || items.length === 0) {
      noSubmissions.classList.remove('hidden');
      return;
    }
    noSubmissions.classList.add('hidden');

    items.forEach((item) => {
      const d = item.data || {};
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-onyx-700/40 transition-colors border-b border-onyx-700/60';

      const dateStr = new Date(item.createdAt).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      const proofBadge = d.proofImageUrl
        ? `<span class="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">📸 Proof</span>`
        : `<span class="text-[10px] text-slate-500">No image</span>`;

      tr.innerHTML = `
        <td class="py-3 px-4 font-mono">
          <div class="font-bold text-gold-400 text-[11px]">${item.id}</div>
          <div class="text-[10px] text-slate-500 mt-0.5">${dateStr}</div>
        </td>
        <td class="py-3 px-4 font-bold text-slate-100">
          <div class="text-sm text-gold-200">${escapeHtml(d.slaveName || '-')}</div>
          <div class="text-[11px] text-slate-400 font-normal">${escapeHtml(d.age || '-')} yrs • ${escapeHtml(d.occupation || '-')}</div>
        </td>
        <td class="py-3 px-4">
          <div class="text-[#5865F2] font-semibold font-mono text-xs">${escapeHtml(d.discordTag || '-')}</div>
          <div class="text-slate-500 text-[11px]">${escapeHtml(d.altContact || 'No secondary contact')}</div>
        </td>
        <td class="py-3 px-4">
          <span class="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-gold-500/10 text-gold-300 border border-gold-500/30">
            ${escapeHtml(d.monthlyBudget || '-')}
          </span>
          <div class="mt-1">${proofBadge}</div>
        </td>
        <td class="py-3 px-4">
          <span class="inline-block text-xs text-slate-300 max-w-[180px] truncate" title="${escapeHtml(d.devotionType || '-')}">
            ${escapeHtml(d.devotionType || '-')}
          </span>
        </td>
        <td class="py-3 px-4 text-right space-x-1 whitespace-nowrap">
          <button data-id="${item.id}" class="view-btn px-2.5 py-1 rounded-lg text-gold-400 hover:bg-gold-500/10 font-bold transition text-xs">
            Dossier
          </button>
          <button data-id="${item.id}" class="delete-btn px-2 py-1 rounded-lg text-rose-500 hover:bg-rose-950/40 hover:text-rose-400 transition text-xs">
            Purge
          </button>
        </td>
      `;
      submissionsTableBody.appendChild(tr);
    });

    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = currentSubmissions.find(s => s.id === id);
        if (item) openDetailModal(item);
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`Are you sure you want to permanently purge dossier ${id}?`)) {
          await deleteSubmission(id);
        }
      });
    });
  }

  async function deleteSubmission(id) {
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        showToast('Dossier purged.');
        await loadSubmissions();
      } else {
        showToast('Error purging submission', 'error');
      }
    } catch (e) {
      showToast('Connection error', 'error');
    }
  }

  function openDetailModal(item) {
    const d = item.data || {};
    modalSubId.textContent = `ID: ${item.id} • Received on ${new Date(item.createdAt).toLocaleString('en-US')}`;
    
    const payMethods = Array.isArray(d.paymentMethods) ? d.paymentMethods.join(', ') : (d.paymentMethods || '-');

    const proofHtml = d.proofImageUrl
      ? `
        <div class="p-3.5 rounded-xl bg-onyx-700/60 border border-emerald-500/40">
          <span class="text-[10px] text-emerald-400 block uppercase font-bold tracking-wider mb-2">📸 Uploaded Tribute Proof / Screenshot</span>
          <a href="${escapeHtml(d.proofImageUrl)}" target="_blank" class="inline-block">
            <img src="${escapeHtml(d.proofImageUrl)}" class="max-h-56 rounded-xl border border-onyx-600 hover:opacity-90 transition object-contain bg-black/50 p-1">
          </a>
        </div>
      `
      : '';

    let html = `
      <div class="grid grid-cols-2 gap-3 p-4 bg-onyx-700/60 rounded-2xl border border-onyx-600 mb-4">
        <div>
          <span class="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Devotee Title</span>
          <span class="font-bold text-gold-300 text-sm">${escapeHtml(d.slaveName || '-')}</span>
        </div>
        <div>
          <span class="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Discord Handle</span>
          <span class="font-mono text-[#5865F2] font-bold text-sm">${escapeHtml(d.discordTag || '-')}</span>
        </div>
        <div>
          <span class="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Age & Career</span>
          <span class="font-medium text-slate-200 text-xs">${escapeHtml(d.age || '-')} yrs • ${escapeHtml(d.occupation || '-')}</span>
        </div>
        <div>
          <span class="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Secondary Handle</span>
          <span class="font-medium text-slate-200 text-xs">${escapeHtml(d.altContact || 'None')}</span>
        </div>
      </div>

      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div class="p-3.5 rounded-xl bg-onyx-700/40 border border-onyx-600">
            <span class="text-[10px] text-gold-400 block uppercase font-bold tracking-wider">Monthly Tribute Budget</span>
            <p class="font-bold text-slate-100 text-sm mt-0.5">${escapeHtml(d.monthlyBudget || '-')}</p>
          </div>
          <div class="p-3.5 rounded-xl bg-onyx-700/40 border border-onyx-600">
            <span class="text-[10px] text-gold-400 block uppercase font-bold tracking-wider">Lifetime Tribute Target</span>
            <p class="font-bold text-slate-100 text-xs mt-0.5">${escapeHtml(d.tributeMilestone || 'Not declared')}</p>
          </div>
        </div>

        <div class="p-3.5 rounded-xl bg-onyx-700/40 border border-onyx-600">
          <span class="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Channels & Financial Allocation</span>
          <p class="font-medium text-slate-200 text-xs mt-0.5">
            <strong>Channels:</strong> ${escapeHtml(payMethods)}<br>
            <strong>Discretionary Surrender:</strong> ${escapeHtml(d.savingsSacrifice || 'Standard')}<br>
            <strong>Schedule:</strong> ${escapeHtml(d.tributeFrequency || 'Flexible')}
          </p>
        </div>

        <div class="p-3.5 rounded-xl bg-onyx-700/40 border border-onyx-600">
          <span class="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Worship & Protocol Dynamics</span>
          <p class="font-medium text-slate-200 text-xs mt-0.5">
            <strong>Dynamic:</strong> ${escapeHtml(d.devotionType || '-')}<br>
            <strong>Ritual:</strong> ${escapeHtml(d.worshipRitual || 'Standard')}<br>
            <strong>Check-ins:</strong> ${escapeHtml(d.checkInFrequency || 'On demand')}<br>
            <strong>Spending Accountability:</strong> ${escapeHtml(d.spendingApproval || 'Standard')}
          </p>
        </div>

        <div class="p-3.5 rounded-xl bg-onyx-700/40 border border-onyx-600">
          <span class="text-[10px] text-gold-400 block uppercase font-bold tracking-wider">Initial Tribute Verification</span>
          <p class="font-medium text-slate-200 text-xs mt-0.5">
            <strong>Status:</strong> ${escapeHtml(d.initialTributeStatus || 'Pending')}<br>
            <strong>Reference:</strong> ${escapeHtml(d.tributeTxId || 'None')}
          </p>
        </div>

        ${proofHtml}

        <div class="p-3.5 rounded-xl bg-onyx-700/40 border border-onyx-600">
          <span class="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Psychological Triggers & Cravings</span>
          <p class="font-medium text-slate-200 text-xs mt-0.5">${escapeHtml(d.weaknesses || 'None specified.')}</p>
        </div>

        <div class="p-3.5 rounded-xl bg-onyx-700/40 border border-gold-500/20">
          <span class="text-[10px] text-gold-400 block uppercase font-bold tracking-wider mb-1">Solemn Letter of Devotion</span>
          <p class="text-xs text-slate-200 italic font-serif leading-relaxed whitespace-pre-wrap">"${escapeHtml(d.letter || 'No letter submitted.')}"</p>
        </div>

        <div class="p-3.5 rounded-xl bg-onyx-700/40 border border-onyx-600">
          <span class="text-[10px] text-rose-400 block uppercase font-bold tracking-wider">Boundaries & Hard Limits</span>
          <p class="text-xs text-slate-300 mt-0.5">${escapeHtml(d.boundaries || 'None stated.')}</p>
        </div>
      </div>
    `;

    modalContent.innerHTML = html;
    detailModal.classList.remove('hidden');
  }

  closeModalBtn.addEventListener('click', () => {
    detailModal.classList.add('hidden');
  });

  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) detailModal.classList.add('hidden');
  });

  exportCsvBtn.addEventListener('click', () => {
    window.location.href = `/api/admin/export-csv?token=${encodeURIComponent(getAuthToken())}`;
  });

  refreshBtn.addEventListener('click', loadSubmissions);

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
