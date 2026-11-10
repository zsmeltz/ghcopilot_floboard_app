import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Home from './page';

async function enterBoard(
  user: ReturnType<typeof userEvent.setup>,
  name = 'Summer launch',
  details = '',
) {
  await user.type(screen.getByRole('textbox', { name: 'Board name' }), name);
  if (details) {
    await user.type(screen.getByRole('textbox', { name: 'Details (optional)' }), details);
  }
  await user.click(screen.getByRole('button', { name: 'Create board' }));
}

describe('Flobord boards', () => {
  it('starts on the first-board setup screen', () => {
    render(<Home />);

    expect(screen.getByText('floboard')).toBeInTheDocument();
    expect(screen.queryByText(/Workspace\s*\/\s*Product/i)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Name your first floboard' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Board name' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Kanban boards' })).not.toBeInTheDocument();
  });

  it('creates a named board with five populated columns', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await enterBoard(user, 'Summer launch', 'Ship the new product experience');

    expect(screen.getByRole('heading', { level: 1, name: 'Summer launch' })).toBeInTheDocument();
    expect(screen.getByText('Ship the new product experience')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-column-id]')).toHaveLength(5);
    expect(screen.getByText('Launch teaser campaign')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Summer launch' })).toHaveAttribute('aria-current', 'page');
  });

  it('creates, switches, and keeps independent boards during the session', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await enterBoard(user, 'Marketing');
    await user.click(screen.getByRole('button', { name: 'Rename Ideas' }));
    await user.clear(screen.getByRole('textbox', { name: 'Column name' }));
    await user.type(screen.getByRole('textbox', { name: 'Column name' }), 'Backlog{Enter}');

    await user.click(screen.getByRole('button', { name: 'Add board' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Create another floboard' })).toBeInTheDocument();
    await enterBoard(user, 'Product');

    expect(screen.getByRole('heading', { level: 1, name: 'Product' })).toBeInTheDocument();
    const boardNavigation = screen.getByRole('navigation', { name: 'Kanban boards' });
    expect(within(boardNavigation).getByRole('button', { name: 'Marketing' })).toBeInTheDocument();
    expect(within(boardNavigation).getByRole('button', { name: 'Product' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('region', { name: 'Ideas' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Marketing' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Marketing' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Backlog' })).toBeInTheDocument();
  });

  it('cancels board deletion unless confirmed', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<Home />);

    await enterBoard(user, 'Keep me');
    await user.click(screen.getByRole('button', { name: 'Delete the flo' }));

    expect(confirm).toHaveBeenCalledWith('Delete "Keep me" and all of its cards?');
    expect(screen.getByRole('heading', { level: 1, name: 'Keep me' })).toBeInTheDocument();
    confirm.mockRestore();
  });

  it('returns to setup after deleting the last board', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Home />);

    await enterBoard(user, 'Remove me');
    await user.click(screen.getByRole('button', { name: 'Delete the flo' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Name your first floboard' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Kanban boards' })).not.toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it('renames a column with the keyboard', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await enterBoard(user);
    await user.click(screen.getByRole('button', { name: 'Rename Ideas' }));
    const nameInput = screen.getByRole('textbox', { name: 'Column name' });
    await user.clear(nameInput);
    await user.type(nameInput, 'Backlog{Enter}');

    expect(screen.getByRole('heading', { level: 2, name: 'Backlog' })).toBeInTheDocument();
  });

  it('requires both card fields before adding a card', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await enterBoard(user);
    await user.click(screen.getAllByRole('button', { name: 'Add a card to Ideas' })[0]);
    const form = screen.getByRole('form', { name: 'Add a card to Ideas' });
    const saveButton = within(form).getByRole('button', { name: 'Save card' });
    expect(saveButton).toBeDisabled();

    await user.type(within(form).getByRole('textbox', { name: 'Card title' }), 'New task');
    await user.type(within(form).getByRole('textbox', { name: 'Card details' }), 'A little detail');
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);

    expect(screen.getByRole('heading', { level: 3, name: 'New task' })).toBeInTheDocument();
  });

  it('deletes a card', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await enterBoard(user);
    await user.click(screen.getByRole('button', { name: 'Delete Launch teaser campaign' }));

    expect(screen.queryByRole('heading', { level: 3, name: 'Launch teaser campaign' })).not.toBeInTheDocument();
  });

  it('exposes an accessible keyboard drag handle on a board', async () => {
    const user = userEvent.setup();
    render(<Home />);
    await enterBoard(user);
    const moveHandle = screen.getByRole('button', { name: 'Move Launch teaser campaign' });

    expect(moveHandle).toHaveAttribute('tabindex', '0');
    expect(moveHandle).toHaveAttribute('aria-roledescription', 'draggable');
  });
});
