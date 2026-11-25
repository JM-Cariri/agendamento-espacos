import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SpaceForm } from './SpaceForm.jsx';

describe('SpaceForm', () => {
  it('updates a space without sending read-only API metadata', () => {
    const onSubmit = vi.fn();
    render(<SpaceForm initialValue={{
      id: 8, nome: 'Sala 8', capacidade: 28, descricao: 'Projetor', localizacao_predio: 'Bloco A',
      horario_funcionamento_inicio: '07:00:00', horario_funcionamento_fim: '22:00:00', created_at: 'today', updated_at: 'today',
    }} onSubmit={onSubmit} onCancel={() => {}} busy={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar espaço' }));
    expect(onSubmit).toHaveBeenCalledWith({ nome: 'Sala 8', capacidade: 28, descricao: 'Projetor', localizacao_predio: 'Bloco A' });
  });
});
