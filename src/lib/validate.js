/**
 * validate.js — Zod schemas + Express middleware
 *
 * Usage:
 *   const { validate, schemas } = require('../lib/validate');
 *   router.post('/route', validate(schemas.login), handler);
 */
const { z } = require('zod');

// ── Reusable primitives ──────────────────────────────────────────────────────
const email = z.string().email('E-mail inválido.').max(254);
const phone = z.string().min(8, 'Telefone muito curto.').max(20).regex(/^[\d\s\-\+\(\)]+$/, 'Telefone inválido.').optional().nullable();
const password = z.string().min(8, 'Senha deve ter no mínimo 8 caracteres.').max(128);
const shortStr = (max = 255) => z.string().trim().min(1).max(max);
const optStr = (max = 255) => z.string().trim().max(max).optional().nullable();
const dateBR = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida. Use YYYY-MM-DD.').optional().nullable();
const genero = z.enum(['masculino', 'feminino']).optional().nullable();

// ── Auth schemas ─────────────────────────────────────────────────────────────
const login = z.object({
    email: email,
    senha: z.string().min(1, 'Senha obrigatória.').max(128),
});

const register = z.object({
    nome: shortStr(100),
    email: email,
    senha: password,
    telefone: phone,
    genero: genero,
});

const changePassword = z.object({
    senhaAtual: z.string().min(1, 'Senha atual obrigatória.').max(128),
    novaSenha: password,
    confirmarSenha: password,
}).refine(d => d.novaSenha === d.confirmarSenha, {
    message: 'A nova senha e a confirmação não coincidem.',
    path: ['confirmarSenha'],
});

const resetPassword = z.object({
    token: z.string().min(1),
    novaSenha: password,
    confirmarSenha: password,
}).refine(d => d.novaSenha === d.confirmarSenha, {
    message: 'As senhas não coincidem.',
    path: ['confirmarSenha'],
});

const forgotPassword = z.object({
    email: email,
});

// ── Cliente schemas ──────────────────────────────────────────────────────────
const createCliente = z.object({
    nome: shortStr(200),
    email: email.optional().nullable(),
    telefone: phone,
    data_nascimento: dateBR,
    cidade: optStr(100),
    notas: optStr(2000),
    status: z.enum(['active', 'inactive', 'lead']).optional().default('active'),
    genero: genero,
    pipeline_stage: optStr(50),
    tipo_cadastro: optStr(50),
    protocolo_mensagem: optStr(1000),
});

const updateCliente = createCliente.partial(); // all fields optional on update

// ── Anamnese payload (client submission) ─────────────────────────────────────
const submitAnamnese = z.object({
    dados: z.record(z.string(), z.unknown())
        .refine(d => typeof d === 'object' && d !== null, { message: 'Dados inválidos.' })
        .refine(d => {
            // Validate nested types that are commonly misused
            if (d.birthdate !== undefined && d.birthdate !== null && typeof d.birthdate !== 'string') return false;
            if (d.full_name !== undefined && typeof d.full_name !== 'string') return false;
            if (d.email !== undefined && d.email !== null && typeof d.email !== 'string') return false;
            if (d.phone !== undefined && d.phone !== null && typeof d.phone !== 'string') return false;
            return true;
        }, { message: 'Campos de dados com tipos inválidos.' }),
});

// ── Middleware factory ────────────────────────────────────────────────────────
/**
 * Returns an Express middleware that validates req.body against the given schema.
 * On failure, responds 400 with { error, fields } — no uncaught exception reaches the route.
 */
function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const issues = result.error.issues;
            const firstMsg = issues[0]?.message || 'Dados inválidos.';
            // Structured field errors for frontend use
            const fields = {};
            issues.forEach(i => {
                const key = i.path.join('.') || '_';
                if (!fields[key]) fields[key] = i.message;
            });
            return res.status(400).json({ error: firstMsg, fields });
        }
        // Replace req.body with the parsed (coerced + stripped) data
        req.body = result.data;
        next();
    };
}

module.exports = {
    validate,
    schemas: {
        login,
        register,
        changePassword,
        resetPassword,
        forgotPassword,
        createCliente,
        updateCliente,
        submitAnamnese,
    },
};
