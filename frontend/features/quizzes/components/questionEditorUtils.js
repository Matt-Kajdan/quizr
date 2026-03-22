let nextEditorQuestionId = 0;

function createEditorQuestionId() {
  nextEditorQuestionId += 1;
  return `editor-question-${nextEditorQuestionId}`;
}

export function withEditorQuestionId(question) {
  if (question?.editorSortableId) {
    return question;
  }

  return {
    ...question,
    editorSortableId: question?._id ? `question-${question._id}` : createEditorQuestionId(),
  };
}

export function withEditorQuestionIds(questions) {
  return (questions || []).map((question) => withEditorQuestionId(question));
}

export function stripEditorQuestionIds(questions) {
  return (questions || []).map((question) => {
    const sanitizedQuestion = { ...question };
    delete sanitizedQuestion.editorSortableId;

    return {
      ...sanitizedQuestion,
      answers: Array.isArray(sanitizedQuestion.answers)
        ? [...sanitizedQuestion.answers]
        : [],
    };
  });
}
