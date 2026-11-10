import { describe, expect, it } from 'vitest';
import {
  addCard,
  createBoard,
  deleteCard,
  initialColumns,
  moveCard,
  renameColumn,
} from './board';

describe('board state', () => {
  it('starts with five populated columns', () => {
    expect(initialColumns).toHaveLength(5);
    expect(initialColumns.every((column) => column.cards.length > 0)).toBe(true);
  });

  it('creates separately named boards with independent column data', () => {
    const first = createBoard('board-1', ' Marketing ');
    const second = createBoard('board-2', 'Product');

    expect(first.name).toBe('Marketing');
    expect(first.columns).toHaveLength(5);
    expect(first.columns).not.toBe(second.columns);
    expect(first.columns[0].cards).not.toBe(second.columns[0].cards);
  });

  it('renames a column and ignores an empty name', () => {
    const renamed = renameColumn(initialColumns, 'ideas', '  Backlog  ');

    expect(renamed[0].name).toBe('Backlog');
    expect(renameColumn(renamed, 'ideas', '   ')).toBe(renamed);
  });

  it('adds and deletes a card only in the selected column', () => {
    const card = { id: 'new-card', title: 'New task', details: 'Task details' };
    const added = addCard(initialColumns, 'ideas', card);

    expect(added[0].cards.at(-1)).toEqual(card);
    expect(added[1].cards).toEqual(initialColumns[1].cards);

    const deleted = deleteCard(added, 'ideas', card.id);
    expect(deleted[0].cards.some((item) => item.id === card.id)).toBe(false);
    expect(deleted[1].cards).toEqual(initialColumns[1].cards);
  });

  it('moves a card to exactly one column', () => {
    const moved = moveCard(initialColumns, 'card-1', 'planning');

    expect(moved[0].cards.some((card) => card.id === 'card-1')).toBe(false);
    expect(moved[1].cards.filter((card) => card.id === 'card-1')).toHaveLength(1);
    expect(moved.flatMap((column) => column.cards).filter((card) => card.id === 'card-1')).toHaveLength(1);
  });

  it('does not change the board for unknown cards or columns', () => {
    expect(moveCard(initialColumns, 'missing-card', 'planning')).toBe(initialColumns);
    expect(moveCard(initialColumns, 'card-1', 'missing-column')).toBe(initialColumns);
  });
});
