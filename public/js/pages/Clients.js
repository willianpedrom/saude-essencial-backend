import { auth, store } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { formatDate, getInitials, toast, modal, openClientOffcanvas } from '../utils.js';
import { analyzeAnamnesis, PROTOCOLS, OILS_DATABASE } from '../data.js';

let cachedAnamneses = null; // lazy-load once per session

export async function showAnamneseModal(client, router) {
  // Fetch anamneses directly by client ID (includes filled generic copies)
  const anamneses = await store.getClientAnamneses(client.id).catch(() => []);
  if (anamneses.length === 0) {
    modal('Anamneses de ' + client.name, `
      <div class="empty-state" style="padding:20px 0">
        <div class="empty-state-icon">📋</div>
        <h4>Nenhuma anamnese encontrada</h4>
        <p>Este cliente ainda não preencheu a ficha de anamnese.</p>
      </div>`);
    return;
  }
  const a = anamneses[0]; // most recent filled
  const rawDados = a.dados || {};
  // Garantir que temos acesso a todos os dados flat
  const dados = {
    ...(rawDados.personal || {}),
    ...(rawDados.health || {}),
    ...(rawDados.emotional || {}),
    ...(rawDados.body || {}),
    ...(rawDados.goals || {}),
    ...rawDados // fallback
  };
  
  // Reconstruir objeto aninhado se necessário para garantir a leitura do analyzeAnamnesis
  const nestedForAnalysis = {
    personal: { ...dados },
    health: { general_symptoms: dados.general_symptoms, digestive_symptoms: dados.digestive_symptoms, emotional_symptoms: dados.emotional_symptoms, sleep_symptoms: dados.sleep_symptoms, low_energy_symptoms: dados.low_energy_symptoms, skin_symptoms: dados.skin_symptoms, hair_symptoms: dados.hair_symptoms, chronic_conditions: dados.chronic_conditions },
    goals: { goals: dados.goals, main_complaint: dados.main_complaint }
  };
  
  let analysisResultados = 'Não foi possível gerar prognóstico automático para este perfil.';
  try {
    // Se já vier com rawDados.goals, usa ele (novo formato), caso contrário usa o falso aninhado
    const anamnesisAnalysis = analyzeAnamnesis(rawDados.goals ? rawDados : nestedForAnalysis);
    const uniqueResults = [...new Set(anamnesisAnalysis.protocols.map(p => p.expectedResults).filter(Boolean))];
    if (uniqueResults.length > 0) analysisResultados = uniqueResults.join(' ');
  } catch (e) {
    console.error("Erro processando anamnese no modal:", e);
  }

  // Arrays agregados para tags
  const allSymptoms = [
    ...(dados.general_symptoms || []),
    ...(dados.emotional_symptoms || []),
    ...(dados.digestive_symptoms || []),
    ...(dados.sleep_symptoms || []),
    ...(dados.low_energy_symptoms || []),
    ...(dados.skin_symptoms || []),
    ...(dados.hair_symptoms || [])
  ];
  
  // Função helper para parse seguro
  const printVal = (val) => val ? val : '—';
  const printTagArray = (arr, color='#166534', bg='#dcfce7') => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return '—';
    return arr.map(t => `<span class="report-tag" style="font-size:0.75rem;background:${bg};color:${color}">${t}</span>`).join('');
  };

  const { el } = modal('📋 Anamnese Completa — ' + client.name, `
    <div style="max-height:65vh;overflow-y:auto;padding-right:10px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;background:#f8fafc;padding:12px;border-radius:12px;box-shadow:inset 0 2px 4px rgba(0,0,0,0.02)">
        <div style="font-size:0.85rem"><strong>E-mail:</strong><br>${client.email || '—'}</div>
        <div style="font-size:0.85rem"><strong>WhatsApp:</strong><br>${client.phone || '—'}</div>
        <div style="font-size:0.85rem"><strong>Nascimento:</strong><br>${formatDate(client.birthdate)}</div>
        <div style="font-size:0.85rem"><strong>Cidade:</strong><br>${client.city || '—'}</div>
        <div style="font-size:0.85rem;grid-column: span 2"><strong>Gênero:</strong> ${client.genero || 'Não informado'}</div>
      </div>

      <h4 style="font-size:1rem;color:#0f172a;margin-bottom:12px;border-bottom:2px solid #e2e8f0;padding-bottom:4px;">Relatos Abertos & Queixas</h4>
      
      <div style="margin-bottom:12px">
        <strong style="font-size:0.85rem;color:#1e293b;">Queixa Principal:</strong>
        <p style="font-size:0.85rem;color:#475569;margin-top:4px;background:#f1f5f9;padding:10px;border-radius:8px;white-space:pre-wrap;">${printVal(dados.main_complaint)}</p>
      </div>

      <div style="margin-bottom:12px">
        <strong style="font-size:0.85rem;color:#1e293b;">Estado Emocional Descrito:</strong>
        <p style="font-size:0.85rem;color:#475569;margin-top:4px;background:#f1f5f9;padding:10px;border-radius:8px;white-space:pre-wrap;">${printVal(dados.emotional_open)}</p>
      </div>

      <div style="margin-bottom:16px">
        <strong style="font-size:0.85rem;color:#1e293b;">Medicamentos em Uso (Contínuo):</strong>
        <p style="font-size:0.85rem;color:#475569;margin-top:4px;background:#f1f5f9;padding:10px;border-radius:8px;white-space:pre-wrap;">${printVal(dados.medications)}</p>
      </div>

      <h4 style="font-size:1rem;color:#0f172a;margin-bottom:12px;border-bottom:2px solid #e2e8f0;padding-bottom:4px;margin-top:20px;">Tratamento & Resultados Clínicos</h4>

      <div style="margin-bottom:12px;background:#f0fdf4;border:1px solid #bbf7d0;padding:12px;border-radius:8px">
        <strong style="font-size:0.85rem;color:#166534;display:flex;align-items:center;gap:6px"><span style="font-size:1.1rem">🔓</span> Prognóstico do Sistema (Visão Consultora):</strong>
        <p style="font-size:0.85rem;color:#15803d;margin-top:6px;line-height:1.5">${analysisResultados}</p>
        <div style="font-size:0.75rem;color:#16a34a;margin-top:8px;font-style:italic">Este é o texto exato que o sistema gerou, mas que aparece borrado com um 🔒 cadeado para o cliente gerar curiosidade.</div>
      </div>

      <h4 style="font-size:1rem;color:#0f172a;margin-bottom:12px;border-bottom:2px solid #e2e8f0;padding-bottom:4px;margin-top:20px;">Indicadores de Estilo de Vida</h4>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
         <div style="font-size:0.85rem;background:#f8fafc;padding:8px;border-radius:8px;"><strong>Nível de Estresse:</strong><br>${dados.stress_level ? dados.stress_level + '/10' : '—'}</div>
         <div style="font-size:0.85rem;background:#f8fafc;padding:8px;border-radius:8px;"><strong>Nível de Energia:</strong><br>${dados.energy_level ? dados.energy_level + '/10' : '—'}</div>
         <div style="font-size:0.85rem;background:#f8fafc;padding:8px;border-radius:8px;"><strong>Diet / Alimentação:</strong><br>${printVal(dados.diet_type)}</div>
         <div style="font-size:0.85rem;background:#f8fafc;padding:8px;border-radius:8px;"><strong>Ingestão de Água:</strong><br>${printVal(dados.water_intake)}</div>
         <div style="font-size:0.85rem;background:#f8fafc;padding:8px;border-radius:8px;"><strong>Horas de Sono:</strong><br>${printVal(dados.sleep_hours)}</div>
         <div style="font-size:0.85rem;background:#f8fafc;padding:8px;border-radius:8px;"><strong>Exercícios:</strong><br>${printVal(dados.exercise_freq)}</div>
         <div style="font-size:0.85rem;background:#f8fafc;padding:8px;border-radius:8px;"><strong>Experiência com Óleos:</strong><br>${printVal(dados.previous_experience)}</div>
         <div style="font-size:0.85rem;background:#f8fafc;padding:8px;border-radius:8px;"><strong>Disposição à Mudança:</strong><br>${dados.commitment_level ? dados.commitment_level + '/5' : '—'}</div>
      </div>

      <h4 style="font-size:1rem;color:#0f172a;margin-bottom:12px;border-bottom:2px solid #e2e8f0;padding-bottom:4px;margin-top:20px;">Dores e Condições Marcadas</h4>

      <div style="margin-bottom:12px">
        <strong style="font-size:0.85rem;color:#1e293b;">Sintomas Físicos / Emocionais:</strong>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">
          ${printTagArray(allSymptoms, '#b91c1c', '#fef2f2')}
        </div>
      </div>
      
      <div style="margin-bottom:12px">
        <strong style="font-size:0.85rem;color:#1e293b;">Condições Crônicas:</strong>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">
          ${printTagArray(dados.chronic_conditions, '#9f1239', '#fff1f2')}
        </div>
      </div>

      <div style="margin-bottom:12px">
        <strong style="font-size:0.85rem;color:#1e293b;">Hábitos Prejudiciais Marcados:</strong>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">
          ${printTagArray(dados.bad_habits_food, '#b45309', '#fef3c7')}
        </div>
      </div>

      <div style="margin-bottom:16px">
        <strong style="font-size:0.85rem;color:#1e293b;">Objetivos do Cliente:</strong>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">
          ${printTagArray(dados.goals?.goals || dados.goals, '#15803d', '#dcfce7')}
        </div>
      </div>

      <div style="font-size:0.8rem;color:var(--text-muted);margin-top:16px;text-align:right;">
        Ficha Registrada em: <span style="font-weight:700">${formatDate(a.criado_em)}</span>
      </div>
      <div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">
        <button id="btn-edit-protocol" style="background:#f0fdf4;color:#166534;border:1.5px solid #86efac;border-radius:8px;padding:8px 16px;font-size:0.85rem;font-weight:700;cursor:pointer">✏️ Editar Protocolo</button>
      </div>
    </div>`, {
    confirmLabel: '🔗 Copiar Link do Protocolo',
    onOpen: () => {
      document.getElementById('btn-edit-protocol')?.addEventListener('click', () => {
        let protocols = [];
        try {
          const ana = analyzeAnamnesis(rawDados.goals ? rawDados : nestedForAnalysis);
          protocols = ana.protocols || [];
        } catch (e) { /* ignore */ }
        openProtocolEditor(client, a, protocols, analysisResultados);
      });
    },
    onConfirm: async () => {
      const btnLink = document.querySelector('.modal-footer [data-confirm]');
      const origText = btnLink ? btnLink.innerHTML : '🔗 Copiar Link do Protocolo';
      if(btnLink) btnLink.innerHTML = 'Gerando...';

      // Lógica idêntica ao utils.js para garantir funcionamento no iOS Safari
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          const fetchHash = async () => {
            const { api } = await import('../store.js');
            const res = await api('POST', '/api/anamneses/' + a.id + '/hash');
            return window.location.origin + window.location.pathname + '#/laudo/' + res.hash;
          };
          
          const promiseBlob = fetchHash().then(text => new Blob([text], { type: 'text/plain' }));
          
          await navigator.clipboard.write([
              new ClipboardItem({ 'text/plain': promiseBlob })
          ]);
          
          if(btnLink) btnLink.innerHTML = '<span style="color:#fff">✅ Copiado!</span>';
          setTimeout(() => { if(btnLink) btnLink.innerHTML = origText; }, 3000);
          toast('Link copiado! 🔗', 'success');
          return false; // Mantém a modal aberta
        } catch (err) {
           console.warn("Async clipboard write failed, using fallback:", err);
        }
      }

      // Fallback
      try {
        const { api } = await import('../store.js');
        const res = await api('POST', '/api/anamneses/' + a.id + '/hash');
        const magicUrl = window.location.origin + window.location.pathname + '#/laudo/' + res.hash;
        
        await copyToClipboard(magicUrl);
        if(btnLink) btnLink.innerHTML = '<span style="color:#fff">✅ Copiado!</span>';
      } catch(err) {
        toast(err.message, 'error');
        if(btnLink) btnLink.innerHTML = '<span style="color:#ef4444">❌ Erro</span>';
      }
      setTimeout(() => { if(btnLink) btnLink.innerHTML = origText; }, 3000);
      return false; // Mantém modal aberta após copiar
    }
  });
}


// ────────────────────────────────────────────────────────────
// EDITOR DE PROTOCOLO PERSONALIZADO
// ────────────────────────────────────────────────────────────
function openProtocolEditor(client, anamnese, protocols, analysisResultados) {
  // Build catalog from OILS_DATABASE (complete product list)
  const allOils = Object.entries(OILS_DATABASE || {})
    .map(([name, oil]) => ({ name, fn: oil.fn || '' }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Working copy – prefer saved custom, else use auto-generated
  const existingCustom = anamnese.protocolo_customizado || null;
  let editProtocols = existingCustom?.protocols
    ? JSON.parse(JSON.stringify(existingCustom.protocols)).map(cp => {
        if (cp.specificProtocol === undefined) {
            const baseProto = protocols.find(bp => bp.symptom === cp.symptom);
            if (baseProto && baseProto.specificProtocol) {
                cp.specificProtocol = JSON.parse(JSON.stringify(baseProto.specificProtocol));
            }
        }
        return cp;
      })
    : protocols.map(p => ({ 
        symptom: p.symptom, 
        icon: p.icon || '🌿', 
        oils: [...(p.oils || [])],
        specificProtocol: p.specificProtocol ? JSON.parse(JSON.stringify(p.specificProtocol)) : undefined
      }));
  let customNotes = existingCustom?.customNotes || analysisResultados;
  let customMessage = existingCustom?.customMessage || '';
  let customUnlock = existingCustom?.customUnlock || false;

  let customRoutine = existingCustom?.customRoutine;
  if (!customRoutine) {
    customRoutine = { morning: [], afternoon: [], night: [] };
    protocols.forEach(p => {
      if (p.routine) {
        (p.routine.morning || []).forEach(i => { if (!customRoutine.morning.includes(i)) customRoutine.morning.push(i); });
        (p.routine.afternoon || []).forEach(i => { if (!customRoutine.afternoon.includes(i)) customRoutine.afternoon.push(i); });
        (p.routine.night || []).forEach(i => { if (!customRoutine.night.includes(i)) customRoutine.night.push(i); });
      }
    });
  }

  let morningText = customRoutine.morning.join('\n');
  let afternoonText = customRoutine.afternoon.join('\n');
  let nightText = customRoutine.night.join('\n');

  let budgetInclude = existingCustom?.budgetInclude || false;
  let budgetShipping = existingCustom?.budgetShipping || '';

  function oilChip(oil, pIdx, oIdx) {
    const dbSizeOptions = OILS_DATABASE && OILS_DATABASE[oil.name] ? OILS_DATABASE[oil.name].sizes : null;
    let sizeSelector = '';
    
    if (dbSizeOptions && dbSizeOptions.length > 0) {
      if (!oil.sizeChoice) oil.sizeChoice = dbSizeOptions[0].size;
      sizeSelector = `<select class="pe-oil-size-select" data-p="${pIdx}" data-o="${oIdx}" style="border:1px solid #86efac;border-radius:6px;font-size:0.7rem;background:#f0fdf4;color:#166534;margin-left:4px;padding:2px 4px;outline:none;cursor:pointer">`;
      dbSizeOptions.forEach(opt => {
         sizeSelector += `<option value="${opt.size}" ${oil.sizeChoice === opt.size ? 'selected' : ''}>${opt.size}</option>`;
      });
      sizeSelector += `</select>`;
    } else {
      sizeSelector = `<span style="font-size:0.65rem;opacity:0.7;margin-left:4px">(Tamanho único)</span>`;
    }

    return `<span style="display:inline-flex;align-items:center;gap:4px;background:#dcfce7;color:#166534;border-radius:20px;padding:4px 10px;font-size:0.78rem;font-weight:600;margin:3px">
      🌿 ${oil.name}${oil.fn ? ` <span style="opacity:0.65;font-size:0.7rem">— ${oil.fn}</span>` : ''}
      ${sizeSelector}
      <button class="pe-remove-oil" data-rp="${pIdx}" data-ro="${oIdx}" style="background:none;border:none;cursor:pointer;color:#dc2626;font-weight:700;padding:0 0 0 6px;font-size:0.9rem;line-height:1">✕</button>
    </span>`;
  }

  const overlay = document.createElement('div');
  overlay.id = 'protocol-editor-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.5);display:flex;align-items:flex-start;justify-content:center;padding:40px 16px;overflow-y:auto;';
  overlay.innerHTML = `
    <div style="background:white;border-radius:16px;width:100%;max-width:640px;margin-bottom:40px;box-shadow:0 24px 60px rgba(0,0,0,0.3);display:flex;flex-direction:column">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #e2e8f0">
        <h3 style="font-size:1rem;font-weight:700;color:#1e293b;margin:0">✏️ Editar Protocolo — ${client.name}</h3>
        <button id="pe-close" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#94a3b8;line-height:1">✕</button>
      </div>
      <div id="pe-body" style="padding:20px;max-height:60vh;overflow-y:auto"></div>
      <div style="padding:14px 20px;border-top:1px solid #e2e8f0;display:flex;gap:10px;justify-content:flex-end">
        <button id="pe-cancel" style="background:#f3f4f6;color:#374151;border:none;border-radius:8px;padding:10px 20px;font-size:0.88rem;cursor:pointer">Cancelar</button>
        <button id="pe-save" style="background:#166534;color:white;border:none;border-radius:8px;padding:10px 24px;font-size:0.88rem;font-weight:700;cursor:pointer">💾 Salvar Protocolo</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  function syncState() {
    const body = overlay.querySelector('#pe-body');
    if (!body) return; // Se ainda não gerou DOM, não tente capturar
    morningText = overlay.querySelector('#pe-rt-morning')?.value ?? morningText;
    afternoonText = overlay.querySelector('#pe-rt-afternoon')?.value ?? afternoonText;
    nightText = overlay.querySelector('#pe-rt-night')?.value ?? nightText;
    customNotes = overlay.querySelector('#pe-notes')?.value ?? customNotes;
    customMessage = overlay.querySelector('#pe-message')?.value ?? customMessage;
    customUnlock = overlay.querySelector('#pe-unlock')?.checked ?? customUnlock;
    budgetInclude = overlay.querySelector('#pe-budget-include')?.checked ?? budgetInclude;
    budgetShipping = overlay.querySelector('#pe-budget-shipping')?.value ?? budgetShipping;

    overlay.querySelectorAll('textarea.pe-sp-textarea').forEach(ta => {
      const pIdx = parseInt(ta.dataset.idx, 10);
      if (editProtocols[pIdx] && editProtocols[pIdx].specificProtocol) {
        // Only split strings, do not filter empty lines here so we retain formatting until save
        editProtocols[pIdx].specificProtocol.instructions = ta.value.split('\n');
      }
    });
  }

  function render() {
    syncState();
    const body = overlay.querySelector('#pe-body');
    if (!body) return;
    body.innerHTML = `
      <p style="color:#475569;font-size:0.85rem;margin-bottom:16px">Adicione ou remova produtos para personalizar o protocolo de <strong>${client.name}</strong>.</p>
      ${editProtocols.length === 0 ? '<p style="color:#94a3b8;font-size:0.85rem">Nenhum protocolo gerado automaticamente. <br>Adicione um produto manualmente usando o formulário abaixo.</p>' : ''}
      ${editProtocols.map((p, pIdx) => `
        <div style="margin-bottom:12px;background:#f8fafc;border-radius:10px;padding:12px;border:1px solid #e2e8f0">
          <div style="font-weight:700;font-size:0.88rem;color:#1e293b;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
             <span>${p.icon} ${p.symptom}</span>
             <button class="pe-remove-protocol" data-idx="${pIdx}" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:0.85rem" title="Excluir queixa inteira (e seus óleos)">❌ Remover</button>
          </div>
          <div style="display:flex;flex-wrap:wrap">
            ${(p.oils || []).map((oil, oIdx) => oilChip(oil, pIdx, oIdx)).join('')}
            ${!p.oils?.length ? '<span style="font-size:0.78rem;color:#94a3b8">Sem óleos. Adicione abaixo ↓</span>' : ''}
          </div>
        </div>`).join('')}
      <div style="background:white;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-top:6px">
        <div style="font-weight:700;font-size:0.85rem;color:#1e293b;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
          <span>➕ Adicionar Produto (Óleo)</span>
          <button id="pe-new-symptom" style="background:#fef3c7;color:#b45309;border:1px solid #fde68a;border-radius:6px;padding:4px 10px;font-size:0.75rem;font-weight:700;cursor:pointer" title="Criar bloco 100% customizado">➕ Nova Queixa (Bloco Vazio)</button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${editProtocols.length > 0 ? `<select id="pe-sel-p" style="flex:1;min-width:130px;padding:8px;border-radius:8px;border:1px solid #e2e8f0;font-size:0.82rem">
            <option value="">Protocolo…</option>
            ${editProtocols.map((p, i) => `<option value="${i}">${p.icon} ${p.symptom}</option>`).join('')}
          </select>` : ''}
          <input list="pe-datalist-o" id="pe-sel-o" placeholder="Buscar produto..." autocomplete="off" style="flex:2;min-width:160px;padding:8px;border-radius:8px;border:1px solid #e2e8f0;font-size:0.82rem">
          <datalist id="pe-datalist-o">
            ${allOils.map(o => `<option value="${o.name}${o.fn ? ` — ${o.fn}` : ''}"></option>`).join('')}
          </datalist>
          <button id="pe-add" style="background:#166534;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:0.82rem;font-weight:700;cursor:pointer;white-space:nowrap">➕ Adicionar</button>
        </div>
      </div>

      <div style="margin-top:24px">
        <label style="font-weight:700;font-size:0.9rem;color:#1e293b;display:block;margin-bottom:12px;border-bottom:2px solid #e2e8f0;padding-bottom:4px">⏰ Editar Rotina Diária (um item por linha)</label>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div>
            <span style="font-size:0.85rem;font-weight:600;color:#f59e0b">Manhã:</span>
            <textarea id="pe-rt-morning" rows="3" style="width:100%;padding:8px;border-radius:8px;border:1px solid #e2e8f0;font-size:0.84rem;resize:vertical">${morningText}</textarea>
          </div>
          <div>
            <span style="font-size:0.85rem;font-weight:600;color:#ea580c">Tarde:</span>
            <textarea id="pe-rt-afternoon" rows="3" style="width:100%;padding:8px;border-radius:8px;border:1px solid #e2e8f0;font-size:0.84rem;resize:vertical">${afternoonText}</textarea>
          </div>
          <div>
            <span style="font-size:0.85rem;font-weight:600;color:#3b82f6">Noite:</span>
            <textarea id="pe-rt-night" rows="3" style="width:100%;padding:8px;border-radius:8px;border:1px solid #e2e8f0;font-size:0.84rem;resize:vertical">${nightText}</textarea>
          </div>
        </div>
      </div>

      ${editProtocols.map((p, i) => {
        if (!p.specificProtocol) return '';
        return `
        <div style="margin-top:24px" class="specific-protocol-container">
          <label style="font-weight:700;font-size:0.9rem;color:#1e293b;display:block;margin-bottom:12px;border-bottom:2px solid #e2e8f0;padding-bottom:4px">
            <div style="display:flex;justify-content:space-between;align-items:center">
               <span>🎯 Editar ${p.specificProtocol.title} (um por linha)</span>
               <button class="pe-remove-specific" data-idx="${i}" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:0.85rem">❌ Excluir Passo-a-Passo</button>
            </div>
          </label>
          <textarea class="pe-sp-textarea" data-idx="${i}" rows="5" style="width:100%;padding:8px;border-radius:8px;border:1px solid #e2e8f0;font-size:0.84rem;resize:vertical;box-sizing:border-box">${p.specificProtocol.instructions.join('\n')}</textarea>
        </div>`;
      }).join('')}
      
      <div style="margin-top:16px;text-align:right">
         <button id="pe-new-sp" style="background:#e0e7ff;color:#4338ca;border:1px solid #c7d2fe;border-radius:6px;padding:6px 14px;font-size:0.8rem;font-weight:700;cursor:pointer">➕ Preencher Novo Passo-a-Passo Livre</button>
      </div>

      <div style="margin-top:24px;display:flex;flex-direction:column;gap:16px;">
        <div>
          <label style="font-weight:600;font-size:0.85rem;color:#1e293b;display:flex;align-items:center;margin-bottom:6px;gap:6px">
             <span>Mensagem no Protocolo (Visível ao Cliente)</span> <span style="font-size:0.85rem">🌿</span>
          </label>
          <textarea id="pe-message" placeholder="Digite uma recomendação personalizada que aparecerá em destaque no PDF do protocolo..." rows="3" style="width:100%;padding:10px;border-radius:8px;border:1px solid #16a34a;font-size:0.84rem;resize:vertical;box-sizing:border-box;background:#f0fdf4">${customMessage || ''}</textarea>
        </div>
        <div>
          <label style="font-weight:600;font-size:0.85rem;color:#1e293b;display:block;margin-bottom:6px">📝 Texto do Resultado Esperado (visível apenas para você):</label>
          <textarea id="pe-notes" rows="3" style="width:100%;padding:10px;border-radius:8px;border:1px solid #e2e8f0;font-size:0.84rem;resize:vertical;box-sizing:border-box">${customNotes || ''}</textarea>
          
          <label style="display:flex;align-items:center;margin-top:10px;font-size:0.85rem;color:#333;cursor:pointer">
            <input type="checkbox" id="pe-unlock" style="margin-right:8px;accent-color:#166534;width:16px;height:16px" ${customUnlock ? 'checked' : ''}>
            🔓 <b>Liberar Resultado Esperado para o cliente</b> (remover o cadeado no PDF final)
          </label>
        </div>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-top:8px">
          <label style="display:flex;align-items:center;font-size:0.95rem;color:#0f172a;font-weight:700;cursor:pointer">
            <input type="checkbox" id="pe-budget-include" style="margin-right:10px;accent-color:#166534;width:18px;height:18px" ${budgetInclude ? 'checked' : ''}>
            💰 Incluir Orçamento Automático no Protocolo
          </label>
          
          <div style="margin-top:16px;display:${budgetInclude ? 'block' : 'none'}">
            <div style="margin-bottom:12px">
              <div>
                <label style="font-size:0.8rem;font-weight:600;color:#475569">Taxa de Adesão / Frete (R$):</label>
                <input type="number" id="pe-budget-shipping" value="${budgetShipping}" placeholder="Ex: 90.00" style="width:100%;padding:8px;border-radius:6px;border:1px solid #cbd5e1;margin-top:4px;font-size:0.85rem">
              </div>
            </div>
            
            <div id="pe-budget-summary">
               <!-- Auto calculated block -->
            </div>
          </div>
        </div>
      </div>`;

    // Calculate budget
    const budgetDiv = body.querySelector('#pe-budget-summary');
    if (budgetDiv) {
      let bReg = 0, bMem = 0, bPv = 0;
      editProtocols.forEach(p => {
        (p.oils || []).forEach(oil => {
          const dbSizes = OILS_DATABASE && OILS_DATABASE[oil.name] ? OILS_DATABASE[oil.name].sizes : null;
          if (dbSizes && dbSizes.length > 0) {
             const selected = dbSizes.find(s => s.size === oil.sizeChoice) || dbSizes[0];
             bReg += selected.regular; bMem += selected.member; bPv += selected.pv || 0;
          }
        });
      });
      const freight = parseFloat((budgetShipping || '0').replace(',', '.')) || 0;
      const tReg = bReg + freight;
      const tMem = bMem + freight;
      const diff = tReg - tMem;
      
      budgetDiv.innerHTML = `
        <div style="background:white;padding:12px;border-radius:8px;border:1px dashed #94a3b8;font-size:0.85rem">
          <div style="display:flex;justify-content:space-Between;margin-bottom:4px">
            <span style="color:#64748b">Valor Total Varejo:</span>
            <span style="font-weight:600;color:#475569">R$ ${tReg.toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-Between;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #e2e8f0">
            <span style="color:#166534;font-weight:600">Valor Membro Atacado (<span style="font-size:0.75rem">${bPv} PV</span>):</span>
            <span style="font-weight:700;color:#15803d;font-size:1rem">R$ ${tMem.toFixed(2)}</span>
          </div>
          <div style="text-align:right;color:#0ea5e9;font-weight:700">
             Economia de R$ ${diff.toFixed(2)}!
          </div>
        </div>
      `;
    }

    // Bind size dropdowns
    body.querySelectorAll('.pe-oil-size-select').forEach(sel => {
       sel.addEventListener('change', e => {
         editProtocols[+e.target.dataset.p].oils[+e.target.dataset.o].sizeChoice = e.target.value;
         render();
       });
    });

    body.querySelector('#pe-budget-include')?.addEventListener('change', e => {
       budgetInclude = e.target.checked;
       render(); // Re-render to show/hide the fields
    });

    // Remove oil
    body.querySelectorAll('[data-rp]').forEach(btn => {
      btn.addEventListener('click', () => {
        editProtocols[+btn.dataset.rp].oils.splice(+btn.dataset.ro, 1);
        render();
      });
    });

    // Remove whole protocol group
    body.querySelectorAll('.pe-remove-protocol').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Deseja realmente apagar todo este bloco e seus óleos?')) {
          editProtocols.splice(+btn.dataset.idx, 1);
          render();
        }
      });
    });

    // Remove specific passablity block
    body.querySelectorAll('.pe-remove-specific').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Deseja realmente apagar este Passo-a-Passo Específico (suas instruções)?')) {
          editProtocols[+btn.dataset.idx].specificProtocol = null;
          render();
        }
      });
    });

    // Create New Custom Protocol Group
    body.querySelector('#pe-new-symptom')?.addEventListener('click', () => {
      const title = prompt('Qual o título ou foco deste novo bloco/queixa? (Ex: Imunidade, Dores no Joelho)');
      if (title && title.trim()) {
        editProtocols.push({ symptom: title.trim(), icon: '✨', focus: 'Tratamento Personalizado', oils: [] });
        render();
      }
    });

    // Create New Specific Protocol
    body.querySelector('#pe-new-sp')?.addEventListener('click', () => {
      const title = prompt('Qual o título deste Passo-a-Passo Livre? (Ex: PROTOCOLO CAPILAR DE CRESCIMENTO)');
      if (title && title.trim()) {
        editProtocols.push({
          symptom: 'Passo a Passo Adicional',
          icon: '📝',
          focus: 'Tratamento Personalizado',
          oils: [],
          specificProtocol: { title: title.trim().toUpperCase(), instructions: ['(Escreva suas instruções linha por linha)'] }
        });
        render();
      }
    });

    // Add oil
    body.querySelector('#pe-add')?.addEventListener('click', () => {
      const pSel = body.querySelector('#pe-sel-p');
      const oSel = body.querySelector('#pe-sel-o');
      const pIdx = pSel ? parseInt(pSel.value) : 0;
      const oVal = oSel?.value?.trim();
      
      if (!oVal) { toast('Digite ou selecione um produto.', 'warning'); return; }
      if (!editProtocols[pIdx]) { toast('Selecione o protocolo.', 'warning'); return; }
      
      // Find oil matching the input value exactly
      const matchedOil = allOils.find(o => `${o.name}${o.fn ? ` — ${o.fn}` : ''}` === oVal || o.name === oVal);
      if (!matchedOil) {
        toast('Produto não encontrado no catálogo.', 'warning'); return;
      }

      const oil = { name: matchedOil.name, fn: matchedOil.fn };

      if (editProtocols[pIdx].oils.find(o => o.name === oil.name)) {
        toast(`${oil.name} já está nesse protocolo.`, 'info'); return;
      }
      editProtocols[pIdx].oils.push(oil);
      toast(`${oil.name} adicionado! 🌿`, 'success');
      
      // Clear input after adding
      if (oSel) oSel.value = '';
      render();
    });

    // Sync notes & messaging
    body.querySelector('#pe-notes')?.addEventListener('input', e => { customNotes = e.target.value; });
    body.querySelector('#pe-message')?.addEventListener('input', e => { customMessage = e.target.value; });
  }

  render();

  function close() { overlay.remove(); }
  overlay.querySelector('#pe-close').addEventListener('click', close);
  overlay.querySelector('#pe-cancel').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  overlay.querySelector('#pe-save').addEventListener('click', async (e) => {
    const btn = e.target;
    btn.disabled = true; btn.textContent = '⏳ Salvando…';
    syncState(); // Sincroniza uma última vez antes de montar o payload
    
    const updatedRoutine = {
      morning: morningText.split('\n').map(l => l.trim()).filter(Boolean),
      afternoon: afternoonText.split('\n').map(l => l.trim()).filter(Boolean),
      night: nightText.split('\n').map(l => l.trim()).filter(Boolean),
    };

    // Remove empty specific lines properly before saving
    editProtocols.forEach(p => {
      if (p.specificProtocol && Array.isArray(p.specificProtocol.instructions)) {
        p.specificProtocol.instructions = p.specificProtocol.instructions.map(l => l.trim()).filter(Boolean);
      }
    });

    try {
      await store.saveCustomProtocol(anamnese.id, { protocols: editProtocols, customNotes, customMessage, customRoutine: updatedRoutine, customUnlock, budgetInclude, budgetShipping });
      toast('✅ Protocolo personalizado salvo!', 'success');
      // Store in anamnese object so re-opening the editor shows the saved state
      anamnese.protocolo_customizado = { protocols: editProtocols, customNotes, customMessage, customRoutine: updatedRoutine, customUnlock, budgetInclude, budgetShipping };
      close();
    } catch (err) {
      toast('Erro ao salvar: ' + err.message, 'error');
      btn.disabled = false; btn.textContent = '💾 Salvar Protocolo';
    }
  });
}


export async function renderClients(router, params) {
  // Render layout immediately with loading
  renderLayout(router, 'Clientes', `
      <div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando clientes...</div>
    `, 'clients');

  let clients = [];
  let filter = 'all';      // ativo filter → sent to server
  let tipoFilter = 'all';  // tipo_cadastro → local filter on current page
  let sortOrder = 'name';  // sort → local on current page
  let search = '';          // search → sent to server (debounced)
  let linkFilter = params?.link || ''; // anamnese source filter
  let currentPage = 1;
  let totalClients = 0;
  let totalPages = 1;
  const PAGE_SIZE = 50;
  let _searchTimer = null;

  async function refresh(resetPage = true) {
    if (resetPage) currentPage = 1;
    try {
      const res = await store.getClientsPaginated({
        page: currentPage,
        limit: PAGE_SIZE,
        q: search,
        ativo: filter === 'archived' ? 'false' : (filter === 'all' ? 'all' : 'true'),
        link: linkFilter
      });
      clients = res.data;
      totalClients = res.total;
      totalPages = res.totalPages;
    } catch {
      clients = [];
      totalClients = 0;
      totalPages = 1;
    }
    renderTable();
  }

  function filtered() {
    // status and tipo are applied locally on the current page of results
    let list = clients.filter(c => {
      if (filter === 'archived') return c.ativo === false;
      const matchStatus = filter === 'all' || 
                        (filter === 'active' ? (c.status === 'active' || c.status === 'lead') : c.status === filter);
      const matchTipo = tipoFilter === 'all' ||
        (tipoFilter === 'lead' && (!c.tipo_cadastro || c.tipo_cadastro === 'lead')) ||
        c.tipo_cadastro === tipoFilter;
      return matchStatus && matchTipo && (filter === 'all' ? true : c.ativo !== false);
    });

    if (sortOrder === 'recent') {
      list.sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
    } else if (sortOrder === 'oldest') {
      list.sort((a, b) => new Date(a.criado_em) - new Date(b.criado_em));
    } else {
      list.sort((a, b) => (a.nome || a.name || '').localeCompare(b.nome || b.name || ''));
    }
    return list;
  }

  function renderTable() {
    const pc = document.getElementById('page-content');
    if (!pc) return;
    const list = filtered(); // local tipo/sort on current page

    const tbody = pc.querySelector('#clients-tbody');
    if (!tbody) { buildPage(); return; }

    tbody.innerHTML = list.length === 0
      ? `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">👥</div><h4>Nenhum cliente encontrado</h4>
               <p>Cadastre clientes ou compartilhe seu link de anamnese</p>
               <button class="btn btn-primary" id="btn-add-client-empty">+ Adicionar Cliente</button></div></td></tr>`
      : list.map(c => {
        const name = c.nome || c.name || '—';
        const phone = c.telefone || c.phone || '—';
        const city = c.cidade || c.city || '—';
        return `
        <tr class="client-row" data-id="${c.id}" style="cursor:pointer" title="Ver ficha completa">
          <td><div class="client-name-cell">
            <div class="client-avatar-sm">${getInitials(name)}</div>
            <div>
              <div style="font-weight:600">${name} ${c.tipo_cadastro === 'preferencial' ? '🛍️' : c.tipo_cadastro === 'consultora' ? '💼' : ''}</div>
              <div style="font-size:0.75rem;color:var(--text-muted)">${c.email || ''}</div>
              ${c.indicador_nome ? `<div style="font-size:0.75rem;color:#d97706;background:#fef3c7;padding:2px 6px;border-radius:4px;display:inline-block;margin-top:4px;font-weight:600">🎁 Indicado(a) por: ${c.indicador_nome}</div>` : ''}
            </div>
          </div></td>
          <td>${phone}</td>
          <td>${String(c.genero || '').toLowerCase() === 'masculino' ? '♂ Masc.' : String(c.genero || '').toLowerCase() === 'feminino' ? '♀ Fem.' : '—'}</td>
          <td>${formatDate(c.data_nascimento || c.birthdate) || '—'}</td>
          <td>${city}</td>
          <td>
            ${c.ativo === false ? '<span class="status-badge" style="background:#f1f5f9;color:#64748b;border-color:#cbd5e1">🗂️ Arquivado</span>' : 
              `<span class="status-badge status-${c.status || 'active'}">${{ active: 'Ativo', inactive: 'Inativo', lead: 'Prospecto' }[c.status] || 'Ativo'}</span>`
            }
          </td>
          <td>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${c.ativo === false ? 
                `<button class="btn btn-primary btn-sm" data-action="restore" data-id="${c.id}" title="Restaurar cliente" style="background:#0ea5e9;border-color:#0ea5e9">🔄 Restaurar</button>` : 
                `
                <button class="btn btn-secondary btn-sm" data-action="anamnese" data-id="${c.id}" title="Ver anamnese">📋</button>
                <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${c.id}" title="Editar">✏️</button>
                <button class="btn btn-danger btn-sm" data-action="delete" data-id="${c.id}" title="Excluir">🗑️</button>
                `
              }
            </div>
          </td>
        </tr>`;
      }).join('');

    // Pagination controls — use server-side totals
    const start = totalClients === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, totalClients);
    const paginationEl = pc.querySelector('#clients-pagination');
    if (paginationEl) {
      paginationEl.innerHTML = totalClients === 0 ? '' : `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;flex-wrap:wrap;gap:8px">
          <span style="font-size:0.82rem;color:var(--text-muted)">
            Mostrando <strong>${start}–${end}</strong> de <strong>${totalClients}</strong> cliente${totalClients !== 1 ? 's' : ''}
          </span>
          <div style="display:flex;align-items:center;gap:8px">
            <button class="btn btn-secondary btn-sm" id="pg-prev" ${currentPage <= 1 ? 'disabled' : ''}>‹ Anterior</button>
            <span style="font-size:0.82rem;font-weight:600;color:var(--text-dark)">Página ${currentPage} / ${totalPages}</span>
            <button class="btn btn-secondary btn-sm" id="pg-next" ${currentPage >= totalPages ? 'disabled' : ''}>Próxima ›</button>
          </div>
        </div>`;
      paginationEl.querySelector('#pg-prev')?.addEventListener('click', () => { currentPage--; refresh(false); });
      paginationEl.querySelector('#pg-next')?.addEventListener('click', () => { currentPage++; refresh(false); });
    }

    bindTableActions();
    const emptyBtn = pc.querySelector('#btn-add-client-empty');
    if (emptyBtn) emptyBtn.addEventListener('click', () => showClientModal());
  }

  function bindTableActions() {
    const pc = document.getElementById('page-content');
    if (!pc) return;
    pc.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const client = clients.find(c => c.id === btn.dataset.id);
        if (btn.dataset.action === 'edit') showClientModal(client);
        if (btn.dataset.action === 'restore') {
          if (confirm(`Deseja restaurar o cadastro de ${client.nome || client.name}?`)) {
            try {
              await store.updateClient(client.id, { ...client, ativo: true });
              toast('Cliente restaurado com sucesso! 🟢', 'success');
              refresh(false);
            } catch (e) {
              toast('Erro ao restaurar: ' + e.message, 'error');
            }
          }
        }
        if (btn.dataset.action === 'delete') {
          const clientName = client?.nome || client?.name || 'este cliente';
          modal('Arquivar Cliente', `
            <div style="text-align:center;padding:8px 0 16px">
              <div style="font-size:2.5rem;margin-bottom:8px">🗂️</div>
              <p style="font-size:0.95rem;color:#374151;margin-bottom:12px">
                Você está prestes a arquivar o cliente:
              </p>
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;
                          padding:10px 16px;margin-bottom:16px">
                <strong style="font-size:1.05rem;color:#b91c1c">${clientName}</strong>
              </div>
              <p style="font-size:0.82rem;color:#6b7280;line-height:1.5;margin-bottom:8px">
                O cliente será marcado como <strong>arquivado</strong> e ocultado das listas ativas.<br>
                Você poderá recuperá-lo a qualquer momento editando seu cadastro e alterando o status.
              </p>
              <details style="cursor:pointer;margin-top:8px">
                <summary style="font-size:0.78rem;color:#ef4444;font-weight:600">
                  ⚠️ Quero excluir permanentemente (sem recuperação)
                </summary>
                <div style="margin-top:10px;padding:10px;background:#fef2f2;border-radius:8px;border:1px solid #fca5a5">
                  <p style="font-size:0.78rem;color:#7f1d1d;margin-bottom:10px">
                    Esta ação é <strong>irreversível</strong>. Todos os dados, anamneses e histórico serão perdidos.
                  </p>
                  <button class="btn btn-danger btn-sm" id="btn-hard-delete" style="width:100%;font-weight:700">
                    🗑️ Excluir Permanentemente
                  </button>
                </div>
              </details>
            </div>
          `, {
            confirmLabel: '🗂️ Arquivar',
            onOpen: () => {
              document.getElementById('btn-hard-delete')?.addEventListener('click', async () => {
                try {
                  await store.deleteClientHard(client.id);
                  toast(`${clientName} excluído permanentemente.`, 'warning');
                  await refresh();
                  // close modal
                  document.querySelector('[data-close]')?.click();
                } catch (e) {
                  toast('Erro ao excluir: ' + e.message, 'error');
                }
              });
            },
            onConfirm: async () => {
              try {
                await store.deleteClient(client.id);
                toast(`${clientName} arquivado. Você pode reativá-lo a qualquer momento na aba 'Arquivados'.`, 'warning');
                await refresh(false);
              } catch (e) {
                toast('Erro ao arquivar: ' + e.message, 'error');
              }
            }
          });
        }

        if (btn.dataset.action === 'anamnese') {
          showAnamneseModal(client, router);
        }
      });
    });

    // Row click
    pc.querySelectorAll('.client-row').forEach(row => {
      row.addEventListener('click', e => {
        if (e.target.closest('.btn')) return; // Ignore action buttons
        const client = clients.find(c => c.id === row.dataset.id);
        if (client) openClientOffcanvas(client);
      });
    });
  }

  function buildPage() {
    const pc = document.getElementById('page-content');
    if (!pc) return;
    pc.innerHTML = `
        ${linkFilter ? `
          <div style="background:var(--green-50);border:1px solid var(--green-200);border-radius:12px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-size:1.2rem">🔍</span>
              <div>
                <div style="font-size:0.85rem;color:var(--green-800);font-weight:700">Mostrando apenas leads desta campanha</div>
                <div style="font-size:0.75rem;color:var(--green-600)">Os resultados foram filtrados pelo link de anamnese / captação selecionado.</div>
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" id="btn-clear-link-filter">✕ Limpar Filtro</button>
          </div>
        ` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <div class="tab-bar" style="margin:0">
              ${['all', 'active', 'inactive', 'archived'].map(s => `
                <button class="tab-btn ${filter === s ? 'active' : ''}" data-filter="${s}">
                  ${s === 'all' ? 'Todos 👥' : s === 'active' ? 'Ativos 🟢' : s === 'inactive' ? 'Inativos 🔴' : 'Arquivados 🗂️'}
                </button>`).join('')}
            </div>
            
            <select class="field-input" id="filter-tipo" style="width:160px;padding:8px 12px;cursor:pointer">
              <option value="all">Tipos (Todos)</option>
              <option value="lead">Prospectos (Leads)</option>
              <option value="preferencial">🛍️ Preferenciais</option>
              <option value="consultora">💼 Consultoras</option>
            </select>

            <select class="field-input" id="filter-sort" style="width:160px;padding:8px 12px;cursor:pointer">
              <option value="name">A-Z (Nome)</option>
              <option value="recent">Mais Recentes</option>
              <option value="oldest">Mais Antigos</option>
            </select>

            <input class="field-input" id="search-input" value="${search}" placeholder="🔍 Buscar cliente..." style="width:200px;padding:8px 12px" />
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary" id="btn-import-csv">📥 Importar CSV</button>
            <button class="btn btn-primary" id="btn-add-client">+ Novo Cliente</button>
          </div>
        </div>
        <div class="card">
          <div style="overflow-x:auto">
            <table class="clients-table">
              <thead><tr>
                <th>Cliente</th><th>WhatsApp</th><th>Gênero</th><th>Nascimento</th><th>Cidade</th><th>Status</th><th>Ações</th>
              </tr></thead>
              <tbody id="clients-tbody"></tbody>
            </table>
          </div>
          <div id="clients-pagination"></div>
        </div>`;


    renderTable();
    pc.querySelector('#btn-clear-link-filter')?.addEventListener('click', () => {
      linkFilter = '';
      router.navigate('/clients');
      refresh();
    });
    pc.querySelector('#btn-add-client').addEventListener('click', () => showClientModal());
    pc.querySelector('#btn-import-csv').addEventListener('click', () => showImportModal());
    pc.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        filter = btn.dataset.filter;
        pc.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
        refresh(); // Refresh from server to get correct counts and records
      });
    });

    // Novo listener pro Tipo de Cadastro (local filter on current page)
    const selectTipo = pc.querySelector('#filter-tipo');
    selectTipo.value = tipoFilter;
    selectTipo.addEventListener('change', e => {
      tipoFilter = e.target.value;
      renderTable();
    });

    // Event listener for opening anamnesis from offcanvas
    // Global listener is now handled in app.js

    // Novo listener pra Ordenação (local sort on current page)
    const selectSort = pc.querySelector('#filter-sort');
    selectSort.value = sortOrder;
    selectSort.addEventListener('change', e => {
      sortOrder = e.target.value;
      renderTable();
    });

    // Debounced server-side search (300ms)
    pc.querySelector('#search-input').addEventListener('input', e => {
      search = e.target.value;
      clearTimeout(_searchTimer);
      _searchTimer = setTimeout(() => refresh(), 300);
    });

    // Sincronização em tempo real: ouve mudanças feitas via Offcanvas
    const onUpdated = () => refresh(false);
    window.addEventListener('client-updated', onUpdated);
    
    // Limpeza opcional se necessário, mas como o hashRouting reconstrói o DOM, 
    // os eventos no window podem se acumular se não tomarmos cuidado.
    // O router desse app parece reconstruir o app.innerHTML inteiro.
  }

  function showClientModal(client = null) {
    const id = client?.id;

    const { el } = modal(client ? 'Editar Cliente' : 'Novo Cliente', `
      <div class="form-grid">
        <div class="form-group form-field-full">
          <label class="field-label">Nome completo *</label>
          <input class="field-input" id="m-name" value="${client?.name || ''}" placeholder="Nome do cliente" />
        </div>
        <div class="form-group">
          <label class="field-label">E-mail</label>
          <input class="field-input" id="m-email" type="email" value="${client?.email || ''}" placeholder="email@exemplo.com" />
        </div>
        <div class="form-group">
          <label class="field-label">WhatsApp</label>
          <input class="field-input" id="m-phone" value="${client?.phone || ''}" placeholder="55119..." />
        </div>
        <div class="form-group">
          <label class="field-label">Data de Nascimento</label>
          <input class="field-input" id="m-birthdate" type="tel" inputmode="numeric" 
            placeholder="DD/MM/AAAA"
            value="${(() => {
              const val = client?.birthdate || client?.data_nascimento || '';
              if (val && val.includes('-')) {
                const [y, m, d] = val.split('T')[0].split('-');
                return `${d}/${m}/${y}`;
              }
              return val;
            })()}" 
            oninput="this.value = this.value.replace(/\\D/g, '').replace(/(\\d{2})(\\d)/, '$1/$2').replace(/(\\d{2})\\/(\\d{2})(\\d)/, '$1/$2/$3').slice(0, 10)" />
        </div>
        <div class="form-group">
          <label class="field-label">Cidade</label>
          <input class="field-input" id="m-city" value="${client?.city || ''}" />
        </div>
        <div class="form-group">
          <label class="field-label">Gênero</label>
          <select class="field-select" id="m-genero">
            <option value="feminino" ${(!client?.genero || client?.genero === 'feminino') ? 'selected' : ''}>♀ Feminino</option>
            <option value="masculino" ${client?.genero === 'masculino' ? 'selected' : ''}>♂ Masculino</option>
          </select>
        </div>
        <div class="form-group">
          <label class="field-label">Status</label>
          <select class="field-select" id="m-status">
            <option value="active" ${(client?.status === 'active' || !client?.status) ? 'selected' : ''}>Ativo 🟢</option>
            <option value="inactive" ${client?.status === 'inactive' ? 'selected' : ''}>Inativo 🔴</option>
          </select>
        </div>
        ${client && client.ativo === false ? `
        <div class="form-group">
          <label class="field-label">Arquivo</label>
          <div style="display:flex;align-items:center;gap:8px;padding:8px;background:#fff7ed;border-radius:8px;border:1px solid #ffedd5">
             <input type="checkbox" id="m-ativo" checked style="width:18px;height:18px;accent-color:#ea580c" />
             <span style="font-size:0.82rem;color:#9a3412;font-weight:600">Manter arquivado</span>
          </div>
        </div>` : ''}
        <div class="form-group form-field-full">
          <label class="field-label">Observações Internas</label>
          <textarea class="field-textarea" id="m-notes">${client?.notes || ''}</textarea>
        </div>
      </div>`, {
      confirmLabel: client ? 'Salvar' : 'Adicionar',
      onConfirm: async () => {
        const data = {
          name: document.getElementById('m-name').value.trim(),
          email: document.getElementById('m-email').value.trim(),
          phone: document.getElementById('m-phone').value.trim(),
          birthdate: (() => {
            const val = document.getElementById('m-birthdate').value;
            if (val && val.includes('/')) {
              const [d, m, y] = val.split('/');
              if (y && y.length === 4) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
            return val;
          })(),
          city: document.getElementById('m-city').value.trim(),
          genero: document.getElementById('m-genero').value,
          status: document.getElementById('m-status').value,
          notes: document.getElementById('m-notes').value.trim(),
          ativo: document.getElementById('m-ativo') ? document.getElementById('m-ativo').checked === false : true
        };
        if (!data.name) { toast('Nome é obrigatório', 'error'); return; }
        try {
          if (id) { await store.updateClient(id, data); toast('Cliente atualizado! ✅'); }
          else { await store.addClient(data); toast('Cliente adicionado! 🌿'); }
          await refresh();
        } catch (err) {
          toast('Erro: ' + err.message, 'error');
        }
      }
    });
  }

  // ── CSV Import Modal ───────────────────────────────────────
  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return { headers: [], rows: [] };
    const headers = lines[0].split(',').map(h => h.trim().replace(/["']/g, ''));
    const rows = lines.slice(1).map(line => {
      const cols = [];
      let cur = ''; let inQ = false;
      for (const ch of line) {
        if (ch === '"') { inQ = !inQ; }
        else if (ch === ',' && !inQ) { cols.push(cur.trim().replace(/^"|"$/g, '')); cur = ''; }
        else cur += ch;
      }
      cols.push(cur.trim().replace(/^"|"$/g, ''));
      return cols;
    }).filter(row => row.some(v => v));
    return { headers, rows };
  }

  function downloadTemplate() {
    const header = 'nome,email,telefone,data_nascimento,cidade,genero,status,notas';
    const ex = 'Maria Silva,maria@email.com,5511999999999,1990-05-15,São Paulo,feminino,ativo,Cliente VIP';
    const blob = new Blob([header + '\\n' + ex], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'modelo_importacao_clientes.csv';
    a.click();
  }

  function showImportModal() {
    let parsedCsv = { headers: [], rows: [] };
    let mapping = { name: -1, email: -1, phone: -1, birthdate: -1, city: -1, gender: -1, status: -1, notes: -1 };
    
    function autoMapHeaders() {
      const h = parsedCsv.headers.map(x => x.toLowerCase());
      mapping.name = h.findIndex(x => x.includes('nome') || x.includes('name') || x === 'cliente');
      mapping.email = h.findIndex(x => x.includes('email') || x.includes('e-mail'));
      mapping.phone = h.findIndex(x => x.includes('telefone') || x.includes('celular') || x.includes('phone') || x.includes('whatsapp'));
      mapping.birthdate = h.findIndex(x => x.includes('nasc') || x.includes('birth'));
      mapping.city = h.findIndex(x => x.includes('cidade') || x.includes('city'));
      mapping.gender = h.findIndex(x => x.includes('genero') || x.includes('sexo'));
      mapping.status = h.findIndex(x => x.includes('status') || x.includes('ativo'));
      mapping.notes = h.findIndex(x => x.includes('nota') || x.includes('obs'));
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:750px">
        <div class="modal-header">
          <h3>📥 Importar Clientes via CSV</h3>
          <button class="modal-close" id="import-close">✕</button>
        </div>
        <div class="modal-body">

          <!-- Step 1: Upload -->
          <div id="import-step1">
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:16px;margin-bottom:20px">
              <p style="font-weight:700;color:#166534;margin-bottom:8px">📋 Como importar:</p>
              <ol style="color:#166534;font-size:0.85rem;padding-left:18px;line-height:1.9">
                <li>Baixe o modelo CSV ou use sua própria planilha salva como .csv</li>
                <li>Na próxima tela, você vinculará suas colunas com os campos do sistema</li>
                <li>Máximo 500 clientes por vez</li>
              </ol>
              <button class="btn btn-secondary btn-sm" id="btn-download-template" style="margin-top:10px">⬇️ Baixar Modelo CSV</button>
            </div>

            <div id="drop-zone" style="display:block;border:2px dashed var(--green-300);border-radius:12px;
              padding:50px 20px;text-align:center;cursor:pointer;transition:all .2s;
              background:var(--green-50);color:var(--text-muted)">
              <div style="font-size:2.5rem;margin-bottom:8px">📁</div>
              <div style="font-size:0.95rem;font-weight:600">Clique ou arraste seu arquivo CSV aqui</div>
              <div style="font-size:0.78rem;margin-top:4px">Separado por vírgulas (.csv UTF-8)</div>
              <input type="file" id="csv-file-input" accept=".csv,text/csv" style="display:none" />
            </div>
          </div>

          <!-- Step 2: Mapping & Preview -->
          <div id="import-step2" style="display:none">
            
            <div style="background:#f8fafc;border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:16px">
              <h4 style="font-size:0.9rem;margin:0 0 12px 0">1. Vincule as colunas do seu arquivo</h4>
              <div class="form-grid" style="grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px;">
                <div class="form-group mb-0"><label class="field-label" style="font-size:0.75rem">Nome *</label><select id="map-name" class="field-select map-select"></select></div>
                <div class="form-group mb-0"><label class="field-label" style="font-size:0.75rem">E-mail</label><select id="map-email" class="field-select map-select"></select></div>
                <div class="form-group mb-0"><label class="field-label" style="font-size:0.75rem">Telefone</label><select id="map-phone" class="field-select map-select"></select></div>
                <div class="form-group mb-0"><label class="field-label" style="font-size:0.75rem">Nascimento</label><select id="map-birthdate" class="field-select map-select"></select></div>
                <div class="form-group mb-0"><label class="field-label" style="font-size:0.75rem">Cidade</label><select id="map-city" class="field-select map-select"></select></div>
                <div class="form-group mb-0"><label class="field-label" style="font-size:0.75rem">Gênero</label><select id="map-gender" class="field-select map-select"></select></div>
              </div>
            </div>

            <h4 style="font-size:0.9rem;margin:0 0 8px 0;display:flex;justify-content:space-between">
               2. Preview dos Dados <span id="import-stats" style="font-weight:normal;font-size:0.8rem;color:var(--text-muted)"></span>
            </h4>
            <div class="table-wrapper" style="max-height:260px;border:1px solid var(--border);border-radius:8px">
              <table class="clients-table" id="preview-table" style="min-width:650px;margin:0;border:none">
                <thead style="position:sticky;top:0;z-index:1;background:#f8fafc"><tr>
                  <th style="width:40px">#</th><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Nascimento</th><th>Cidade</th>
                </tr></thead>
                <tbody id="preview-tbody"></tbody>
              </table>
            </div>
            
            <button class="btn btn-secondary btn-sm" id="btn-change-file" style="margin-top:16px">🔄 Trocar arquivo</button>
          </div>

          <!-- Step 3: Result -->
          <div id="import-step3" style="display:none;text-align:center;padding:20px"></div>

        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="import-cancel">Cancelar</button>
          <button class="btn btn-primary" id="btn-do-import" disabled style="min-width:130px">📥 Importar</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    const closeModal = () => overlay.remove();
    overlay.querySelector('#import-close').addEventListener('click', closeModal);
    overlay.querySelector('#import-cancel').addEventListener('click', closeModal);
    overlay.querySelector('#btn-download-template').addEventListener('click', downloadTemplate);

    // File handling
    const fileInput = overlay.querySelector('#csv-file-input');
    const dropZone = overlay.querySelector('#drop-zone');

    function handleFile(file) {
      if (!file || !file.name.toLowerCase().endsWith('.csv')) { toast('Use um arquivo .csv', 'error'); return; }
      const reader = new FileReader();
      reader.onload = e => {
        parsedCsv = parseCSV(e.target.result);
        if (parsedCsv.rows.length === 0) { toast('Arquivo vazio ou inválido', 'error'); return; }
        autoMapHeaders();
        initMappingUI();
        showPreview();
      };
      reader.readAsText(file, 'UTF-8');
    }

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => handleFile(e.target.files[0]));
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.borderColor = 'var(--green-500)'; dropZone.style.background = 'var(--green-100)'; });
    dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = ''; dropZone.style.background = ''; });
    dropZone.addEventListener('drop', e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); });

    function initMappingUI() {
      const optionsStr = '<option value="-1">-- Ignorar --</option>' + parsedCsv.headers.map((h, i) => `<option value="${i}">${h}</option>`).join('');
      ['name', 'email', 'phone', 'birthdate', 'city', 'gender'].forEach(key => {
        const sel = overlay.querySelector('#map-' + key);
        sel.innerHTML = optionsStr;
        sel.value = mapping[key];
        sel.addEventListener('change', e => {
          mapping[key] = parseInt(e.target.value, 10);
          updatePreviewTable();
        });
      });
    }

    function updatePreviewTable() {
      // Build final objects to check validity
      const finalData = parsedCsv.rows.map(row => ({
        nome: mapping.name >= 0 ? row[mapping.name] : '',
        email: mapping.email >= 0 ? row[mapping.email] : '',
        telefone: mapping.phone >= 0 ? row[mapping.phone] : '',
        data_nascimento: mapping.birthdate >= 0 ? row[mapping.birthdate] : '',
        cidade: mapping.city >= 0 ? row[mapping.city] : '',
        genero: mapping.gender >= 0 ? row[mapping.gender] : '',
      }));

      const semNome = finalData.filter(r => !r.nome?.trim()).length;
      overlay.querySelector('#import-stats').innerHTML = 
        `Listando ${parsedCsv.rows.length} linhas ${semNome > 0 ? `<span style="color:#dc2626;font-weight:600">(${semNome} com erro)</span>` : ''}`;

      // Enable import button only if valid
      overlay.querySelector('#btn-do-import').disabled = (mapping.name === -1);

      overlay.querySelector('#preview-tbody').innerHTML = finalData.slice(0, 8).map((r, i) => {
        const hasNome = !!r.nome?.trim();
        return `<tr style="${!hasNome ? 'background:#fff1f2' : ''}">
          <td style="font-size:0.75rem;color:var(--text-muted)">${i + 2}</td>
          <td style="font-weight:${hasNome ? '600' : 'normal'};color:${hasNome ? 'inherit' : '#dc2626'}">${r.nome || 'Nome vazio!'}</td>
          <td style="font-size:0.8rem">${r.email || '—'}</td>
          <td style="font-size:0.8rem">${r.telefone || '—'}</td>
          <td style="font-size:0.8rem">${r.data_nascimento || '—'}</td>
          <td style="font-size:0.8rem">${r.cidade || '—'}</td>
        </tr>`;
      }).join('');
      
      if (parsedCsv.rows.length > 8) {
        overlay.querySelector('#preview-tbody').innerHTML += `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);font-size:0.8rem;padding:10px">... e mais ${parsedCsv.rows.length - 8} clientes</td></tr>`;
      }
    }

    function showPreview() {
      overlay.querySelector('#import-step1').style.display = 'none';
      overlay.querySelector('#import-step2').style.display = 'block';
      updatePreviewTable();
    }

    overlay.querySelector('#btn-change-file').addEventListener('click', () => {
      overlay.querySelector('#import-step1').style.display = 'block';
      overlay.querySelector('#import-step2').style.display = 'none';
      overlay.querySelector('#btn-do-import').disabled = true;
      parsedCsv = { headers: [], rows: [] }; fileInput.value = '';
    });

    // Import
    overlay.querySelector('#btn-do-import').addEventListener('click', async () => {
      const btn = overlay.querySelector('#btn-do-import');
      btn.disabled = true; btn.textContent = '⏳ Importando...';
      try {
        const finalData = parsedCsv.rows.map(row => ({
          nome: mapping.name >= 0 ? row[mapping.name] : '',
          email: mapping.email >= 0 ? row[mapping.email] : undefined,
          telefone: mapping.phone >= 0 ? row[mapping.phone] : undefined,
          data_nascimento: mapping.birthdate >= 0 ? row[mapping.birthdate] : undefined,
          cidade: mapping.city >= 0 ? row[mapping.city] : undefined,
          genero: mapping.gender >= 0 ? row[mapping.gender] : undefined,
          status: 'ativo'
        })).filter(r => !!r.nome?.trim()); // Drop empty names

        const { api } = await import('../store.js').then(m => ({ api: m.api }));
        const res = await api('POST', '/api/clientes/import', { clientes: finalData });
        
        overlay.querySelector('#import-step2').style.display = 'none';
        overlay.querySelector('#import-step3').style.display = 'block';
        overlay.querySelector('#import-step3').innerHTML = `
          <div style="font-size:3rem;margin-bottom:12px">✅</div>
          <h3 style="color:#16a34a;margin-bottom:16px">Importação concluída!</h3>
          <div style="display:flex;justify-content:center;gap:20px;flex-wrap:wrap;margin-bottom:20px">
            <div style="text-align:center">
              <div style="font-size:2rem;font-weight:800;color:#16a34a">${res.criados}</div>
              <div style="font-size:0.8rem;color:var(--text-muted)">Criados</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:2rem;font-weight:800;color:#d97706">${res.pulados}</div>
              <div style="font-size:0.8rem;color:var(--text-muted)">Pulados (duplicados)</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:2rem;font-weight:800;color:#dc2626">${res.erros?.length || 0}</div>
              <div style="font-size:0.8rem;color:var(--text-muted)">Erros</div>
            </div>
          </div>
          ${res.erros?.length ? `<details style="text-align:left;font-size:0.8rem"><summary style="cursor:pointer;color:var(--text-muted)">Ver erros</summary><pre style="background:#f8f9fa;padding:10px;border-radius:6px;overflow:auto;margin-top:8px">${res.erros.map(e => `Linha ${e.linha}: ${e.erro}`).join('\n')}</pre></details>` : ''}`;
        
        overlay.querySelector('#import-cancel').textContent = 'Fechar';
        overlay.querySelector('#btn-do-import').style.display = 'none';
        await refresh();
      } catch (err) {
        toast('Erro na importação: ' + err.message, 'error');
        btn.disabled = false; btn.textContent = '📥 Fazendo Importação Novamente';
      }
    });
  }

  await refresh();
  buildPage();
}
