const STORAGE_KEY = "treeni-seuranta-v2";
const CACHE_VERSION = "treeni-seuranta-cache-v8";
const GROUPS = ["Yläkroppa", "Kokokroppa", "Alakroppa"];
const VIEW_TITLES = {
  today: "TÄNÄÄN",
  templates: "TREENIPOHJAT",
  history: "HISTORIA",
  progress: "KEHITYS"
};

const defaultTemplates = [
  {
    id: createId(),
    name: "Yläkroppa",
    focus: "Yläkropan treeni",
    exercises: [
      createExercise("Penkkipunnerrus", 4, 8, 80, "Rauhallinen lasku"),
      createExercise("Leuanveto", 3, 8, 0, "Täysi liikerata"),
      createExercise("Pystypunnerrus", 3, 10, 30, "")
    ]
  },
  {
    id: createId(),
    name: "Kokokroppa",
    focus: "Koko kehon treeni",
    exercises: [
      createExercise("Maastaveto", 4, 5, 100, ""),
      createExercise("Etukyykky", 3, 8, 65, ""),
      createExercise("Lankku", 3, 1, 0, "60 sekuntia")
    ]
  },
  {
    id: createId(),
    name: "Alakroppa",
    focus: "Jalkatreeni",
    exercises: [
      createExercise("Kyykky", 4, 6, 90, ""),
      createExercise("Romanialainen maastaveto", 3, 8, 75, ""),
      createExercise("Pohjenousu", 3, 12, 45, "")
    ]
  }
];

const state = loadState();
let historyEditDraft = null;
let historyEditWorkoutId = null;

const elements = {
  appTitle: document.getElementById("app-title"),
  todayTemplateSelect: document.getElementById("today-template-select"),
  workoutHero: document.getElementById("workout-hero"),
  heroTemplateName: document.getElementById("hero-template-name"),
  startWorkoutButton: document.getElementById("start-workout-button"),
  activeWorkoutCard: document.getElementById("active-workout-card"),
  activeWorkoutArt: document.getElementById("active-workout-art"),
  activeWorkoutOrb: document.getElementById("active-workout-orb"),
  activeWorkoutLabel: document.getElementById("active-workout-label"),
  activeWorkoutTitle: document.getElementById("active-workout-title"),
  activeWorkoutStarted: document.getElementById("active-workout-started"),
  workoutNote: document.getElementById("workout-note"),
  activeWorkoutExercises: document.getElementById("active-workout-exercises"),
  addWorkoutExerciseButton: document.getElementById("add-workout-exercise-button"),
  saveWorkoutButton: document.getElementById("save-workout-button"),
  discardWorkoutButton: document.getElementById("discard-workout-button"),
  todayEmptyState: document.getElementById("today-empty-state"),
  templatesList: document.getElementById("templates-list"),
  exportDataButton: document.getElementById("export-data-button"),
  importDataButton: document.getElementById("import-data-button"),
  importDataInput: document.getElementById("import-data-input"),
  resetTemplatesButton: document.getElementById("reset-templates-button"),
  historyList: document.getElementById("history-list"),
  historyEmptyState: document.getElementById("history-empty-state"),
  historyTotalCount: document.getElementById("history-total-count"),
  historyMilestone: document.getElementById("history-milestone"),
  progressGroups: document.getElementById("progress-groups"),
  exerciseModal: document.getElementById("exercise-modal"),
  exerciseForm: document.getElementById("exercise-form"),
  exerciseModalTitle: document.getElementById("exercise-modal-title"),
  closeExerciseModal: document.getElementById("close-exercise-modal"),
  cancelExerciseButton: document.getElementById("cancel-exercise-button"),
  exerciseContext: document.getElementById("exercise-context"),
  exerciseIndex: document.getElementById("exercise-index"),
  exerciseName: document.getElementById("exercise-name"),
  exerciseSets: document.getElementById("exercise-sets"),
  exerciseReps: document.getElementById("exercise-reps"),
  exerciseWeight: document.getElementById("exercise-weight"),
  exerciseComment: document.getElementById("exercise-comment"),
  historyModal: document.getElementById("history-modal"),
  historyModalCard: document.getElementById("history-modal-card"),
  navItems: Array.from(document.querySelectorAll(".nav-item")),
  views: Array.from(document.querySelectorAll(".view"))
};

init();

function init() {
  bindEvents();
  renderAll();
  registerServiceWorker();
}

function bindEvents() {
  elements.navItems.forEach((item) => {
    item.addEventListener("click", () => switchView(item.dataset.target));
  });

  elements.todayTemplateSelect.addEventListener("change", renderHeroTemplate);
  elements.startWorkoutButton.addEventListener("click", startWorkoutFromSelectedTemplate);
  elements.addWorkoutExerciseButton.addEventListener("click", () => openExerciseModal("workout"));
  elements.saveWorkoutButton.addEventListener("click", saveWorkoutToHistory);
  elements.discardWorkoutButton.addEventListener("click", discardWorkout);
  elements.exportDataButton.addEventListener("click", exportAppData);
  elements.importDataButton.addEventListener("click", () => elements.importDataInput.click());
  elements.importDataInput.addEventListener("change", importAppData);
  elements.resetTemplatesButton.addEventListener("click", resetDefaultTemplates);
  elements.workoutNote.addEventListener("input", (event) => {
    if (!state.activeWorkout) {
      return;
    }

    state.activeWorkout.note = event.target.value;
    persistState();
  });

  elements.exerciseForm.addEventListener("submit", saveExerciseFromModal);
  elements.closeExerciseModal.addEventListener("click", () => elements.exerciseModal.close());
  elements.cancelExerciseButton.addEventListener("click", () => elements.exerciseModal.close());

  elements.historyModal.addEventListener("click", (event) => {
    if (event.target === elements.historyModal) {
      elements.historyModal.close();
    }
  });
  elements.historyModal.addEventListener("close", () => {
    if (!elements.historyModal.open) {
      clearHistoryEditDraft();
    }
  });
}

function renderAll() {
  renderTemplateSelect();
  renderHeroTemplate();
  renderToday();
  renderTemplates();
  renderHistory();
  renderProgress();
}

function renderTemplateSelect() {
  const previous = elements.todayTemplateSelect.value;
  elements.todayTemplateSelect.innerHTML = "";

  state.templates.forEach((template) => {
    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = template.name;
    elements.todayTemplateSelect.appendChild(option);
  });

  if (previous && state.templates.some((template) => template.id === previous)) {
    elements.todayTemplateSelect.value = previous;
  }
}

function renderHeroTemplate() {
  const selectedTemplate = state.templates.find((template) => template.id === elements.todayTemplateSelect.value) || state.templates[0];
  if (!selectedTemplate) {
    return;
  }

  elements.heroTemplateName.textContent = selectedTemplate.name;
  setWorkoutImageClass(elements.workoutHero, selectedTemplate.name);
}

function renderToday() {
  const activeWorkout = state.activeWorkout;
  const hasWorkout = Boolean(activeWorkout);

  elements.activeWorkoutCard.classList.toggle("hidden", !hasWorkout);
  elements.todayEmptyState.classList.toggle("hidden", hasWorkout);

  if (!hasWorkout) {
    return;
  }

  const activeTemplateName = activeWorkout.templateName || "Mukautettu treeni";
  elements.activeWorkoutLabel.textContent = activeWorkout.editingSavedWorkoutId
    ? "Muokataan historiatreeniä"
    : "Keskeneräinen treeni";
  elements.activeWorkoutTitle.textContent = formatTemplateCardTitle(activeTemplateName);
  elements.activeWorkoutStarted.textContent = `Aloitettu ${formatTime(activeWorkout.startedAt || new Date().toISOString())}`;
  elements.activeWorkoutOrb.innerHTML = iconSvg(templateIconName(activeTemplateName));
  setWorkoutImageClass(elements.activeWorkoutArt, activeTemplateName);
  elements.workoutNote.value = activeWorkout.note || "";
  elements.activeWorkoutExercises.innerHTML = "";

  if (!activeWorkout.exercises.length) {
    elements.activeWorkoutExercises.innerHTML = `
      <div class="empty-state active-template-empty">
        <h3>Ei vielä liikkeitä</h3>
        <p>Lisää ensimmäinen liike plus-painikkeesta.</p>
      </div>
    `;
    return;
  }

  activeWorkout.exercises.forEach((exercise, index) => {
    elements.activeWorkoutExercises.appendChild(createWorkoutExerciseRow(exercise, index, activeWorkout.templateName));
  });
}

function createWorkoutExerciseRow(exercise, index, groupName) {
  const row = document.createElement("article");
  row.className = "exercise-row workout-exercise-row premium-exercise-row";
  row.innerHTML = `
    <div class="exercise-thumb ${getWorkoutImageClass(groupName)}"></div>
    <div class="exercise-main premium-exercise-main">
      <div class="exercise-copy">
        <h3>${index + 1}. ${escapeHtml(exercise.name || "Nimetön liike")}</h3>
        <p class="muted">${renderExerciseSummary(exercise)}</p>
      </div>
      <div class="row-actions exercise-row-actions">
        ${actionButton("edit", `Muokkaa ${exercise.name || ""}`, 'data-action="edit"')}
        ${actionButton("trash", `Poista ${exercise.name || ""}`, 'data-action="remove"', "danger-action")}
      </div>
      <div class="exercise-tags">
        ${createMetricChips(exercise)}
      </div>
    </div>
  `;

  row.querySelector('[data-action="edit"]').addEventListener("click", () => openExerciseModal("workout", index));
  row.querySelector('[data-action="remove"]').addEventListener("click", () => removeWorkoutExercise(index));
  return row;
}

function renderExerciseSummary(exercise) {
  if (exercise.comment) {
    return escapeHtml(exercise.comment);
  }

  return `${formatMetric(exercise.sets, "sarjaa")} - ${formatMetric(exercise.reps, "toistoa")}`;
}

function createMetricChips(exercise, chipClass = "tag") {
  const metrics = [
    [exercise.sets, "sarjaa"],
    [exercise.reps, "toistoa"],
    [exercise.weight, "kg"]
  ].filter(([value]) => hasMetricValue(value));

  const visibleMetrics = metrics.length ? metrics : [[exercise.sets, "sarjaa"]];
  return visibleMetrics
    .map(([value, label]) => `<span class="${chipClass}">${formatMetric(value, label)}</span>`)
    .join("");
}

function iconSvg(name) {
  const icons = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6.5v11l8-5.5-8-5.5Z"></path></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>',
    edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"></path><path d="m14 7 3 3"></path></svg>',
    trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"></path><path d="M10 11v6M14 11v6"></path><path d="M6 7l1 14h10l1-14"></path><path d="M9 7l1-3h4l1 3"></path></svg>',
    open: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z"></path><circle cx="12" cy="12" r="2.4"></circle></svg>',
    upper: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10v4M6 7v10M9 11v2M9 12h6M15 11v2M18 7v10M21 10v4"></path></svg>',
    fullbody: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16"></path><path d="M7 8l5-4 5 4"></path><path d="M6 15h12"></path><path d="M8 20l4-5 4 5"></path></svg>',
    lower: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v7l-3 8"></path><path d="M15 4v7l3 8"></path><path d="M8 12h8"></path><path d="M6 19h5M13 19h5"></path></svg>'
  };

  return icons[name] || "";
}

function templateIconName(templateName) {
  const group = normalizeGroupName(templateName);
  if (group === "Alakroppa") {
    return "lower";
  }
  if (group === "Kokokroppa") {
    return "fullbody";
  }
  return "upper";
}

function formatTemplateCardTitle(templateName) {
  const title = normalizeText(templateName || "Treeni");
  return title.toLowerCase().endsWith("treeni") ? title : `${title} treeni`;
}

function actionButton(icon, label, attributes = "", variant = "") {
  const variantClass = variant ? ` ${variant}` : "";
  return `<button class="icon-button action-icon${variantClass}" ${attributes} type="button" aria-label="${escapeHtml(label)}">${iconSvg(icon)}</button>`;
}

function templateActionButton(icon, text, attributes = "", variant = "", ariaLabel = text) {
  const variantClass = variant ? ` ${variant}` : "";
  return `<button class="template-action-button${variantClass}" ${attributes} type="button" aria-label="${escapeHtml(ariaLabel)}"><span class="template-action-icon">${iconSvg(icon)}</span><span>${escapeHtml(text)}</span></button>`;
}

function dataAttribute(name, value) {
  return `${name}="${escapeHtml(value ?? "")}"`;
}

function renderTemplates() {
  elements.templatesList.innerHTML = "";

  state.templates.forEach((template) => {
    const card = document.createElement("article");
    card.className = "template-card";

    const rows = template.exercises.length
      ? template.exercises.map((exercise, index) => `
          <article class="template-row premium-exercise-row">
            <div class="exercise-thumb ${getWorkoutImageClass(template.name)}"></div>
            <div class="exercise-main premium-exercise-main template-exercise-main">
              <div class="exercise-copy">
                <h3>${escapeHtml(exercise.name)}</h3>
                <p class="muted">${renderExerciseSummary(exercise)}</p>
              </div>
              <div class="row-actions exercise-row-actions template-row-actions">
                ${actionButton("edit", `Muokkaa liikettä ${exercise.name || ""}`, `${dataAttribute("data-template-edit", template.id)} data-index="${index}"`)}
                ${actionButton("trash", `Poista liike ${exercise.name || ""}`, `${dataAttribute("data-template-remove", template.id)} data-index="${index}"`, "danger-action")}
              </div>
              <div class="exercise-tags template-tags">
                ${createMetricChips(exercise)}
              </div>
            </div>
          </article>
        `).join("")
      : '<div class="empty-state"><h3>Ei liikkeitä</h3><p>Lisää tähän pohjaan ensimmäinen liike.</p></div>';

    card.innerHTML = `
      <div class="template-card-art ${getWorkoutImageClass(template.name)}">
        <span class="template-orb" aria-hidden="true">${iconSvg(templateIconName(template.name))}</span>
        <div class="template-art-copy">
          <h3>${escapeHtml(formatTemplateCardTitle(template.name))}</h3>
        </div>
      </div>
      <div class="template-card-header template-actions-row">
        <div class="row-actions">
          ${templateActionButton("play", "Aloita treeni", dataAttribute("data-start-template", template.id), "primary-action", `Aloita treeni ${template.name}`)}
          ${templateActionButton("plus", "Lisää liike", dataAttribute("data-add-template", template.id), "", `Lisää liike pohjaan ${template.name}`)}
        </div>
      </div>
      <div class="template-exercise-list">${rows}</div>
    `;

    card.querySelector("[data-start-template]").addEventListener("click", () => {
      elements.todayTemplateSelect.value = template.id;
      renderHeroTemplate();
      startWorkout(template.id);
      switchView("today");
    });

    card.querySelector("[data-add-template]").addEventListener("click", () => openExerciseModal(`template:${template.id}`));
    card.querySelectorAll("[data-template-edit]").forEach((button) => {
      button.addEventListener("click", () => openExerciseModal(`template:${template.id}`, Number(button.dataset.index)));
    });
    card.querySelectorAll("[data-template-remove]").forEach((button) => {
      button.addEventListener("click", () => removeTemplateExercise(template.id, Number(button.dataset.index)));
    });

    elements.templatesList.appendChild(card);
  });
}

function renderHistory() {
  const workouts = [...state.savedWorkouts].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  elements.historyList.innerHTML = "";
  elements.historyEmptyState.classList.toggle("hidden", workouts.length > 0);
  renderHistorySummary(workouts.length);

  workouts.forEach((workout) => {
    const card = document.createElement("article");
    card.className = "history-card";
    card.innerHTML = `
      <div class="history-card-header">
        <div>
          <p class="progress-subtitle">Arkisto</p>
          <h3>${escapeHtml(workout.templateName || "Treeni")}</h3>
          <div class="history-meta">
            <span class="history-chip">${formatDate(workout.completedAt)}</span>
            <span class="history-chip">${workout.exercises.length} liikettä</span>
          </div>
        </div>
        <div class="row-actions">
          ${actionButton("open", `Avaa treeni ${workout.templateName || "Treeni"}`, dataAttribute("data-history-open", workout.id))}
          ${actionButton("edit", `Muokkaa treeniä ${workout.templateName || "Treeni"}`, dataAttribute("data-history-edit", workout.id))}
          ${actionButton("trash", `Poista treeni ${workout.templateName || "Treeni"}`, dataAttribute("data-history-delete", workout.id), "danger-action")}
        </div>
      </div>
      ${workout.note ? `<div class="premium-row history-note"><p class="muted">${escapeHtml(workout.note)}</p></div>` : ""}
      <div class="history-exercise-list">
        ${workout.exercises.slice(0, 3).map((exercise) => `
          <div class="history-row">
            <strong>${escapeHtml(exercise.name)}</strong>
            <div class="history-meta">
              <span class="history-chip">${formatMetric(exercise.sets, "sarjaa")}</span>
              <span class="history-chip">${formatMetric(exercise.reps, "toistoa")}</span>
              <span class="history-chip">${formatMetric(exercise.weight, "kg")}</span>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    card.querySelector("[data-history-open]").addEventListener("click", () => openHistoryModal(workout.id));
    card.querySelector("[data-history-edit]").addEventListener("click", () => editHistoryWorkout(workout.id));
    card.querySelector("[data-history-delete]").addEventListener("click", () => deleteHistoryWorkout(workout.id));
    elements.historyList.appendChild(card);
  });
}

function renderHistorySummary(totalWorkouts) {
  if (elements.historyTotalCount) {
    elements.historyTotalCount.textContent = totalWorkouts;
  }

  if (!elements.historyMilestone) {
    return;
  }

  const showMilestone = totalWorkouts > 0 && totalWorkouts % 10 === 0;
  elements.historyMilestone.classList.toggle("hidden", !showMilestone);
  elements.historyMilestone.textContent = showMilestone
    ? `Wau, ${totalWorkouts} treeniä tehty. Jatka samaa vahvaa tekemistä.`
    : "";
}

function renderProgress() {
  elements.progressGroups.innerHTML = "";

  GROUPS.forEach((group) => {
    const exerciseNames = collectExerciseNamesByGroup(group);
    const selected = ensureSelectedExercise(group, exerciseNames);
    const entries = selected ? collectProgressEntries(group, selected) : [];

    const card = document.createElement("article");
    card.className = "progress-card";
    card.innerHTML = `
      <div class="progress-head">
        <div>
          <p class="progress-subtitle">Kehitysalue</p>
          <h3 class="progress-title">${escapeHtml(group)}</h3>
        </div>
        <div class="progress-meta">
          <span class="progress-chip">${exerciseNames.length} liikettä</span>
        </div>
      </div>
      <label class="field">
        <span>Valitse liike</span>
        <select data-progress-group="${escapeHtml(group)}"></select>
      </label>
      <div data-progress-content="${escapeHtml(group)}"></div>
    `;

    const select = card.querySelector("select");
    const content = card.querySelector("[data-progress-content]");

    if (!exerciseNames.length) {
      content.innerHTML = `
        <div class="empty-state">
          <h3>Ei vielä liikkeitä</h3>
          <p>Lisää liikkeitä ${group.toLowerCase()}-pohjaan, niin kehitys näkyy täällä.</p>
        </div>
      `;
    } else {
      exerciseNames.forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
      });
      select.value = selected;
      select.addEventListener("change", () => {
        state.progressFilters[group] = select.value;
        persistState();
        renderProgress();
      });
      content.innerHTML = renderProgressContent(selected, entries);
    }

    elements.progressGroups.appendChild(card);
  });
}

function renderProgressContent(exerciseName, entries) {
  if (!exerciseName) {
    return `<div class="empty-state"><h3>Valitse liike</h3><p>Näet kehityksen, kun liike on valittu.</p></div>`;
  }

  if (!entries.length) {
    return `<div class="empty-state"><h3>Ei vielä suorituksia</h3><p>${escapeHtml(exerciseName)} on pohjissa mukana, mutta sitä ei ole tallennettu historiaan.</p></div>`;
  }

  const latest = entries[entries.length - 1];
  return `
    <div class="progress-summary">
      <span class="history-chip">Viimeisin: ${formatDate(latest.date)}</span>
      <span class="history-chip">${formatMetric(latest.weight, "kg")}</span>
      <span class="history-chip">${formatMetric(lat(latest), "toistoa")}</span>
    </div>
    <div class="chart-wrap">${createChart(entries, `${exerciseName} painokehitys`)}</div>
    <div class="progress-list">
      ${entries.slice().reverse().map((entry) => `
        <div class="progress-item">
          <strong>${formatDate(entry.date)}</strong>
          <p class="muted">${formatMetric(entry.weight, "kg")} - ${formatMetric(entry.sets, "sarjaa")} - ${formatMetric(entry.reps, "toistoa")}</p>
        </div>
      `).join("")}
    </div>
  `;
}

function createChart(entries, label) {
  const chartEntries = entries
    .map((entry) => ({
      ...entry,
      numericWeight: extractMetricNumber(entry.weight)
    }))
    .filter((entry) => entry.numericWeight !== null);

  if (!chartEntries.length) {
    return `<div class="chart-empty"><p class="muted">Ei numeerista painoa kaavioon.</p></div>`;
  }

  const width = 320;
  const height = 210;
  const padding = 28;
  const weights = chartEntries.map((entry) => entry.numericWeight);
  const rawMinWeight = Math.min(...weights);
  const rawMaxWeight = Math.max(...weights);
  const flatPadding = Math.max(5, rawMaxWeight * 0.05);
  const minWeight = rawMinWeight === rawMaxWeight ? Math.max(0, rawMinWeight - flatPadding) : rawMinWeight;
  const maxWeight = rawMinWeight === rawMaxWeight ? rawMaxWeight + flatPadding : rawMaxWeight;
  const range = Math.max(maxWeight - minWeight, 1);
  const stepX = chartEntries.length === 1 ? 0 : (width - padding * 2) / (chartEntries.length - 1);

  const points = chartEntries.map((entry, index) => {
    const x = chartEntries.length === 1 ? width / 2 : padding + stepX * index;
    const y = height - padding - ((entry.numericWeight - minWeight) / range) * (height - padding * 2);
    return { x, y, label: formatDateShort(entry.date) };
  });

  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = chartEntries.length > 1
    ? `M ${padding} ${height - padding} L ${points.map((point) => `${point.x} ${point.y}`).join(" L ")} L ${points[points.length - 1].x} ${height - padding} Z`
    : "";
  const sideLabels = [maxWeight, (maxWeight + minWeight) / 2, minWeight];
  const labelY = [padding, height / 2, height - padding];
  const gridLines = [padding, height / 2, height - padding];

  return `
    <svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(label)}">
      ${gridLines.map((gridY) => `<line class="chart-grid" x1="${padding}" y1="${gridY}" x2="${width - padding}" y2="${gridY}"></line>`).join("")}
      <line class="chart-axis" x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}"></line>
      <line class="chart-axis" x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}"></line>
      ${area ? `<path class="chart-area" d="${area}"></path>` : ""}
      ${chartEntries.length > 1
        ? `<polyline class="chart-line" points="${line}"></polyline>`
        : `<line class="chart-line" x1="${padding}" y1="${points[0].y}" x2="${width - padding}" y2="${points[0].y}"></line>`}
      ${points.map((point) => `<circle class="chart-dot" cx="${point.x}" cy="${point.y}" r="4.5"></circle>`).join("")}
      ${points.map((point, index) => {
        const anchor = chartEntries.length === 1 ? "middle" : index === 0 ? "start" : index === points.length - 1 ? "end" : "middle";
        const x = chartEntries.length === 1 ? point.x : index === 0 ? point.x + 2 : index === points.length - 1 ? point.x - 2 : point.x;
        return `<text class="chart-label" x="${x}" y="${height - 8}" text-anchor="${anchor}">${point.label}</text>`;
      }).join("")}
      ${sideLabels.map((value, index) => `<text class="chart-side-label" x="8" y="${labelY[index] + 4}">${formatWeightLabel(value)} kg</text>`).join("")}
    </svg>
  `;
}

function startWorkoutFromSelectedTemplate() {
  startWorkout(elements.todayTemplateSelect.value);
}

function startWorkout(templateId) {
  const template = state.templates.find((entry) => entry.id === templateId);
  if (!template) {
    return;
  }

  if (state.activeWorkout && !window.confirm("Korvataanko nykyinen keskeneräinen treeni uudella?")) {
    return;
  }

  state.activeWorkout = {
    id: createId(),
    templateId: template.id,
    templateName: template.name,
    startedAt: new Date().toISOString(),
    note: "",
    exercises: template.exercises.map((exercise) => ({
      ...cloneExercise(exercise),
      sourceExerciseId: exercise.id
    }))
  };

  persistState();
  renderToday();
}

function discardWorkout() {
  if (!state.activeWorkout) {
    return;
  }

  if (!window.confirm("Poistetaanko keskeneräinen treeni varmasti?")) {
    return;
  }

  state.activeWorkout = null;
  persistState();
  renderAll();
}

function saveWorkoutToHistory() {
  if (!state.activeWorkout || !state.activeWorkout.exercises.length) {
    window.alert("Lisää treeniin vähintään yksi liike ennen tallennusta.");
    return;
  }

  const now = new Date().toISOString();
  const editingId = state.activeWorkout.editingSavedWorkoutId;
  const previousWorkout = state.savedWorkouts.find((entry) => entry.id === editingId);
  const completedWorkout = {
    ...structuredCloneSafe(state.activeWorkout),
    id: editingId || createId(),
    completedAt: editingId ? previousWorkout?.completedAt || now : now,
    updatedAt: now
  };

  delete completedWorkout.editingSavedWorkoutId;
  delete completedWorkout.startedAt;

  if (editingId) {
    state.savedWorkouts = state.savedWorkouts.map((entry) => entry.id === editingId ? completedWorkout : entry);
  } else {
    state.savedWorkouts.unshift(completedWorkout);
  }

  state.activeWorkout = null;
  persistState();
  renderAll();
  switchView("history");
}

function removeWorkoutExercise(index) {
  if (!state.activeWorkout) {
    return;
  }

  const exercise = state.activeWorkout.exercises[index];
  if (!exercise || !confirmExerciseRemoval(exercise)) {
    return;
  }

  state.activeWorkout.exercises.splice(index, 1);
  persistState();
  renderToday();
  renderProgress();
}

function removeTemplateExercise(templateId, index) {
  const template = state.templates.find((entry) => entry.id === templateId);
  if (!template) {
    return;
  }

  const exercise = template.exercises[index];
  if (!exercise || !confirmExerciseRemoval(exercise)) {
    return;
  }

  template.exercises.splice(index, 1);
  persistState();
  renderTemplates();
  renderTemplateSelect();
  renderHeroTemplate();
  renderProgress();
}

function confirmExerciseRemoval(exercise) {
  const exerciseName = normalizeText(exercise?.name || "");
  const message = exerciseName
    ? `Poistetaanko treeniliike ${exerciseName} varmasti?`
    : "Poistetaanko tämä treeniliike varmasti?";

  return window.confirm(message);
}

function exportAppData() {
  const payload = JSON.stringify(state, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `treeni-seuranta-data-${formatFileDate(new Date())}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importAppData(event) {
  const [file] = Array.from(event.target.files || []);
  event.target.value = "";

  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = safelyParse(reader.result);
      if (!isImportPayload(parsed)) {
        throw new Error("Tiedosto ei sisällä sovelluksen dataa.");
      }

      const importedState = migrateState(parsed);
      replaceState(importedState);
      persistState();
      renderAll();
      window.alert("Data tuotu onnistuneesti.");
    } catch (error) {
      console.error("Datan tuonti epäonnistui", error);
      window.alert("Datan tuonti epäonnistui. Valitse sovelluksesta viety JSON-tiedosto.");
    }
  });
  reader.addEventListener("error", () => {
    window.alert("Tiedoston lukeminen epäonnistui.");
  });
  reader.readAsText(file);
}

function isImportPayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Array.isArray(value.templates) ||
    Array.isArray(value.savedWorkouts) ||
    value.activeWorkout ||
    value.progressFilters;
}

function resetDefaultTemplates() {
  if (!window.confirm("Palautetaanko oletustreenipohjat? Historia ja keskeneräinen treeni säilyvät.")) {
    return;
  }

  state.templates = structuredCloneSafe(defaultTemplates);
  state.progressFilters = createDefaultProgressFilters();
  persistState();
  renderAll();
}

function openExerciseModal(context, index = null) {
  const isEdit = index !== null;
  elements.exerciseContext.value = context;
  elements.exerciseIndex.value = index ?? "";
  elements.exerciseModalTitle.textContent = isEdit ? "Muokkaa liikettä" : "Lisää liike";

  let sourceExercise = null;
  if (isEdit) {
    if (context === "workout" && state.activeWorkout) {
      sourceExercise = state.activeWorkout.exercises[index];
    } else if (context.startsWith("template:")) {
      const templateId = getTemplateIdFromContext(context);
      const template = state.templates.find((entry) => entry.id === templateId);
      sourceExercise = template?.exercises[index];
    }
  }

  elements.exerciseName.value = sourceExercise?.name || "";
  elements.exerciseSets.value = sourceExercise?.sets ?? "";
  elements.exerciseReps.value = sourceExercise?.reps ?? "";
  elements.exerciseWeight.value = sourceExercise?.weight ?? "";
  elements.exerciseComment.value = sourceExercise?.comment || "";
  elements.exerciseModal.showModal();
}

function saveExerciseFromModal(event) {
  event.preventDefault();

  const context = elements.exerciseContext.value;
  const indexValue = elements.exerciseIndex.value;
  const parsedIndex = indexValue === "" ? null : Number(indexValue);
  const exercise = createExercise(
    elements.exerciseName.value.trim(),
    normalizeMetricInput(elements.exerciseSets.value),
    normalizeMetricInput(elements.exerciseReps.value),
    normalizeMetricInput(elements.exerciseWeight.value),
    elements.exerciseComment.value.trim()
  );

  if (!exercise.name) {
    window.alert("Liikkeen nimi on pakollinen.");
    return;
  }

  if (context === "workout") {
    if (!state.activeWorkout) {
      return;
    }

    if (parsedIndex === null) {
      state.activeWorkout.exercises.push(exercise);
    } else {
      state.activeWorkout.exercises[parsedIndex] = {
        ...state.activeWorkout.exercises[parsedIndex],
        ...exercise
      };
    }
  } else if (context.startsWith("template:")) {
    const templateId = getTemplateIdFromContext(context);
    const template = state.templates.find((entry) => entry.id === templateId);
    if (!template) {
      return;
    }

    if (parsedIndex === null) {
      template.exercises.push(exercise);
    } else {
      template.exercises[parsedIndex] = {
        ...template.exercises[parsedIndex],
        ...exercise
      };
    }
  }

  persistState();
  elements.exerciseModal.close();
  renderAll();
}

function getTemplateIdFromContext(context) {
  return context.startsWith("template:") ? context.slice("template:".length) : "";
}

function openHistoryModal(workoutId) {
  const workout = state.savedWorkouts.find((entry) => entry.id === workoutId);
  if (!workout) {
    return;
  }

  clearHistoryEditDraft();
  elements.historyModalCard.innerHTML = `
    <div class="modal-header">
      <div>
        <p class="progress-subtitle">Tallennettu treeni</p>
        <h2 id="history-modal-title">${escapeHtml(workout.templateName || "Treeni")}</h2>
        <p class="muted">${formatDate(workout.completedAt)}</p>
      </div>
      <button class="icon-button" id="close-history-modal" type="button" aria-label="Sulje">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg>
      </button>
    </div>
    ${workout.note ? `<div class="premium-row"><p class="muted">${escapeHtml(workout.note)}</p></div>` : ""}
    <div class="history-exercise-list">
      ${workout.exercises.map((exercise) => `
        <div class="history-row">
          <h3>${escapeHtml(exercise.name)}</h3>
          <div class="history-meta">
            <span class="history-chip">${formatMetric(exercise.sets, "sarjaa")}</span>
            <span class="history-chip">${formatMetric(exercise.reps, "toistoa")}</span>
            <span class="history-chip">${formatMetric(exercise.weight, "kg")}</span>
          </div>
          ${exercise.comment ? `<p class="muted">${escapeHtml(exercise.comment)}</p>` : ""}
        </div>
      `).join("")}
    </div>
  `;

  elements.historyModalCard.querySelector("#close-history-modal").addEventListener("click", () => elements.historyModal.close());
  elements.historyModal.showModal();
}

function editHistoryWorkout(workoutId) {
  const workout = state.savedWorkouts.find((entry) => entry.id === workoutId);
  if (!workout) {
    return;
  }

  openHistoryEditModal(workoutId);
}

function openHistoryEditModal(workoutId) {
  const workout = state.savedWorkouts.find((entry) => entry.id === workoutId);
  if (!workout) {
    return;
  }

  historyEditWorkoutId = workoutId;
  historyEditDraft = structuredCloneSafe(workout);
  renderHistoryEditModal();

  if (!elements.historyModal.open) {
    elements.historyModal.showModal();
  }
}

function renderHistoryEditModal() {
  if (!historyEditDraft) {
    return;
  }

  const exerciseRows = historyEditDraft.exercises.length
    ? historyEditDraft.exercises.map((exercise, index) => `
        <article class="history-edit-exercise" data-history-draft-exercise="${index}">
          <div class="history-edit-exercise-head">
            <div>
              <p class="progress-subtitle">${index + 1}. liike</p>
              <h3>${escapeHtml(exercise.name || "Nimetön liike")}</h3>
            </div>
            ${actionButton("trash", `Poista liike ${exercise.name || ""}`, `data-history-draft-remove="${index}"`, "danger-action")}
          </div>
          <label class="field">
            <span>Liikkeen nimi</span>
            <input type="text" data-history-exercise-field="name" value="${escapeHtml(exercise.name || "")}" autocomplete="off">
          </label>
          <div class="field-grid history-edit-metrics">
            <label class="field">
              <span>Sarjat</span>
              <input type="text" inputmode="text" autocomplete="off" data-history-exercise-field="sets" value="${escapeHtml(exercise.sets ?? "")}">
            </label>
            <label class="field">
              <span>Toistot</span>
              <input type="text" inputmode="text" autocomplete="off" data-history-exercise-field="reps" value="${escapeHtml(exercise.reps ?? "")}">
            </label>
            <label class="field">
              <span>Paino kg</span>
              <input type="text" inputmode="text" autocomplete="off" data-history-exercise-field="weight" value="${escapeHtml(exercise.weight ?? "")}">
            </label>
          </div>
          <label class="field">
            <span>Liikkeen kommentti</span>
            <textarea data-history-exercise-field="comment" rows="2">${escapeHtml(exercise.comment || "")}</textarea>
          </label>
        </article>
      `).join("")
    : `<div class="empty-state history-edit-empty"><h3>Ei liikkeitä</h3><p>Lisää vähintään yksi liike ennen tallennusta.</p></div>`;

  elements.historyModalCard.innerHTML = `
    <form class="history-edit-form" id="history-edit-form">
      <div class="modal-header">
        <div>
          <p class="progress-subtitle">Muokkaa tallennettua treeniä</p>
          <h2 id="history-modal-title">${escapeHtml(historyEditDraft.templateName || "Treeni")}</h2>
          <p class="muted">${formatDate(historyEditDraft.completedAt)}</p>
        </div>
        <button class="icon-button" id="close-history-edit" type="button" aria-label="Sulje">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg>
        </button>
      </div>
      <label class="field history-edit-note">
        <span>Treenin kommentti</span>
        <textarea data-history-note rows="3" placeholder="Kirjoita kommenttisi tähän...">${escapeHtml(historyEditDraft.note || "")}</textarea>
      </label>
      <section class="history-edit-section" aria-label="Liikkeet">
        <div class="history-edit-head">
          <div>
            <p class="progress-subtitle">Liikkeet</p>
            <h3>${historyEditDraft.exercises.length} liikettä</h3>
          </div>
          <button class="small-button" type="button" id="add-history-draft-exercise">${iconSvg("plus")} Lisää liike</button>
        </div>
        <div class="history-edit-list">${exerciseRows}</div>
      </section>
      <div class="modal-actions history-edit-footer">
        <button class="secondary-button" type="button" id="cancel-history-edit">Peruuta</button>
        <button class="gold-button" type="submit">Tallenna muutokset</button>
      </div>
    </form>
  `;

  elements.historyModalCard.querySelector("#history-edit-form").addEventListener("submit", (event) => {
    event.preventDefault();
    saveHistoryEditDraft();
  });
  elements.historyModalCard.querySelector("#close-history-edit").addEventListener("click", closeHistoryEditModal);
  elements.historyModalCard.querySelector("#cancel-history-edit").addEventListener("click", closeHistoryEditModal);
  elements.historyModalCard.querySelector("#add-history-draft-exercise").addEventListener("click", addHistoryDraftExercise);
  elements.historyModalCard.querySelectorAll("[data-history-draft-remove]").forEach((button) => {
    button.addEventListener("click", () => removeHistoryDraftExercise(Number(button.dataset.historyDraftRemove)));
  });
}

function syncHistoryEditDraftFromForm() {
  if (!historyEditDraft) {
    return;
  }

  const form = elements.historyModalCard.querySelector("#history-edit-form");
  if (!form) {
    return;
  }

  const noteField = form.querySelector("[data-history-note]");
  historyEditDraft.note = normalizeText(noteField?.value || "");
  historyEditDraft.exercises = Array.from(form.querySelectorAll("[data-history-draft-exercise]")).map((row) => {
    const index = Number(row.dataset.historyDraftExercise);
    const currentExercise = historyEditDraft.exercises[index] || createExercise();
    const fieldValue = (field) => row.querySelector(`[data-history-exercise-field="${field}"]`)?.value ?? "";

    return {
      ...currentExercise,
      id: currentExercise.id || createId(),
      name: normalizeText(fieldValue("name")),
      sets: normalizeMetricInput(fieldValue("sets")),
      reps: normalizeMetricInput(fieldValue("reps")),
      weight: normalizeMetricInput(fieldValue("weight")),
      comment: normalizeText(fieldValue("comment"))
    };
  });
}

function addHistoryDraftExercise() {
  if (!historyEditDraft) {
    return;
  }

  syncHistoryEditDraftFromForm();
  historyEditDraft.exercises.push(createExercise());
  renderHistoryEditModal();
}

function removeHistoryDraftExercise(index) {
  if (!historyEditDraft) {
    return;
  }

  syncHistoryEditDraftFromForm();
  historyEditDraft.exercises.splice(index, 1);
  renderHistoryEditModal();
}

function saveHistoryEditDraft() {
  if (!historyEditDraft || !historyEditWorkoutId) {
    return;
  }

  syncHistoryEditDraftFromForm();

  if (!historyEditDraft.exercises.length) {
    window.alert("Lisää vähintään yksi liike ennen tallennusta.");
    return;
  }

  if (historyEditDraft.exercises.some((exercise) => !exercise.name)) {
    window.alert("Jokaisella liikkeellä pitää olla nimi.");
    return;
  }

  const existingWorkout = state.savedWorkouts.find((entry) => entry.id === historyEditWorkoutId);
  if (!existingWorkout) {
    window.alert("Tallennettua treeniä ei löytynyt.");
    closeHistoryEditModal();
    return;
  }

  const updatedWorkout = migrateWorkout({
    ...existingWorkout,
    ...historyEditDraft,
    id: existingWorkout.id,
    templateName: existingWorkout.templateName,
    completedAt: existingWorkout.completedAt,
    updatedAt: new Date().toISOString()
  });

  delete updatedWorkout.startedAt;
  delete updatedWorkout.editingSavedWorkoutId;

  state.savedWorkouts = state.savedWorkouts.map((entry) => entry.id === existingWorkout.id ? updatedWorkout : entry);
  persistState();
  renderHistory();
  renderProgress();
  closeHistoryEditModal();
}

function closeHistoryEditModal() {
  clearHistoryEditDraft();
  if (elements.historyModal.open) {
    elements.historyModal.close();
  }
}

function clearHistoryEditDraft() {
  historyEditDraft = null;
  historyEditWorkoutId = null;
}

function deleteHistoryWorkout(workoutId) {
  if (!window.confirm("Poistetaanko tallennettu treeni varmasti?")) {
    return;
  }

  state.savedWorkouts = state.savedWorkouts.filter((entry) => entry.id !== workoutId);
  persistState();
  renderAll();
}

function collectExerciseNamesByGroup(group) {
  const names = new Set();

  state.templates
    .filter((template) => normalizeGroupName(template.name) === group)
    .forEach((template) => template.exercises.forEach((exercise) => exercise.name && names.add(exercise.name)));

  state.savedWorkouts
    .filter((workout) => normalizeGroupName(workout.templateName) === group)
    .forEach((workout) => workout.exercises.forEach((exercise) => exercise.name && names.add(exercise.name)));

  return [...names];
}

function collectProgressEntries(group, exerciseName) {
  return state.savedWorkouts
    .filter((workout) => normalizeGroupName(workout.templateName) === group)
    .flatMap((workout) => workout.exercises
      .filter((exercise) => exercise.name === exerciseName)
      .map((exercise) => ({
        date: workout.completedAt,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight
      })))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function ensureSelectedExercise(group, exerciseNames) {
  if (!exerciseNames.length) {
    state.progressFilters[group] = "";
    return "";
  }

  const current = state.progressFilters[group];
  if (exerciseNames.includes(current)) {
    return current;
  }

  state.progressFilters[group] = exerciseNames[0];
  return exerciseNames[0];
}

function switchView(target) {
  elements.appTitle.textContent = VIEW_TITLES[target] || "TÄNÄÄN";
  elements.navItems.forEach((item) => item.classList.toggle("active", item.dataset.target === target));
  elements.views.forEach((view) => view.classList.toggle("active", view.dataset.view === target));
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function loadState() {
  const parsed = safelyParse(localStorage.getItem(STORAGE_KEY));
  if (!parsed) {
    return createFreshState();
  }

  return migrateState(parsed);
}

function createFreshState() {
  return {
    version: 3,
    cacheVersion: CACHE_VERSION,
    templates: structuredCloneSafe(defaultTemplates),
    activeWorkout: null,
    savedWorkouts: [],
    progressFilters: createDefaultProgressFilters()
  };
}

function createDefaultProgressFilters() {
  return {
    Yläkroppa: "",
    Kokokroppa: "",
    Alakroppa: ""
  };
}

function replaceState(nextState) {
  Object.keys(state).forEach((key) => {
    delete state[key];
  });
  Object.assign(state, nextState);
}

function migrateState(rawState) {
  const baseState = createFreshState();
  const migratedTemplates = Array.isArray(rawState.templates) && rawState.templates.length
    ? rawState.templates.map(migrateTemplate)
    : baseState.templates;

  const ensuredTemplates = ensureTemplateGroups(migratedTemplates);

  return {
    version: 3,
    cacheVersion: CACHE_VERSION,
    templates: ensuredTemplates,
    activeWorkout: rawState.activeWorkout ? migrateWorkout(rawState.activeWorkout) : null,
    savedWorkouts: Array.isArray(rawState.savedWorkouts) ? rawState.savedWorkouts.map(migrateWorkout) : [],
    progressFilters: {
      Yläkroppa: rawState.progressFilters?.Yläkroppa || rawState.progressFilters?.["YlÃ¤kroppa"] || "",
      Kokokroppa: rawState.progressFilters?.Kokokroppa || rawState.progressFilters?.Keskikroppa || "",
      Alakroppa: rawState.progressFilters?.Alakroppa || ""
    }
  };
}

function ensureTemplateGroups(templates) {
  const byGroup = new Map(templates.map((template) => [normalizeGroupName(template.name), template]));
  return GROUPS.map((group) => byGroup.get(group) || structuredCloneSafe(defaultTemplates.find((template) => template.name === group)));
}

function migrateTemplate(template) {
  const name = normalizeGroupName(template.name || "Yläkroppa");
  return {
    id: template.id || createId(),
    name,
    focus: normalizeFocus(template.focus || defaultTemplates.find((entry) => entry.name === name)?.focus || defaultFocusForGroup(name), name),
    exercises: Array.isArray(template.exercises) ? template.exercises.map(migrateExercise) : []
  };
}

function migrateWorkout(workout) {
  return {
    ...workout,
    id: workout.id || createId(),
    templateName: normalizeGroupName(workout.templateName || "Yläkroppa"),
    note: normalizeText(workout.note || ""),
    exercises: Array.isArray(workout.exercises) ? workout.exercises.map(migrateExercise) : []
  };
}

function migrateExercise(exercise) {
  return {
    id: exercise.id || createId(),
    name: normalizeText(exercise.name || ""),
    sets: exercise.sets ?? "",
    reps: exercise.reps ?? "",
    weight: exercise.weight ?? "",
    comment: normalizeText(exercise.comment || "")
  };
}

function normalizeGroupName(name) {
  const normalized = normalizeText(name || "");
  if (!normalized) {
    return "Yläkroppa";
  }

  if (normalized === "Keskikroppa") {
    return "Kokokroppa";
  }

  const match = GROUPS.find((group) => group.toLowerCase() === normalized.toLowerCase());
  return match || normalized;
}

function getTemplateFocus(template) {
  return normalizeFocus(template.focus || defaultTemplates.find((entry) => entry.name === normalizeGroupName(template.name))?.focus || defaultFocusForGroup(template.name), template.name);
}

function defaultFocusForGroup(name) {
  const group = normalizeGroupName(name);
  if (group === "Kokokroppa") {
    return "Koko kehon treeni";
  }
  if (group === "Alakroppa") {
    return "Jalkatreeni";
  }
  return "Yläkropan treeni";
}

function normalizeFocus(value, groupName = "Yläkroppa") {
  const normalized = normalizeText(value || "");
  if (!normalized || normalized.toLowerCase().includes("hypertrofia") || normalized.toLowerCase().includes("perusvoima") || normalized.toLowerCase().includes("kontrolli")) {
    return defaultFocusForGroup(groupName);
  }
  return normalized;
}

function setWorkoutImageClass(element, name) {
  element.classList.remove("image-upper", "image-lower", "image-fullbody");
  element.classList.add(getWorkoutImageClass(name));
}

function getWorkoutImageClass(name) {
  const group = normalizeGroupName(name);
  if (group === "Alakroppa") {
    return "image-lower";
  }
  if (group === "Kokokroppa") {
    return "image-fullbody";
  }
  return "image-upper";
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createExercise(name = "", sets = "", reps = "", weight = "", comment = "") {
  return {
    id: createId(),
    name,
    sets,
    reps,
    weight,
    comment
  };
}

function cloneExercise(exercise) {
  return {
    id: createId(),
    name: exercise.name || "",
    sets: exercise.sets ?? "",
    reps: exercise.reps ?? "",
    weight: exercise.weight ?? "",
    comment: exercise.comment || ""
  };
}

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function parseNumber(value) {
  if (value === "") {
    return "";
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : "";
}

function parseDecimal(value) {
  if (value === "") {
    return "";
  }
  const normalized = String(value).replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : "";
}

function normalizeMetricInput(value) {
  return normalizeText(value ?? "");
}

function hasMetricValue(value) {
  return value !== "" && value !== null && value !== undefined;
}

function extractMetricNumber(value) {
  if (!hasMetricValue(value)) {
    return null;
  }

  const match = String(value).replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function isPlainNumericMetric(value) {
  return /^-?\d+(?:[,.]\d+)?$/.test(String(value).trim());
}

function lat(entry) {
  return (extractMetricNumber(entry.sets) || 0) * (extractMetricNumber(entry.reps) || 0);
}

function formatMetric(value, label) {
  if (!hasMetricValue(value)) {
    return `0 ${label}`;
  }

  const raw = String(value).trim();
  if (!raw) {
    return `0 ${label}`;
  }

  return escapeHtml(isPlainNumericMetric(raw) ? `${raw} ${label}` : raw);
}

function formatWeightLabel(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("fi-FI", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(dateString));
}

function formatDateShort(dateString) {
  return new Intl.DateTimeFormat("fi-FI", {
    day: "numeric",
    month: "numeric"
  }).format(new Date(dateString));
}

function formatFileDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatTime(dateString) {
  return new Intl.DateTimeFormat("fi-FI", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(dateString));
}

function safelyParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("Tallennetun datan luku epäonnistui", error);
    return null;
  }
}

function normalizeText(value) {
  return String(value)
    .replaceAll("ÃƒÂ¤", "ä")
    .replaceAll("Ãƒâ€ž", "Ä")
    .replaceAll("ÃƒÂ¶", "ö")
    .replaceAll("Ãƒâ€“", "Ö")
    .replaceAll("ÃƒÂ¥", "å")
    .replaceAll("Ãƒâ€¦", "Å")
    .replaceAll("Ã¤", "ä")
    .replaceAll("Ã„", "Ä")
    .replaceAll("Ã¶", "ö")
    .replaceAll("Ã–", "Ö")
    .replaceAll("Ã¥", "å")
    .replaceAll("Ã…", "Å")
    .replaceAll("Ã©", "é")
    .replaceAll("Ã‚Â·", "-")
    .replaceAll("Â·", "-")
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.error("Offline-tuki ei rekisteröitynyt", error);
    });
  });
}
