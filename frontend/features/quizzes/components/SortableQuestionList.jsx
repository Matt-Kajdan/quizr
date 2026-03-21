import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const AUTO_SCROLL_EDGE_PX = 96;
const AUTO_SCROLL_MIN_PX = 6;
const AUTO_SCROLL_MAX_PX = 22;
const TOUCH_HOLD_DELAY_MS = 180;
const TOUCH_TOLERANCE_PX = 6;

function srOnlyClassName() {
  return "absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [-webkit-clip-path:inset(50%)] [clip-path:inset(50%)] [-webkit-clip-path:inset(50%)]";
}

function QuestionCardFrame({
  question,
  questionIndex,
  quizTitleLabel,
  questionBarClass,
  allowMultipleCorrect,
  onQuestionChange,
  onAnswerChange,
  onSetCorrectAnswer,
  onRemoveQuestion,
  canRemoveQuestion,
  dragHandleProps,
  isDragging = false,
  isOverlay = false,
}) {
  return (
    <div
      className={`bg-white/70 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden ${
        isDragging ? "opacity-35" : ""
      } ${isOverlay ? "shadow-2xl scale-[1.01] opacity-95" : ""}`}
    >
      <div
        className={`-mx-6 sm:-mx-8 -mt-6 sm:-mt-8 px-6 sm:px-8 py-2 rounded-t-2xl sm:rounded-t-3xl flex items-center justify-between text-xs sm:text-sm font-semibold uppercase tracking-wide text-slate-700 ${questionBarClass}`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            className="h-9 w-9 shrink-0 rounded-lg border border-slate-300/70 bg-white/70 text-slate-600 transition-colors hover:bg-white hover:text-slate-800 active:cursor-grabbing touch-none"
            title={`Reorder question ${questionIndex + 1}`}
            aria-label={`Reorder question ${questionIndex + 1}`}
            {...dragHandleProps}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="mx-auto h-4 w-4"
              fill="currentColor"
            >
              <path d="M7 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm9-12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
            </svg>
          </button>
          <span>Question {questionIndex + 1}</span>
        </div>
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-slate-600 font-medium uppercase truncate max-w-[160px] sm:max-w-[220px]">
            {quizTitleLabel}
          </span>
        </div>
      </div>
      <div className="mt-6">
        <div className="mb-6">
          <div className="flex items-center justify-center mb-2">
            <label className="block text-slate-600 font-medium text-sm text-center">
              Question Text
            </label>
          </div>
          <div className="flex items-center gap-3">
            {isOverlay ? (
              <div className="flex-1 rounded-xl border border-slate-200/80 bg-white/75 px-4 py-3 text-slate-800">
                {question.text || "Untitled question"}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Enter your question..."
                value={question.text}
                onChange={(event) => onQuestionChange(questionIndex, event.target.value)}
                required
                className="flex-1 bg-white/70 border border-slate-200/80 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:shadow-[0_0_16px_-6px_rgba(148,163,184,0.6)]"
              />
            )}
            {canRemoveQuestion && !isOverlay && (
              <button
                type="button"
                onClick={() => onRemoveQuestion(questionIndex)}
                className="h-[46px] w-[46px] shrink-0 rounded-xl border border-rose-200 dark:border-none bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-800/60 dark:hover:text-white transition-colors flex items-center justify-center"
                title="Remove question"
                aria-label={`Remove question ${questionIndex + 1}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="space-y-3">
          <label className="block text-slate-600 font-medium mb-3 text-sm">
            Answer Options (select the correct {allowMultipleCorrect ? "answers" : "answer"})
          </label>
          {question.answers.map((answer, answerIndex) => (
            <div
              key={answer._id || `${question.editorSortableId}-${answerIndex}`}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all focus-within:shadow-[0_0_12px_-2px_rgba(100,116,139,0.25)] dark:focus-within:shadow-[0_0_16px_-2px_rgba(255,255,255,0.15)] ${
                answer.is_correct
                  ? "bg-emerald-100/70 border-emerald-300/70 dark:bg-emerald-900/40 dark:border-emerald-800/60"
                  : "bg-white/60 border-slate-200/80 dark:bg-slate-800/40 dark:border-slate-800/60 hover:border-slate-300/80 dark:hover:border-slate-700/80"
              }`}
              onClick={(event) => {
                if (isOverlay) return;
                if (event.target.closest('input[type="checkbox"], input[type="radio"]')) {
                  return;
                }
                const input = document.getElementById(`answer-${question.editorSortableId}-${answerIndex}`);
                if (input) input.focus();
              }}
              style={{ cursor: isOverlay ? "default" : "text" }}
            >
              <label className={`inline-flex items-center p-2.5 -m-2.5 ${isOverlay ? "" : "cursor-pointer"}`}>
                <input
                  type={allowMultipleCorrect ? "checkbox" : "radio"}
                  name={`correct-${question.editorSortableId}`}
                  checked={answer.is_correct}
                  onChange={() => !isOverlay && onSetCorrectAnswer(questionIndex, answerIndex)}
                  disabled={isOverlay}
                  className="w-5 h-5 appearance-none rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 checked:bg-slate-800 dark:checked:bg-slate-200 checked:border-transparent transition-all cursor-pointer relative after:content-[''] after:absolute after:hidden checked:after:block after:left-[7px] after:top-[3px] after:w-[5px] after:h-[9px] after:border-white dark:after:border-slate-900 after:border-b-2 after:border-r-2 after:rotate-45 disabled:cursor-default"
                />
              </label>
              {isOverlay ? (
                <div className="flex-1 text-slate-800">
                  {answer.text || `Answer ${answerIndex + 1}`}
                </div>
              ) : (
                <label className="flex-1 flex items-center cursor-text">
                  <input
                    type="text"
                    placeholder={`Answer ${answerIndex + 1}`}
                    value={answer.text}
                    onChange={(event) => onAnswerChange(questionIndex, answerIndex, event.target.value)}
                    required
                    id={`answer-${question.editorSortableId}-${answerIndex}`}
                    className="w-full bg-transparent border-none text-slate-800 placeholder:text-slate-400 focus:outline-none no-global-shadow"
                  />
                </label>
              )}
              {answer.is_correct && (
                <span className="text-emerald-600 dark:text-emerald-500 text-sm font-medium pointer-events-none">
                  Correct
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SortableQuestionCard({
  question,
  questionIndex,
  quizTitleLabel,
  questionBarClass,
  allowMultipleCorrect,
  onQuestionChange,
  onAnswerChange,
  onSetCorrectAnswer,
  onRemoveQuestion,
  canRemoveQuestion,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: question.editorSortableId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 180ms ease",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <QuestionCardFrame
        question={question}
        questionIndex={questionIndex}
        quizTitleLabel={quizTitleLabel}
        questionBarClass={questionBarClass}
        allowMultipleCorrect={allowMultipleCorrect}
        onQuestionChange={onQuestionChange}
        onAnswerChange={onAnswerChange}
        onSetCorrectAnswer={onSetCorrectAnswer}
        onRemoveQuestion={onRemoveQuestion}
        canRemoveQuestion={canRemoveQuestion}
        isDragging={isDragging}
        dragHandleProps={{
          ...attributes,
          ...listeners,
          ref: setActivatorNodeRef,
          className:
            "h-9 w-9 shrink-0 rounded-lg border border-slate-300/70 bg-white/70 text-slate-600 transition-colors hover:bg-white hover:text-slate-800 cursor-grab active:cursor-grabbing touch-none",
        }}
      />
    </div>
  );
}

function getQuestionIndex(questions, id) {
  return questions.findIndex((question) => question.editorSortableId === id);
}

function getAutoScrollVelocity(pointerY) {
  if (typeof window === "undefined") return 0;

  if (pointerY < AUTO_SCROLL_EDGE_PX) {
    const ratio = Math.min(1, (AUTO_SCROLL_EDGE_PX - pointerY) / AUTO_SCROLL_EDGE_PX);
    return -(AUTO_SCROLL_MIN_PX + (AUTO_SCROLL_MAX_PX - AUTO_SCROLL_MIN_PX) * ratio * ratio);
  }

  const bottomEdge = window.innerHeight - AUTO_SCROLL_EDGE_PX;
  if (pointerY > bottomEdge) {
    const ratio = Math.min(1, (pointerY - bottomEdge) / AUTO_SCROLL_EDGE_PX);
    return AUTO_SCROLL_MIN_PX + (AUTO_SCROLL_MAX_PX - AUTO_SCROLL_MIN_PX) * ratio * ratio;
  }

  return 0;
}

export function SortableQuestionList({
  questions,
  setQuestions,
  quizTitleLabel,
  questionBarClass,
  allowMultipleCorrect,
  onQuestionChange,
  onAnswerChange,
  onSetCorrectAnswer,
  onRemoveQuestion,
}) {
  const [activeId, setActiveId] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const pointerYRef = useRef(null);
  const autoScrollFrameRef = useRef(null);
  const autoScrollVelocityRef = useRef(0);
  const lastAnnouncedOverIdRef = useRef(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: TOUCH_HOLD_DELAY_MS,
        tolerance: TOUCH_TOLERANCE_PX,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const questionIds = useMemo(
    () => questions.map((question) => question.editorSortableId),
    [questions]
  );
  const activeQuestion = activeId
    ? questions.find((question) => question.editorSortableId === activeId) || null
    : null;

  const stopAutoScroll = useCallback(() => {
    if (autoScrollFrameRef.current) {
      cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
    autoScrollVelocityRef.current = 0;
  }, []);

  const updatePointerPosition = useCallback((event) => {
    if ("touches" in event && event.touches.length > 0) {
      pointerYRef.current = event.touches[0].clientY;
      return;
    }
    if ("clientY" in event) {
      pointerYRef.current = event.clientY;
    }
  }, []);

  useEffect(() => {
    if (!activeId) return undefined;

    const handlePointerMove = (event) => updatePointerPosition(event);
    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
    };
  }, [activeId, updatePointerPosition]);

  useEffect(() => stopAutoScroll, [stopAutoScroll]);

  const startAutoScroll = useCallback(() => {
    if (autoScrollFrameRef.current || typeof window === "undefined") return;

    const tick = () => {
      if (!activeId || pointerYRef.current == null) {
        stopAutoScroll();
        return;
      }

      const targetVelocity = getAutoScrollVelocity(pointerYRef.current);
      autoScrollVelocityRef.current += (targetVelocity - autoScrollVelocityRef.current) * 0.25;

      if (Math.abs(autoScrollVelocityRef.current) < 0.5 && targetVelocity === 0) {
        autoScrollVelocityRef.current = 0;
      } else {
        window.scrollBy({ top: autoScrollVelocityRef.current });
      }

      autoScrollFrameRef.current = requestAnimationFrame(tick);
    };

    autoScrollFrameRef.current = requestAnimationFrame(tick);
  }, [activeId, stopAutoScroll]);

  const describePosition = useCallback(
    (id) => {
      const index = getQuestionIndex(questions, id);
      return index === -1 ? null : index + 1;
    },
    [questions]
  );

  const handleDragStart = useCallback(
    (event) => {
      const { active, activatorEvent } = event;
      setActiveId(active.id);
      lastAnnouncedOverIdRef.current = null;

      if (activatorEvent) {
        updatePointerPosition(activatorEvent);
      }
      startAutoScroll();

      const position = describePosition(active.id);
      if (position) {
        setAnnouncement(`Picked up question ${position}.`);
      }
    },
    [describePosition, startAutoScroll, updatePointerPosition]
  );

  const handleDragOver = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over || over.id === lastAnnouncedOverIdRef.current) return;
      if (active.id === over.id) return;

      lastAnnouncedOverIdRef.current = over.id;
      const toPosition = describePosition(over.id);
      if (toPosition) {
        setAnnouncement(`Question moved to position ${toPosition}.`);
      }
    },
    [describePosition]
  );

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      stopAutoScroll();
      pointerYRef.current = null;
      lastAnnouncedOverIdRef.current = null;
      setActiveId(null);

      if (!over) {
        setAnnouncement("Question drop cancelled.");
        return;
      }

      if (active.id === over.id) {
        const unchangedPosition = describePosition(active.id);
        if (unchangedPosition) {
          setAnnouncement(`Question dropped at position ${unchangedPosition}.`);
        }
        return;
      }

      setQuestions((currentQuestions) => {
        const oldIndex = getQuestionIndex(currentQuestions, active.id);
        const newIndex = getQuestionIndex(currentQuestions, over.id);
        if (oldIndex === -1 || newIndex === -1) return currentQuestions;

        const reordered = arrayMove(currentQuestions, oldIndex, newIndex);
        setAnnouncement(`Moved question ${oldIndex + 1} to position ${newIndex + 1}.`);
        return reordered;
      });
    },
    [describePosition, setQuestions, stopAutoScroll]
  );

  const handleDragCancel = useCallback(() => {
    stopAutoScroll();
    pointerYRef.current = null;
    lastAnnouncedOverIdRef.current = null;
    setActiveId(null);
    setAnnouncement("Question move cancelled.");
  }, [stopAutoScroll]);

  return (
    <>
      <div aria-live="polite" className={srOnlyClassName()}>
        {announcement}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-6 pb-16 sm:pb-0">
            {questions.map((question, questionIndex) => (
              <SortableQuestionCard
                key={question.editorSortableId}
                question={question}
                questionIndex={questionIndex}
                quizTitleLabel={quizTitleLabel}
                questionBarClass={questionBarClass}
                allowMultipleCorrect={allowMultipleCorrect}
                onQuestionChange={onQuestionChange}
                onAnswerChange={onAnswerChange}
                onSetCorrectAnswer={onSetCorrectAnswer}
                onRemoveQuestion={onRemoveQuestion}
                canRemoveQuestion={questions.length > 1}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay zIndex={60}>
          {activeQuestion ? (
            <QuestionCardFrame
              question={activeQuestion}
              questionIndex={getQuestionIndex(questions, activeQuestion.editorSortableId)}
              quizTitleLabel={quizTitleLabel}
              questionBarClass={questionBarClass}
              allowMultipleCorrect={allowMultipleCorrect}
              canRemoveQuestion={false}
              isOverlay
              dragHandleProps={{
                tabIndex: -1,
                disabled: true,
              }}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
