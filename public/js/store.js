/* ============================================================
   STORE – API Client + Auth Session
   Sistema Saúde Essencial CRM
   ============================================================ */

export const API_URL = window.SE_API_URL || '';

// ── HTTP helper ──────────────────────────────────────────────
export async function api(method, path, body = null) {
    const token = sessionStorage.getItem('se_token');
    const csrfToken = sessionStorage.getItem('se_csrf');
    const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const opts = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(isMutating && csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_URL}${path}`, opts);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        if (res.status === 403 && data.code === 'SUBSCRIPTION_REQUIRED') {
            window.dispatchEvent(new CustomEvent('subscription:required'));
        }
        if (res.status === 401) {
            // Sessão expirada ou revogada — limpa a sessão local e redireciona para login
            sessionStorage.removeItem('se_token');
            sessionStorage.removeItem('se_csrf');
            sessionStorage.removeItem('se_user');
            // Só redireciona se não estiver já na tela de login
            if (!window.location.hash?.includes('/login') && window.location.hash !== '#/') {
                window.location.hash = '/';
            }
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
        genero: c.genero || 'feminino',
        protocolo_mensagem: c.protocolo_mensagem || '',
        indicado_por_id: c.indicado_por_id || null,
        indicador_nome: c.indicador_nome || null,
    };
}

export function clientToApi(data) {
    const apiObj = {};
    
    // Only includes fields that are present in the payload. 
    // Converts empty strings to null for optional nullable fields in Zod.
    if ('name' in data || 'nome' in data) apiObj.nome = data.name || data.nome || '';
    if ('email' in data) apiObj.email = data.email || null;
    if ('phone' in data || 'telefone' in data) apiObj.telefone = data.phone || data.telefone || null;
    if ('birthdate' in data || 'data_nascimento' in data) apiObj.data_nascimento = data.birthdate || data.data_nascimento || null;
    if ('city' in data || 'cidade' in data) apiObj.cidade = data.city || data.cidade || null;
    
    const notas = data.notes !== undefined ? data.notes : (data.notas !== undefined ? data.notas : data.observacoes);
    if (notas !== undefined) apiObj.notas = notas || null;
    
    if ('status' in data) apiObj.status = data.status;
    if ('genero' in data) apiObj.genero = data.genero;
    if ('protocolo_mensagem' in data) apiObj.protocolo_mensagem = data.protocolo_mensagem || null;
    if ('pipeline_stage' in data) apiObj.pipeline_stage = data.pipeline_stage;
    if ('tipo_cadastro' in data) apiObj.tipo_cadastro = data.tipo_cadastro;
    if ('indicado_por_id' in data) apiObj.indicado_por_id = data.indicado_por_id;

    return apiObj;
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
        if (data.needs_terms_acceptance) {
            return data;
        }
        sessionStorage.setItem('se_token', data.token);
        if (data.csrfToken) sessionStorage.setItem('se_csrf', data.csrfToken);
        sessionStorage.setItem('se_user', JSON.stringify(data.consultora));
        this._current = data.consultora;
        return data;
    },

    async acceptTerms(email) {
        const data = await api('POST', '/api/auth/accept-terms', { email });
        sessionStorage.setItem('se_token', data.token);
        if (data.csrfToken) sessionStorage.setItem('se_csrf', data.csrfToken);
        sessionStorage.setItem('se_user', JSON.stringify(data.consultora));
        this._current = data.consultora;
        return data;
    },

    async register(nome, email, senha, telefone, genero, termos_aceitos) {
        const data = await api('POST', '/api/auth/register', { nome, email, senha, telefone, genero, termos_aceitos });
        sessionStorage.setItem('se_token', data.token);
        if (data.csrfToken) sessionStorage.setItem('se_csrf', data.csrfToken);
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

    async logout() {
        // Notify server to bump token_version — revokes all other active sessions
        try {
            const token = sessionStorage.getItem('se_token');
            const csrf = sessionStorage.getItem('se_csrf');
            if (token) {
                await fetch(`${API_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
                    },
                });
            }
        } catch { /* silent — always clear local session */ }
        this._current = null;
        sessionStorage.removeItem('se_token');
        sessionStorage.removeItem('se_csrf');
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
    async getClient(id) {
        const res = await api('GET', `/api/clientes/${id}`);
        return normalizeClient(res);
    },
    /**
     * Paginated client fetching — sends ?page=&limit=&q=&ativo= to backend.
     * Returns { data: Client[], total, page, limit, totalPages }.
     */
    async getClientsPaginated({ page = 1, limit = 50, q = '', ativo = 'all' } = {}) {
        const params = new URLSearchParams({ page, limit, ativo });
        if (q) params.set('q', q);
        const res = await api('GET', `/api/clientes?${params}`);
        // Backend responds { data, total, page, limit, totalPages }
        if (res && Array.isArray(res.data)) {
            return { ...res, data: res.data.map(normalizeClient) };
        }
        // Fallback if backend returned flat array (shouldn't happen with page param)
        const list = Array.isArray(res) ? res : [];
        return { data: list.map(normalizeClient), total: list.length, page: 1, limit, totalPages: 1 };
    },
    async getAniversariantes() {
        const list = await api('GET', '/api/dashboard/aniversariantes');
        return Array.isArray(list) ? list : [];
    },
    async getDashboardSummary() {
        return await api('GET', '/api/dashboard/summary');
    },
    async getDashboardBoot() {
        return await api('GET', '/api/dashboard/boot');
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
    async updateStage(id, stage, notas, motivo_perda) {
        return api('PATCH', `/api/clientes/${id}/stage`, { stage, notas, motivo_perda });
    },
    async updateRecrutamentoStage(id, stage, notas, motivo_perda) {
        return api('PATCH', `/api/clientes/${id}/recrutamento-stage`, { stage, notas, motivo_perda });
    },
    async deleteClient(_cidOrId, id) {
        const actualId = id !== undefined ? id : _cidOrId;
        return api('DELETE', `/api/clientes/${actualId}`);
    },
    async deleteClientHard(_cidOrId, id) {
        const actualId = id !== undefined ? id : _cidOrId;
        return api('DELETE', `/api/clientes/${actualId}/hard`);
    },

    /* ---- ANAMNESES ---- */
    async getAnamneses(_cid) {
        const list = await api('GET', '/api/anamneses');
        return Array.isArray(list) ? list : [];
    },
    getAnamnesisFull(id) { return api('GET', `/api/anamneses/${id}`); },
    getClientAnamneses(clienteId) { return api('GET', `/api/anamneses/cliente/${clienteId}`); },
    createAnamnesis(data) { return api('POST', '/api/anamneses', data); },
    deleteAnamnesis(id) { return api('DELETE', `/api/anamneses/${id}`); },
    getPublicAnamnesis(token) { return api('GET', `/api/anamneses/public/${token}`); },
    submitAnamnesis(token, dados, refId = null) {
        return api('PUT', `/api/anamneses/public/${token}${refId ? `?ref=${refId}` : ''}`, { dados });
    },
    savePartialLead(token, dados) {
        // Envio silencioso sem bloquear UI (Fire and forget)
        return api('POST', `/api/anamneses/public/${token}/partial`, { dados }).catch(() => {});
    },

    /* ---- AGENDAMENTOS ---- */
    async getAgendamentos(_cid) {
        const list = await api('GET', '/api/agendamentos');
        return Array.isArray(list) ? list : [];
    },
    getSchedule(_cid) { return this.getAgendamentos(_cid); },
    addAgendamento(data) { return api('POST', '/api/agendamentos', data); },
    updateAgendamento(id, data) { return api('PUT', `/api/agendamentos/${id}`, data); },
    deleteAgendamento(id) { return api('DELETE', `/api/agendamentos/${id}`); },

    /* ---- DEPOIMENTOS E ETIQUETAS ---- */
    getTags() { return api('GET', '/api/etiquetas'); },
    addTag(data) { return api('POST', '/api/etiquetas', data); },
    deleteTag(id) { return api('DELETE', `/api/etiquetas/${id}`); },

    getTestimonials() { return api('GET', '/api/depoimentos'); },
    getTestimonialLink() { return api('GET', '/api/depoimentos/link'); },
    addTestimonial(data) { return api('POST', '/api/depoimentos', data); },
    approveTestimonial(id, aprovado) { return api('PATCH', `/api/depoimentos/${id}/aprovar`, { aprovado }); },
    setTestimonialTags(id, etiqueta_ids) { return api('PATCH', `/api/depoimentos/${id}/etiquetas`, { etiqueta_ids }); },
    deleteTestimonial(id) { return api('DELETE', `/api/depoimentos/${id}`); },

    /* ---- FOLLOW-UPS (banco de dados) ---- */
    async getFollowups() {
        const list = await api('GET', '/api/followups');
        return Array.isArray(list) ? list : [];
    },
    addFollowup(data) { return api('POST', '/api/followups', data); },
    updateFollowupStatus(id, status) { return api('PATCH', `/api/followups/${id}/status`, { status }); },
    deleteFollowup(id) { return api('DELETE', `/api/followups/${id}`); },

    getPurchases(_cid) { return Promise.resolve([]); },
    addPurchase(_cid, _data) { return Promise.resolve({}); },

    /* ---- STATS (computed client-side) ---- */
    async getStats(_cid) { return {}; }, // will compute in Dashboard

    /* ---- ASSINATURA ---- */
    getAssinatura() { return api('GET', '/api/assinatura/status'); },
    checkout(plano) { return api('POST', '/api/assinatura/checkout', { plano }); },

    /* ---- PROFILE ---- */
    getProfile() { return api('GET', '/api/auth/profile'); },
    updateProfile(data) { return api('PUT', '/api/auth/profile', data); },

    /* ---- AVISOS DO SISTEMA ---- */
    getAvisosNaoLidos() { return api('GET', '/api/avisos/nao-lidos'); },
    getAvisosBanner() { return api('GET', '/api/avisos/banner'); },
    marcarAvisoLido(id) { return api('POST', `/api/avisos/${id}/lido`); },

    /* ---- PROTOCOLO CUSTOMIZADO ---- */
    saveCustomProtocol(anamneseId, data) {
        return api('PUT', `/api/anamneses/${anamneseId}/protocolo`, { protocolo_customizado: data });
    },
};

