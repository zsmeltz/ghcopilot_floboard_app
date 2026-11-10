'use client';

import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import {
  addCard,
  createBoard,
  deleteCard,
  moveCard,
  renameColumn,
  type Board,
  type Card,
  type Column,
} from '../lib/board';
import styles from './page.module.css';

type DraftCard = {
  title: string;
  details: string;
};

type DraggableCardProps = {
  card: Card;
  columnId: string;
  keyboardPickedUp: boolean;
  onDelete: (columnId: string, cardId: string) => void;
  onKeyDown: (cardId: string, event: KeyboardEvent<HTMLButtonElement>) => void;
};

function DraggableCard({
  card,
  columnId,
  keyboardPickedUp,
  onDelete,
  onKeyDown,
}: DraggableCardProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
  } = useDraggable({
    id: card.id,
    data: { columnId },
  });
  const moveButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (keyboardPickedUp) moveButtonRef.current?.focus();
  }, [columnId, keyboardPickedUp]);

  return (
    <article
      ref={setNodeRef}
      className={`${styles.card} ${isDragging ? styles.cardDragging : ''} ${keyboardPickedUp ? styles.cardKeyboardPickedUp : ''}`}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
      aria-label={`${card.title}. ${card.details}`}
    >
      <div className={styles.cardHeader}>
        <h3>{card.title}</h3>
        <div className={styles.cardActions}>
          <button
            ref={(node) => {
              setActivatorNodeRef(node);
              moveButtonRef.current = node;
            }}
            type="button"
            className={styles.moveButton}
            aria-label={`Move ${card.title}`}
            onKeyDown={(event) => onKeyDown(card.id, event)}
            {...attributes}
            {...listeners}
            aria-pressed={keyboardPickedUp}
          >
            Move
          </button>
          <button
            type="button"
            className={styles.deleteButton}
            aria-label={`Delete ${card.title}`}
            onClick={() => onDelete(columnId, card.id)}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="m6 6 8 8m0-8-8 8" />
            </svg>
          </button>
        </div>
      </div>
      <p>{card.details}</p>
    </article>
  );
}

type BoardColumnProps = {
  column: Column;
  isRenaming: boolean;
  isAddingCard: boolean;
  columnNameDraft: string;
  cardDraft: DraftCard;
  onBeginRename: (column: Column) => void;
  onChangeColumnName: (value: string) => void;
  onSaveColumnName: () => void;
  onCancelRename: () => void;
  onAddCard: () => void;
  onChangeCardDraft: (field: keyof DraftCard, value: string) => void;
  onSaveCard: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancelAddCard: () => void;
  onDeleteCard: (columnId: string, cardId: string) => void;
  keyboardCardId: string | null;
  onCardKeyDown: (cardId: string, event: KeyboardEvent<HTMLButtonElement>) => void;
};

function BoardColumn({
  column,
  isRenaming,
  isAddingCard,
  columnNameDraft,
  cardDraft,
  onBeginRename,
  onChangeColumnName,
  onSaveColumnName,
  onCancelRename,
  onAddCard,
  onChangeCardDraft,
  onSaveCard,
  onCancelAddCard,
  onDeleteCard,
  keyboardCardId,
  onCardKeyDown,
}: BoardColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: column.id });

  return (
    <section
      ref={setNodeRef}
      className={`${styles.column} ${isOver ? styles.columnOver : ''}`}
      aria-labelledby={`column-${column.id}-title`}
      data-column-id={column.id}
    >
      <div className={styles.columnHeader}>
        {isRenaming ? (
          <form
            className={styles.renameField}
            onSubmit={(event) => {
              event.preventDefault();
              onSaveColumnName();
            }}
          >
            <input
              aria-label="Column name"
              required
              autoFocus
              value={columnNameDraft}
              onChange={(event) => onChangeColumnName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') onCancelRename();
              }}
            />
            <button type="submit" className={styles.saveRenameButton} aria-label="Save column name">
              Save
            </button>
            <button
              type="button"
              className={styles.cancelRenameButton}
              aria-label="Cancel renaming column"
              onClick={onCancelRename}
            >
              Cancel
            </button>
          </form>
        ) : (
          <>
            <div className={styles.titleWrap}>
              <span className={styles.columnDot} aria-hidden="true" />
              <h2 id={`column-${column.id}-title`}>{column.name}</h2>
              <span className={styles.cardCount} aria-label={`${column.cards.length} cards`}>
                {column.cards.length}
              </span>
            </div>
            <button
              type="button"
              className={styles.renameButton}
              aria-label={`Rename ${column.name}`}
              onClick={() => onBeginRename(column)}
            >
              Edit
            </button>
          </>
        )}
      </div>

      <div className={styles.cardList}>
        {column.cards.map((card) => (
          <DraggableCard
            key={card.id}
            card={card}
            columnId={column.id}
            keyboardPickedUp={keyboardCardId === card.id}
            onDelete={onDeleteCard}
            onKeyDown={onCardKeyDown}
          />
        ))}
      </div>

      {isRenaming ? null : (
        <div className={styles.addCardArea}>
          <CardComposer
            column={column}
            isAddingCard={isAddingCard}
            cardDraft={cardDraft}
            onAddCard={onAddCard}
            onChangeCardDraft={onChangeCardDraft}
            onSaveCard={onSaveCard}
            onCancelAddCard={onCancelAddCard}
          />
        </div>
      )}
    </section>
  );
}

type CardComposerProps = Pick<
  BoardColumnProps,
  | 'column'
  | 'isAddingCard'
  | 'cardDraft'
  | 'onAddCard'
  | 'onChangeCardDraft'
  | 'onSaveCard'
  | 'onCancelAddCard'
>;

function CardComposer({
  column,
  isAddingCard,
  cardDraft,
  onAddCard,
  onChangeCardDraft,
  onSaveCard,
  onCancelAddCard,
}: CardComposerProps) {
  if (!isAddingCard) {
    return (
      <button
        type="button"
        className={styles.addCardButton}
        aria-label={`Add a card to ${column.name}`}
        onClick={onAddCard}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 4v12M4 10h12" />
        </svg>
        Add a card
      </button>
    );
  }

  return (
    <form
      className={styles.addCardForm}
      aria-label={`Add a card to ${column.name}`}
      onSubmit={(event) => {
        onSaveCard(event);
      }}
    >
      <label>
        <span>Title</span>
        <input
          type="text"
          name="title"
          placeholder="Card title"
          aria-label="Card title"
          required
          value={cardDraft.title}
          onChange={(event) => onChangeCardDraft('title', event.target.value)}
        />
      </label>
      <label>
        <span>Details</span>
        <textarea
          name="details"
          placeholder="Add a few details..."
          aria-label="Card details"
          required
          value={cardDraft.details}
          onChange={(event) => onChangeCardDraft('details', event.target.value)}
        />
      </label>
      <div className={styles.formActions}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={() => {
            onCancelAddCard();
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.submitButton}
          aria-label="Save card"
          disabled={!cardDraft.title.trim() || !cardDraft.details.trim()}
        >
          Add card
        </button>
      </div>
    </form>
  );
}

type BoardSetupProps = {
  isFirstBoard: boolean;
  onCreateBoard: (name: string, details: string) => void;
  onCancel: () => void;
};

function BoardSetup({ isFirstBoard, onCreateBoard, onCancel }: BoardSetupProps) {
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');

  return (
    <section className={styles.setup} aria-labelledby="setup-title">
      <div className={styles.setupIcon} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className={styles.eyebrow}>Make it yours</p>
      <h1 id="setup-title">{isFirstBoard ? 'Name your first floboard' : 'Create another floboard'}</h1>
      <p className={styles.setupDescription}>
        Give this board a name. You can rename its columns and organize cards once it is ready.
      </p>
      <form
        className={styles.setupForm}
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) onCreateBoard(name.trim(), details.trim());
        }}
      >
        <label htmlFor="board-name">Board name</label>
        <input
          id="board-name"
          name="boardName"
          type="text"
          autoFocus
          autoComplete="off"
          maxLength={60}
          placeholder="For example, Summer launch"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <label htmlFor="board-details">Details <span>(optional)</span></label>
        <textarea
          id="board-details"
          name="boardDetails"
          rows={3}
          maxLength={240}
          placeholder="What is this board for?"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
        />
        <button type="submit" className={styles.createBoardButton} disabled={!name.trim()}>
          Create board
        </button>
      </form>
      {!isFirstBoard && (
        <button type="button" className={styles.backToBoardButton} onClick={onCancel}>
          Back to board
        </button>
      )}
    </section>
  );
}

export default function Home() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [isCreatingBoard, setIsCreatingBoard] = useState(true);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [draftColumnName, setDraftColumnName] = useState('');
  const [activeAddColumnId, setActiveAddColumnId] = useState<string | null>(null);
  const [draftCards, setDraftCards] = useState<Record<string, DraftCard>>({});
  const [announcement, setAnnouncement] = useState('');
  const [keyboardCardId, setKeyboardCardId] = useState<string | null>(null);
  const [keyboardOriginColumnId, setKeyboardOriginColumnId] = useState<string | null>(null);
  const activeBoard = boards.find((board) => board.id === activeBoardId);
  const columns = activeBoard?.columns ?? [];
  const cardCount = columns.reduce((total, column) => total + column.cards.length, 0);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const updateActiveColumns = (update: (currentColumns: Column[]) => Column[]) => {
    if (!activeBoardId) return;

    setBoards((currentBoards) =>
      currentBoards.map((board) =>
        board.id === activeBoardId
          ? { ...board, columns: update(board.columns) }
          : board,
      ),
    );
  };

  const handleCreateBoard = (name: string, details: string) => {
    const board = createBoard(crypto.randomUUID(), name, details);
    setBoards((currentBoards) => [...currentBoards, board]);
    setActiveBoardId(board.id);
    setIsCreatingBoard(false);
    setEditingColumnId(null);
    setActiveAddColumnId(null);
    setDraftCards({});
    setKeyboardCardId(null);
    setKeyboardOriginColumnId(null);
  };

  const selectBoard = (boardId: string) => {
    setActiveBoardId(boardId);
    setIsCreatingBoard(false);
    setEditingColumnId(null);
    setActiveAddColumnId(null);
    setDraftCards({});
    setKeyboardCardId(null);
    setKeyboardOriginColumnId(null);
  };

  const beginCreateBoard = () => {
    setIsCreatingBoard(true);
    setEditingColumnId(null);
    setActiveAddColumnId(null);
    setDraftCards({});
    setKeyboardCardId(null);
    setKeyboardOriginColumnId(null);
  };

  const deleteActiveBoard = () => {
    if (!activeBoard || !window.confirm(`Delete "${activeBoard.name}" and all of its cards?`)) {
      return;
    }

    const remainingBoards = boards.filter((board) => board.id !== activeBoard.id);
    setBoards(remainingBoards);
    setEditingColumnId(null);
    setActiveAddColumnId(null);
    setDraftCards({});
    setKeyboardCardId(null);
    setKeyboardOriginColumnId(null);

    if (remainingBoards.length === 0) {
      setActiveBoardId(null);
      setIsCreatingBoard(true);
      return;
    }

    const deletedIndex = boards.findIndex((board) => board.id === activeBoard.id);
    const nextBoard = remainingBoards[Math.min(deletedIndex, remainingBoards.length - 1)];
    setActiveBoardId(nextBoard.id);
    setIsCreatingBoard(false);
  };

  const beginRename = (column: Column) => {
    setEditingColumnId(column.id);
    setDraftColumnName(column.name);
  };

  const saveRename = () => {
    if (!editingColumnId || !draftColumnName.trim()) return;

    updateActiveColumns((currentColumns) =>
      renameColumn(currentColumns, editingColumnId, draftColumnName),
    );
    setEditingColumnId(null);
    setDraftColumnName('');
  };

  const updateDraftCard = (columnId: string, field: keyof DraftCard, value: string) => {
    setDraftCards((currentDrafts) => ({
      ...currentDrafts,
      [columnId]: {
        title: currentDrafts[columnId]?.title ?? '',
        details: currentDrafts[columnId]?.details ?? '',
        [field]: value,
      },
    }));
  };

  const createCard = (columnId: string, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cardDraft = draftCards[columnId] ?? { title: '', details: '' };
    const title = cardDraft.title.trim();
    const details = cardDraft.details.trim();

    if (!title || !details) return;

    const card: Card = {
      id: crypto.randomUUID(),
      title,
      details,
    };

    updateActiveColumns((currentColumns) => addCard(currentColumns, columnId, card));
    setDraftCards((currentDrafts) => ({
      ...currentDrafts,
      [columnId]: { title: '', details: '' },
    }));
    setActiveAddColumnId(null);
  };

  const cancelAddCard = (columnId: string) => {
    setActiveAddColumnId(null);
    setDraftCards((currentDrafts) => ({
      ...currentDrafts,
      [columnId]: { title: '', details: '' },
    }));
  };

  const removeCard = (columnId: string, cardId: string) => {
    updateActiveColumns((currentColumns) => deleteCard(currentColumns, columnId, cardId));
  };

  const handleCardKeyDown = (
    cardId: string,
    event: KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      const card = columns.flatMap((column) => column.cards).find((item) => item.id === cardId);
      if (keyboardCardId === cardId) {
        setKeyboardCardId(null);
        setKeyboardOriginColumnId(null);
        setAnnouncement(`${card?.title ?? 'Card'} dropped.`);
      } else {
        setKeyboardCardId(cardId);
        setKeyboardOriginColumnId(
          columns.find((column) => column.cards.some((item) => item.id === cardId))?.id ?? null,
        );
        setAnnouncement(`${card?.title ?? 'Card'} picked up. Use the Left and Right Arrow keys to move it.`);
      }
      return;
    }

    if (event.code === 'Escape' && keyboardCardId === cardId) {
      event.preventDefault();
      if (keyboardOriginColumnId) {
        updateActiveColumns((currentColumns) =>
          moveCard(currentColumns, cardId, keyboardOriginColumnId),
        );
      }
      setKeyboardCardId(null);
      setKeyboardOriginColumnId(null);
      setAnnouncement('Card movement cancelled.');
      return;
    }

    if (
      keyboardCardId !== cardId ||
      (event.code !== 'ArrowLeft' && event.code !== 'ArrowRight')
    ) {
      return;
    }

    event.preventDefault();
    const sourceColumnIndex = columns.findIndex((column) =>
      column.cards.some((card) => card.id === cardId),
    );
    const targetColumn = columns[sourceColumnIndex + (event.code === 'ArrowRight' ? 1 : -1)];
    const card = columns[sourceColumnIndex]?.cards.find((item) => item.id === cardId);

    if (!targetColumn || !card) return;

    updateActiveColumns((currentColumns) => moveCard(currentColumns, cardId, targetColumn.id));
    setAnnouncement(`${card.title} moved to ${targetColumn.name}.`);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;

    const targetColumn = columns.find((column) => column.id === String(over.id));
    const card = columns.flatMap((column) => column.cards).find((item) => item.id === String(active.id));
    if (!targetColumn || !card) return;

    updateActiveColumns((currentColumns) => moveCard(currentColumns, card.id, targetColumn.id));
    if (active.data.current?.columnId !== targetColumn.id) {
      setAnnouncement(`${card.title} moved to ${targetColumn.name}.`);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className={styles.brandName}>floboard</span>
        </div>
      </header>

      {boards.length > 0 && (
        <nav className={styles.boardTabs} aria-label="Kanban boards">
          {boards.map((board) => (
            <button
              key={board.id}
              type="button"
              aria-current={!isCreatingBoard && board.id === activeBoardId ? 'page' : undefined}
              className={`${styles.boardTab} ${!isCreatingBoard && board.id === activeBoardId ? styles.boardTabActive : ''}`}
              onClick={() => selectBoard(board.id)}
            >
              {board.name}
            </button>
          ))}
          <button
            type="button"
            className={styles.addBoardTab}
            aria-label="Add board"
            onClick={beginCreateBoard}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 4v12M4 10h12" />
            </svg>
            Add board
          </button>
        </nav>
      )}

      <main className={styles.main}>
        {isCreatingBoard || !activeBoard ? (
          <BoardSetup
            key={`${activeBoardId ?? 'first-board'}-${isCreatingBoard}`}
            isFirstBoard={boards.length === 0}
            onCreateBoard={handleCreateBoard}
            onCancel={() => {
              if (activeBoardId) setIsCreatingBoard(false);
            }}
          />
        ) : (
          <>
            <section className={styles.boardIntro} aria-labelledby="board-title">
              <div>
                <p className={styles.eyebrow}>Project board</p>
                <h1 id="board-title">{activeBoard.name}</h1>
                {activeBoard.details && <p className={styles.subtitle}>{activeBoard.details}</p>}
              </div>
              <div className={styles.boardSummary} aria-live="polite">
                <span className={styles.summaryDot} aria-hidden="true" />
                <span>{columns.length} columns</span>
                <span className={styles.summaryDivider} aria-hidden="true" />
                <span>{cardCount} cards</span>
              </div>
            </section>

            <DndContext
              id="kanban-board"
              sensors={sensors}
              onDragEnd={handleDragEnd}
              accessibility={{
                screenReaderInstructions: {
                  draggable:
                    'Press Space or Enter to pick up a card. Use the Left and Right Arrow keys to move it between columns, then press Space or Enter to drop it. Press Escape to cancel.',
                },
              }}
            >
              <div className={styles.boardWrapper}>
                <div className={styles.board}>
                  {columns.map((column) => (
                    <BoardColumn
                      key={column.id}
                      column={column}
                      isRenaming={editingColumnId === column.id}
                      isAddingCard={activeAddColumnId === column.id}
                      columnNameDraft={draftColumnName}
                      cardDraft={draftCards[column.id] ?? { title: '', details: '' }}
                      onBeginRename={beginRename}
                      onChangeColumnName={setDraftColumnName}
                      onSaveColumnName={saveRename}
                      onCancelRename={() => {
                        setEditingColumnId(null);
                        setDraftColumnName('');
                      }}
                      onAddCard={() => setActiveAddColumnId(column.id)}
                      onChangeCardDraft={(field, value) =>
                        updateDraftCard(column.id, field, value)
                      }
                      onSaveCard={(event) => createCard(column.id, event)}
                      onCancelAddCard={() => cancelAddCard(column.id)}
                      onDeleteCard={removeCard}
                      keyboardCardId={keyboardCardId}
                      onCardKeyDown={handleCardKeyDown}
                    />
                  ))}
                </div>
              </div>
            </DndContext>
            <p className={styles.srOnly} aria-live="polite">{announcement}</p>
            <div className={styles.boardFooter}>
              <button
                type="button"
                className={styles.deleteBoardButton}
                onClick={deleteActiveBoard}
              >
                Delete the flo
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
