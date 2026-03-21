import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { SortableQuestionList } from "@features/quizzes/components/SortableQuestionList";
import {
  stripEditorQuestionIds,
  withEditorQuestionId,
} from "@features/quizzes/components/questionEditorUtils";

const dragState = {
  activeId: null,
  overId: null,
  activatorEvent: { clientY: 120 },
};

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children, onDragStart, onDragEnd, onDragCancel }) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onDragStart?.({
            active: { id: dragState.activeId },
            activatorEvent: dragState.activatorEvent,
          })
        }
      >
        Start Mock Drag
      </button>
      <button
        type="button"
        onClick={() =>
          onDragEnd?.({
            active: { id: dragState.activeId },
            over: dragState.overId ? { id: dragState.overId } : null,
          })
        }
      >
        Finish Mock Drag
      </button>
      <button type="button" onClick={() => onDragCancel?.()}>
        Cancel Mock Drag
      </button>
      {children}
    </div>
  ),
  DragOverlay: ({ children }) => <div>{children}</div>,
  KeyboardSensor: class KeyboardSensor {},
  PointerSensor: class PointerSensor {},
  closestCenter: vi.fn(),
  useSensor: (sensor, options) => ({ sensor, options }),
  useSensors: (...sensors) => sensors,
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }) => <div>{children}</div>,
  arrayMove: (items, from, to) => {
    const nextItems = [...items];
    const [movedItem] = nextItems.splice(from, 1);
    nextItems.splice(to, 0, movedItem);
    return nextItems;
  },
  sortableKeyboardCoordinates: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    setActivatorNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: vi.fn(),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: () => undefined,
    },
  },
}));

function buildQuestion(id, text) {
  return withEditorQuestionId({
    _id: id,
    text,
    answers: [
      { _id: `${id}-a`, text: `${text} A`, is_correct: true },
      { _id: `${id}-b`, text: `${text} B`, is_correct: false },
    ],
  });
}

function SortableQuestionListHarness() {
  const [questions, setQuestions] = useState([
    buildQuestion("question-a", "First prompt"),
    buildQuestion("question-b", "Second prompt"),
  ]);

  return (
    <>
      <SortableQuestionList
        questions={questions}
        setQuestions={setQuestions}
        quizTitleLabel="Test Quiz"
        questionBarClass="bg-slate-200/80"
        allowMultipleCorrect={false}
        onQuestionChange={vi.fn()}
        onAnswerChange={vi.fn()}
        onSetCorrectAnswer={vi.fn()}
        onRemoveQuestion={vi.fn()}
      />
      <div data-testid="question-order">
        {questions.map((question) => question.text).join(" | ")}
      </div>
    </>
  );
}

describe("quiz question reordering", () => {
  it("reorders questions when drag end moves an item to a new slot", () => {
    dragState.activeId = "question-question-a";
    dragState.overId = "question-question-b";

    render(<SortableQuestionListHarness />);

    expect(screen.getByTestId("question-order").textContent).toBe(
      "First prompt | Second prompt"
    );

    fireEvent.click(screen.getByRole("button", { name: /start mock drag/i }));
    fireEvent.click(screen.getByRole("button", { name: /finish mock drag/i }));

    expect(screen.getByTestId("question-order").textContent).toBe(
      "Second prompt | First prompt"
    );
    expect(screen.getByText(/moved question 1 to position 2/i)).toBeTruthy();
  });

  it("clears the drag state when the drag is cancelled", () => {
    dragState.activeId = "question-question-a";
    dragState.overId = null;

    render(<SortableQuestionListHarness />);

    fireEvent.click(screen.getByRole("button", { name: /start mock drag/i }));

    expect(screen.getAllByRole("button", { name: /reorder question/i })).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", { name: /cancel mock drag/i }));

    expect(screen.getAllByRole("button", { name: /reorder question/i })).toHaveLength(2);
    expect(screen.getByText(/question move cancelled/i)).toBeTruthy();
  });

  it("strips editor-only ids before quiz payload submission", () => {
    const strippedQuestions = stripEditorQuestionIds([
      buildQuestion("question-a", "First prompt"),
      buildQuestion("question-b", "Second prompt"),
    ]);

    expect(strippedQuestions[0]).not.toHaveProperty("editorSortableId");
    expect(strippedQuestions[1]).not.toHaveProperty("editorSortableId");
    expect(strippedQuestions[0]._id).toBe("question-a");
    expect(strippedQuestions[1]._id).toBe("question-b");
  });
});
