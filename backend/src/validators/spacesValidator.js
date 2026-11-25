import { HttpError } from '../utils/http.js';

const fields = ['nome', 'capacidade', 'descricao', 'localizacao_predio', 'horario_funcionamento_inicio', 'horario_funcionamento_fim'];

export function validateSpace(body, partial = false) {
  const errors = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Envie um objeto JSON válido.');
  for (const key of Object.keys(body)) if (!fields.includes(key)) errors.push(`Campo não permitido: ${key}.`);
  if (partial && Object.keys(body).length === 0) errors.push('Informe ao menos um campo para atualizar.');
  if (!partial || 'nome' in body) {
    if (typeof body.nome !== 'string' || !body.nome.trim()) errors.push('Informe um nome não vazio.');
    else if (body.nome.trim().length > 150) errors.push('O nome deve ter até 150 caracteres.');
  }
  if (!partial || 'capacidade' in body) {
    if (!(Number.isSafeInteger(body.capacidade) || (typeof body.capacidade === 'string' && /^\d+$/.test(body.capacidade))) || Number(body.capacidade) <= 0 || Number(body.capacidade) > 2147483647) errors.push('A capacidade deve ser um inteiro positivo.');
  }
  if (!partial || 'localizacao_predio' in body) {
    if (typeof body.localizacao_predio !== 'string' || !body.localizacao_predio.trim()) errors.push('Informe a localização do prédio.');
    else if (body.localizacao_predio.trim().length > 255) errors.push('A localização deve ter até 255 caracteres.');
  }
  if ('descricao' in body && body.descricao !== null && typeof body.descricao !== 'string') errors.push('A descrição deve ser texto ou null.');
  for (const key of ['horario_funcionamento_inicio', 'horario_funcionamento_fim']) {
    const expected = key.endsWith('inicio') ? '07:00' : '22:00';
    if (key in body && body[key] !== expected) errors.push(`O campo ${key} deve ser ${expected} na versão atual.`);
  }
  if (errors.length) throw new HttpError(400, 'Dados do espaço inválidos.', errors);
  return {
    nome: body.nome?.trim(),
    capacidade: body.capacidade === undefined ? undefined : Number(body.capacidade),
    descricao: body.descricao === undefined ? undefined : body.descricao?.trim() || null,
    localizacao_predio: body.localizacao_predio?.trim(),
  };
}

export function parseSpaceId(value) {
  if (!/^\d+$/.test(String(value)) || Number(value) < 1 || Number(value) > 2147483647) throw new HttpError(400, 'Informe um identificador de espaço válido.');
  return Number(value);
}
