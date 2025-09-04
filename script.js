document.addEventListener("DOMContentLoaded", () => {
  const timerMinutesEl = document.getElementById("timer-minutes");
  const timerSecondsEl = document.getElementById("timer-seconds");
  const startButton = document.getElementById("start-button");
  const resetButton = document.getElementById("reset-button");
  const sessionButtons = document.querySelectorAll(".session-button");
  const settingsButton = document.getElementById("settings-button");
  const settingsModal = document.getElementById("settings-modal");
  const closeModalButton = document.getElementById("close-modal-button");
  const saveSettingsButton = document.getElementById("save-settings-button");
  const workDurationInput = document.getElementById("work-duration");
  const shortBreakDurationInput = document.getElementById(
    "short-break-duration"
  );
  const longBreakDurationInput = document.getElementById("long-break-duration");
  const longBreakIntervalInput = document.getElementById("long-break-interval");
  const autoStartCheckbox = document.getElementById("auto-start");
  const taskListEl = document.getElementById("task-list");
  const newTaskInput = document.getElementById("new-task-input");
  const pomodoroCountEl = document.getElementById("pomodoro-count");
  const sessionMessageEl = document.getElementById("session-message");
  const themeToggle = document.getElementById("theme-toggle");
  const moonIcon = document.getElementById("moon-icon");
  const sunIcon = document.getElementById("sun-icon");

  const progressCircle = document.querySelector(".progress-ring__circle");
  const radius = progressCircle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;

  progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
  progressCircle.style.strokeDashoffset = circumference;

  function setProgress(percent) {
    const offset = circumference - (percent / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;
  }

  setProgress(0);

  let timerInterval = null;
  let timeRemaining = 25 * 60;
  let isRunning = false;
  let sessionType = "work";
  let pomodoroCount = 0;
  let settings = {
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
    autoStart: false,
  };
  let tasks = [];
  let audioCtx = null;

  const updateDisplay = () => {
    const total = settings[sessionType] * 60;
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerMinutesEl.textContent = String(minutes).padStart(2, "0");
    timerSecondsEl.textContent = String(seconds).padStart(2, "0");
    const progressPercent = ((total - timeRemaining) / total) * 100;
    setProgress(progressPercent);
  };

  const playBeep = () => {
    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
    osc.stop(audioCtx.currentTime + 1);
  };

  const startTimer = () => {
    if (!isRunning) {
      isRunning = true;
      startButton.textContent = "PAUSE";
      startButton.style.backgroundColor = "rgb(255, 128, 0)";
      resetButton.classList.remove("hidden");
      timerInterval = setInterval(() => {
        timeRemaining--;
        updateDisplay();
        if (timeRemaining <= 0) {
          clearInterval(timerInterval);
          isRunning = false;
          playBeep();
          if (sessionType === "work") {
            pomodoroCount++;
            pomodoroCountEl.textContent = "#" + pomodoroCount;
            if (pomodoroCount % settings.longBreakInterval === 0) {
              startSession("longBreak");
            } else {
              startSession("shortBreak");
            }
          } else {
            startSession("work");
          }
          if (settings.autoStart) startTimer();
        }
      }, 1000);
    } else {
      clearInterval(timerInterval);
      isRunning = false;
      startButton.textContent = "RESUME";
      startButton.style.backgroundColor = "rgb(0, 180, 90)";
    }
  };

  const resetTimer = () => {
    clearInterval(timerInterval);
    isRunning = false;
    startButton.textContent = "START";
    startButton.style.backgroundColor = "rgb(255, 128, 0)";
    resetButton.classList.add("hidden");
    timeRemaining = settings[sessionType] * 60;
    updateDisplay();
    setProgress(0);
  };

  const startSession = (type) => {
    sessionType = type;
    sessionButtons.forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.session === type)
    );
    timeRemaining = settings[type] * 60;
    updateDisplay();
    sessionMessageEl.textContent =
      type === "work" ? "Time to focus!" : "Take a break!";
    setProgress(0);
  };

  sessionButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      startSession(btn.dataset.session);
      resetTimer();
    });
  });

  startButton.addEventListener("click", startTimer);
  resetButton.addEventListener("click", resetTimer);
  settingsButton.addEventListener("click", () =>
    settingsModal.classList.remove("hidden")
  );
  closeModalButton.addEventListener("click", () =>
    settingsModal.classList.add("hidden")
  );
  saveSettingsButton.addEventListener("click", () => {
    settings.work = parseInt(workDurationInput.value) || 25;
    settings.shortBreak = parseInt(shortBreakDurationInput.value) || 5;
    settings.longBreak = parseInt(longBreakDurationInput.value) || 15;
    settings.longBreakInterval = parseInt(longBreakIntervalInput.value) || 4;
    settings.autoStart = autoStartCheckbox.checked;
    resetTimer();
    settingsModal.classList.add("hidden");
  });

  const renderTasks = () => {
    taskListEl.innerHTML = "";
    tasks.forEach((task, i) => {
      const div = document.createElement("div");
      div.className = `task-item ${task.completed ? "completed" : ""}`;
      div.innerHTML = `
        <span>${task.text}</span>
        <div>
          <button onclick="toggleTask(${i})">✔</button>
          <button onclick="deleteTask(${i})">✖</button>
        </div>
      `;
      taskListEl.appendChild(div);
    });
  };

  window.toggleTask = (i) => {
    tasks[i].completed = !tasks[i].completed;
    renderTasks();
  };
  window.deleteTask = (i) => {
    tasks.splice(i, 1);
    renderTasks();
  };
  newTaskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && newTaskInput.value.trim()) {
      tasks.push({ text: newTaskInput.value.trim(), completed: false });
      newTaskInput.value = "";
      renderTasks();
    }
  });

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    moonIcon.classList.toggle("hidden");
    sunIcon.classList.toggle("hidden");
  });

  updateDisplay();
});
