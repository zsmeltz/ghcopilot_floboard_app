export type Card = {
  id: string;
  title: string;
  details: string;
};

export type Column = {
  id: string;
  name: string;
  cards: Card[];
};

export type Board = {
  id: string;
  name: string;
  details: string;
  columns: Column[];
};

export const initialColumns: Column[] = [
  {
    id: 'ideas',
    name: 'Ideas',
    cards: [
      {
        id: 'card-1',
        title: 'Launch teaser campaign',
        details: 'Plan the countdown content for the new feature release.',
      },
      {
        id: 'card-2',
        title: 'Customer win stories',
        details: 'Collect a few strong use cases for the homepage update.',
      },
    ],
  },
  {
    id: 'planning',
    name: 'Planning',
    cards: [
      {
        id: 'card-3',
        title: 'Sprint outline',
        details: 'Define the milestone goals and success metrics for next week.',
      },
    ],
  },
  {
    id: 'in-progress',
    name: 'In Progress',
    cards: [
      {
        id: 'card-4',
        title: 'Homepage refresh',
        details: 'Tighten copy and clarify the value proposition sections.',
      },
      {
        id: 'card-5',
        title: 'Onboarding checklist',
        details: 'Reduce friction for first-time users during setup.',
      },
    ],
  },
  {
    id: 'review',
    name: 'Review',
    cards: [
      {
        id: 'card-6',
        title: 'Documentation sweep',
        details: 'Refresh the support docs and update key examples.',
      },
    ],
  },
  {
    id: 'done',
    name: 'Done',
    cards: [
      {
        id: 'card-7',
        title: 'Brand refresh',
        details: 'Finalize the visual direction and core interface updates.',
      },
    ],
  },
];

export function createBoard(id: string, name: string, details = ''): Board {
  return {
    id,
    name: name.trim(),
    details: details.trim(),
    columns: initialColumns.map((column) => ({
      ...column,
      cards: column.cards.map((card) => ({ ...card })),
    })),
  };
}

export function renameColumn(
  columns: Column[],
  columnId: string,
  name: string,
): Column[] {
  const trimmedName = name.trim();
  if (!trimmedName) return columns;

  return columns.map((column) =>
    column.id === columnId ? { ...column, name: trimmedName } : column,
  );
}

export function addCard(
  columns: Column[],
  columnId: string,
  card: Card,
): Column[] {
  return columns.map((column) =>
    column.id === columnId
      ? { ...column, cards: [...column.cards, card] }
      : column,
  );
}

export function deleteCard(
  columns: Column[],
  columnId: string,
  cardId: string,
): Column[] {
  return columns.map((column) =>
    column.id === columnId
      ? { ...column, cards: column.cards.filter((card) => card.id !== cardId) }
      : column,
  );
}

export function moveCard(
  columns: Column[],
  cardId: string,
  targetColumnId: string,
): Column[] {
  const sourceColumn = columns.find((column) =>
    column.cards.some((card) => card.id === cardId),
  );
  const card = sourceColumn?.cards.find((item) => item.id === cardId);
  const targetColumn = columns.find((column) => column.id === targetColumnId);

  if (!sourceColumn || !card || !targetColumn || sourceColumn.id === targetColumnId) {
    return columns;
  }

  return columns.map((column) => {
    if (column.id === sourceColumn.id) {
      return {
        ...column,
        cards: column.cards.filter((item) => item.id !== cardId),
      };
    }

    if (column.id === targetColumnId) {
      return { ...column, cards: [...column.cards, card] };
    }

    return column;
  });
}
