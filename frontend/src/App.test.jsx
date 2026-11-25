import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { App } from './App.jsx';
import { SpaceFilter } from './components/SpaceFilter.jsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState({}, '', '/');
});

describe('protected routing', () => {
  it('sends an unauthenticated visitor to login after checking /auth/me', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"error":"Authentication required."}', { status: 401 }));
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({ credentials: 'include' }));
  });

  it('keeps the Clear button disabled while space filters are empty', () => {
    render(<SpaceFilter filters={{ nome: '', capacidadeMinima: '' }} onChange={() => {}} onSubmit={() => {}} onReset={() => {}} />);
    expect(screen.getByRole('button', { name: 'Limpar' })).toBeDisabled();
  });

  it('enables Clear when a space filter is active', () => {
    render(<SpaceFilter filters={{ nome: 'laboratório', capacidadeMinima: '' }} onChange={() => {}} onSubmit={() => {}} onReset={() => {}} />);
    expect(screen.getByRole('button', { name: 'Limpar' })).toBeEnabled();
  });

  it('redirects a Professor away from coordinator-only route to the role dashboard', async () => {
    window.history.replaceState({}, '', '/spaces/manage');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (String(url).endsWith('/auth/me')) return new Response(JSON.stringify({ user: { id: 2, nome: 'Ana', perfil: 'Professor' } }), { status: 200 });
      if (String(url).endsWith('/dashboard/metrics')) return new Response(JSON.stringify({ perfil: 'Professor', minhasReservasFuturas: 1, minhasReservasPendentes: 0, minhasReservasAprovadas: 1 }), { status: 200 });
      return new Response('[]', { status: 200 });
    });
    render(<App />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Olá, Ana' })).toBeInTheDocument());
    expect(screen.queryByRole('heading', { name: 'Espaços' })).not.toBeInTheDocument();
  });

  it('creates a space through the coordinator interface and refreshes the catalog', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    const createdSpace = {
      id: 501,
      nome: 'Espaço 4.0',
      capacidade: 10,
      descricao: null,
      localizacao_predio: 'Pátio, Térreo',
      horario_funcionamento_inicio: '07:00',
      horario_funcionamento_fim: '22:00',
    };
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options = {}) => {
      if (String(url).endsWith('/auth/me')) {
        return new Response(JSON.stringify({ user: { id: 1, nome: 'Coordenador Bruno', perfil: 'Coordenador' } }), { status: 200 });
      }
      if (String(url).includes('/spaces') && options.method === 'POST') {
        return new Response(JSON.stringify(createdSpace), { status: 201 });
      }
      if (String(url).includes('/spaces')) {
        return new Response(JSON.stringify([createdSpace]), { status: 200 });
      }
      return new Response('[]', { status: 200 });
    });

    window.history.replaceState({}, '', '/spaces');
    render(<App />);
    const newSpaceButton = await screen.findByRole('button', { name: 'Novo espaço' });
    await user.click(newSpaceButton);
    await user.type(screen.getByLabelText('Nome'), 'Espaço 4.0');
    await user.type(screen.getByLabelText('Capacidade'), '10');
    await user.type(screen.getByLabelText('Localização no prédio'), 'Pátio, Térreo');
    await user.click(screen.getByRole('button', { name: 'Salvar espaço' }));

    expect(await screen.findByRole('heading', { name: 'Espaço 4.0' })).toBeInTheDocument();
    const createCall = fetchMock.mock.calls.find(([url, options]) => String(url) === '/api/spaces' && options.method === 'POST');
    expect(createCall).toBeDefined();
    expect(JSON.parse(createCall[1].body)).toMatchObject({
      nome: 'Espaço 4.0',
      capacidade: 10,
      localizacao_predio: 'Pátio, Térreo',
    });
    expect(fetchMock.mock.calls.some(([url, options]) => String(url).includes('/spaces/undefined') || options.method === 'PUT')).toBe(false);
  });
});
