/* ============================================================
   STORE – API Client + Auth Session
   Sistema Saúde Essencial CRM
   ============================================================ */

export const API_URL = window.SE_API_URL || '';

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
        if (res.status === 403 && data.code === 'SUBSCRIPTION_REQUIRED') {
            window.dispatchEvent(new CustomEvent('subscription:required'));
        }
        throw new Error(data.error || `Erro ${res.status}`);
    }
    return data;
}

// ── Field name normalizers ───────────────────────────────────
// API uses snake_case (nome, telefone, data_nascimento...)
// Frontend uses camelCase (name, phone, birthdate...)
export function normalizeClient(c) {
    if (!c) return c;
    return {
        ...c,
        name: c.nome || c.name || '',
        phone: c.telefone || c.phone || '',
        birthdate: c.data_nascimento || c.birthdate || '',
        city: c.cidade || c.city || '',
        notes: c.observacoes || c.notes || '',
        status: c.status || 'active',
    };
}

export function clientToApi(data) {
    return {
        nome: data.name || data.nome || '',
        email: data.email || '',
        telefone: data.phone || data.telefone || '',
        data_nascimento: data.birthdate || data.data_nascimento || null,
        cidade: data.city || data.cidade || '',
        observacoes: data.notes || data.observacoes || '',
        status: data.status || 'active',
    };
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
    get isAdmin() { return this._current?.role === 'admin'; },
};

// ── Store (API wrappers — all return Promises) ───────────────
export const store = {
    /* ---- CLIENTS ---- */
    async getClients(_cid) {
        const list = await api('GET', '/api/clientes');
        return (Array.isArray(list) ? list : []).map(normalizeClient);
    },
    async addClient(_cid, data) {
        const body = data ? clientToApi(data) : clientToApi(_cid); // allow 1 or 2 args
        const res = await api('POST', '/api/clientes', body);
        return normalizeClient(res);
    },
    async updateClient(_cidOrId, idOrData, data) {
        // Support both (cid, id, data) and (id, data) signatures
        const [id, payload] = data !== undefined ? [idOrData, data] : [_cidOrId, idOrData];
        const res = await api('PUT', `/api/clientes/${id}`, clientToApi(payload));
        return normalizeClient(res);
    },
    async deleteClient(_cidOrId, id) {
        const actualId = id !== undefined ? id : _cidOrId;
        return api('DELETE', `/api/clientes/${actualId}`);
    },

    /* ---- ANAMNESES ---- */
    async getAnamneses(_cid) {
        const list = await api('GET', '/api/anamneses');
        return Array.isArray(list) ? list : [];
    },
    createAnamnesis(data) { return api('POST', '/api/anamneses', data); },
    deleteAnamnesis(id) { return api('DELETE', `/api/anamneses/${id}`); },
    getPublicAnamnesis(token) { return api('GET', `/api/anamneses/public/${token}`); },
    submitAnamnesis(token, dados) { return api('PUT', `/api/anamneses/public/${token}`, { dados }); },

    /* ---- AGENDAMENTOS ---- */
    async getAgendamentos(_cid) {
        const list = await api('GET', '/api/agendamentos');
        return Array.isArray(list) ? list : [];
    },
    getSchedule(_cid) { return this.getAgendamentos(_cid); },
    addAgendamento(data) { return api('POST', '/api/agendamentos', data); },
    updateAgendamento(id, data) { return api('PUT', `/api/agendamentos/${id}`, data); },
    deleteAgendamento(id) { return api('DELETE', `/api/agendamentos/${id}`); },

    /* ---- NOT YET IN BACKEND — return empty arrays ---- */
    getFollowups(_cid) { return Promise.resolve([]); },
    getTestimonials(_cid) { return Promise.resolve([]); },
    getPurchases(_cid) { return Promise.resolve([]); },
    addPurchase(_cid, _data) { return Promise.resolve({}); },

    /* ---- STATS (computed client-side) ---- */
    async getStats(_cid) { return {}; }, // will compute in Dashboard

    /* ---- ASSINATURA ---- */
    getAssinatura() { return api('GET', '/api/assinatura/status'); },
    checkout(plano) { return api('POST', '/api/assinatura/checkout', { plano }); },
};
