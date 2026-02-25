/* ============================================================
   STORE – API Client + Auth Session
   Sistema Saúde Essencial CRM
   ============================================================ */

export const API_URL = window.SE_API_URL || 'http://localhost:3001';

// ── HTTP helper ──────────────────────────────────────────────
export async function api(method, path, body = null) {
    const token = sessionStorage.getItem('se_token');
    const opts = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_URL}${path}`, opts);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        // If subscription expired, redirect to subscription page
        if (res.status === 403 && data.code === 'SUBSCRIPTION_REQUIRED') {
            window.dispatchEvent(new CustomEvent('subscription:required'));
        }
        throw new Error(data.error || `Erro ${res.status}`);
    }
    return data;
}

// ── Auth ─────────────────────────────────────────────────────
export const auth = {
    _current: null,

    init() {
        const token = sessionStorage.getItem('se_token');
        const user = sessionStorage.getItem('se_user');
        if (token && user) {
            try { this._current = JSON.parse(user); } catch { }
        }
    },

    async login(email, senha) {
        const data = await api('POST', '/api/auth/login', { email, senha });
        sessionStorage.setItem('se_token', data.token);
        sessionStorage.setItem('se_user', JSON.stringify(data.consultora));
        this._current = data.consultora;
        return data;
    },

    async register(nome, email, senha, telefone) {
        const data = await api('POST', '/api/auth/register', { nome, email, senha, telefone });
        sessionStorage.setItem('se_token', data.token);
        sessionStorage.setItem('se_user', JSON.stringify(data.consultora));
        this._current = data.consultora;
        return data;
    },

    async refresh() {
        try {
            const data = await api('GET', '/api/auth/me');
            this._current = data;
            sessionStorage.setItem('se_user', JSON.stringify(data));
            return data;
        } catch { return null; }
    },

    logout() {
        this._current = null;
        sessionStorage.removeItem('se_token');
        sessionStorage.removeItem('se_user');
    },

    get current() { return this._current; },
    get isLoggedIn() { return !!this._current; },
};

// ── Store (API wrappers) ──────────────────────────────────────
export const store = {
    /* ---- CLIENTS ---- */
    getClients() { return api('GET', '/api/clientes'); },
    addClient(data) { return api('POST', '/api/clientes', data); },
    updateClient(id, data) { return api('PUT', `/api/clientes/${id}`, data); },
    deleteClient(id) { return api('DELETE', `/api/clientes/${id}`); },

    /* ---- ANAMNESES ---- */
    getAnamneses() { return api('GET', '/api/anamneses'); },
    createAnamnesis(data) { return api('POST', '/api/anamneses', data); },
    deleteAnamnesis(id) { return api('DELETE', `/api/anamneses/${id}`); },

    // Public (no auth)
    getPublicAnamnesis(token) { return api('GET', `/api/anamneses/public/${token}`); },
    submitAnamnesis(token, dados) { return api('PUT', `/api/anamneses/public/${token}`, { dados }); },

    /* ---- AGENDAMENTOS ---- */
    getAgendamentos() { return api('GET', '/api/agendamentos'); },
    addAgendamento(data) { return api('POST', '/api/agendamentos', data); },
    updateAgendamento(id, data) { return api('PUT', `/api/agendamentos/${id}`, data); },
    deleteAgendamento(id) { return api('DELETE', `/api/agendamentos/${id}`); },

    /* ---- ASSINATURA ---- */
    getAssinatura() { return api('GET', '/api/assinatura/status'); },
    checkout(plano) { return api('POST', '/api/assinatura/checkout', { plano }); },
};
