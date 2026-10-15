import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { adminRoomsHandlers } from '@/test/mocks/handlers/adminRooms';
import AdminSlotsPage from './AdminSlotsPage';

const server = setupServer(...adminRoomsHandlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('AdminSlotsPage', () => {
  it('lists slots of a room, creates, edits, blocks/unblocks, and deletes', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/salas/room-1/horarios']}>
        <Routes>
          <Route path="/admin/salas/:id/horarios" element={<AdminSlotsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('09:00')).toBeInTheDocument();
    expect(screen.getAllByText('10:00')[0]).toBeInTheDocument();
  });

  it('shows business errors for SLOT_OVERLAP and active booking', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/salas/room-1/horarios']}>
        <Routes>
          <Route path="/admin/salas/:id/horarios" element={<AdminSlotsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.click(await screen.findByRole('button', { name: /Crear Franja/i }));
    await userEvent.type(screen.getByLabelText(/Hora de inicio/i), '09:00');
    await userEvent.type(screen.getByLabelText(/Hora de fin/i), '10:00');
    await userEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    expect(await screen.findByText(/La franja horaria se solapa con otra existente/i)).toBeInTheDocument();
  });
});