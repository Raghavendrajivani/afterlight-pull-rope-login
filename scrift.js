// Small helpers for changing the lamp and login screen.
const room = document.querySelector('.room');
const lamp = document.querySelector('.lamp-area');
const light = document.querySelector('.light-system');
const rope = document.querySelector('.rope-zone');
const ropeHandle = document.querySelector('.rope-handle');
const ropeHint = document.querySelector('.rope-hint');
const loginCard = document.querySelector('.login-card');
const form = document.querySelector('.login-card form');
const emailInput = document.querySelector('#identity');
const passwordInput = document.querySelector('#password');
const passwordToggle = document.querySelector('.password-toggle');
const loginButton = document.querySelector('.login-button');
const toast = document.querySelector('.success-toast');

let phase = 'off';
let pullStartY = 0;
let pullDistance = 0;
let pulling = false;
let timers = [];
let successTimer;
let toastTimer;

function setPhase(nextPhase) {
  phase = nextPhase;
  room.dataset.phase = nextPhase;
  lamp.dataset.phase = nextPhase;
  light.dataset.phase = nextPhase;
  light.dataset.illuminated = String(nextPhase === 'lit' || nextPhase === 'ready');
  const available = nextPhase === 'off';
  rope.dataset.active = String(available);
  ropeHandle.disabled = !available;
  ropeHint.hidden = !available || pulling;
  const cardVisible = nextPhase === 'ready';
  loginCard.dataset.visible = String(cardVisible);
  loginCard.setAttribute('aria-hidden', String(!cardVisible));
  if (!cardVisible) {
    loginCard.querySelectorAll('input, button, a').forEach((item) => { item.tabIndex = -1; });
    setFieldError(emailInput, document.querySelector('#identity-error'), false);
    setFieldError(passwordInput, document.querySelector('#password-error'), false);
    toast.dataset.visible = 'false';
  } else {
    loginCard.querySelectorAll('input, button, a').forEach((item) => { item.removeAttribute('tabindex'); });
  }
}

function schedule(callback, delay) {
  const timer = window.setTimeout(callback, delay);
  timers.push(timer);
}

function turnOnLamp() {
  if (phase !== 'off') return;
  setPhase('flicker');
  schedule(() => setPhase('lit'), 560);
  schedule(() => setPhase('ready'), 1720);
}

function resetLamp() {
  timers.forEach(window.clearTimeout);
  timers = [];
  window.clearTimeout(successTimer);
  window.clearTimeout(toastTimer);
  toast.dataset.visible = 'false';
  setPhase('resetting');
  schedule(() => setPhase('off'), 1050);
}

function updatePull(distance) {
  pullDistance = Math.max(0, Math.min(104, distance));
  rope.style.setProperty('--rope-pull', `${pullDistance}px`);
}

ropeHandle.addEventListener('pointerdown', (event) => {
  if (phase !== 'off') return;
  pulling = true;
  pullStartY = event.clientY;
  rope.dataset.pulling = 'true';
  ropeHint.hidden = true;
  ropeHandle.setPointerCapture(event.pointerId);
});

ropeHandle.addEventListener('pointermove', (event) => {
  if (pulling) updatePull(event.clientY - pullStartY);
});

function finishPull(event) {
  if (!pulling) return;
  const shouldTurnOn = pullDistance >= 30;
  pulling = false;
  rope.dataset.pulling = 'false';
  updatePull(0);
  if (ropeHandle.hasPointerCapture(event.pointerId)) ropeHandle.releasePointerCapture(event.pointerId);
  ropeHint.hidden = phase !== 'off';
  if (shouldTurnOn) turnOnLamp();
}

ropeHandle.addEventListener('pointerup', finishPull);
ropeHandle.addEventListener('pointercancel', finishPull);

document.querySelector('.power-control').addEventListener('click', resetLamp);

passwordToggle.addEventListener('click', () => {
  const showing = passwordInput.type === 'password';
  passwordInput.type = showing ? 'text' : 'password';
  passwordToggle.setAttribute('aria-label', showing ? 'Hide password' : 'Show password');
  passwordToggle.innerHTML = showing
    ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"></path><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path><path d="M9.9 5.2A11 11 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3 3.8"></path><path d="M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7c1 0 2-.2 2.9-.5"></path></svg>'
    : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
});

function setFieldError(input, messageElement, hasError) {
  input.closest('.field-wrap').dataset.error = String(hasError);
  messageElement.hidden = !hasError;
  input.setAttribute('aria-invalid', String(hasError));
}

emailInput.addEventListener('input', () => setFieldError(emailInput, document.querySelector('#identity-error'), false));
passwordInput.addEventListener('input', () => setFieldError(passwordInput, document.querySelector('#password-error'), false));

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const emailMissing = emailInput.value.trim() === '';
  const passwordMissing = passwordInput.value.trim() === '';
  setFieldError(emailInput, document.querySelector('#identity-error'), emailMissing);
  setFieldError(passwordInput, document.querySelector('#password-error'), passwordMissing);
  if (emailMissing || passwordMissing) return;

  loginButton.disabled = true;
  loginButton.innerHTML = '<span class="spinner" aria-label="Logging in"></span>';
  window.setTimeout(() => {
    loginButton.disabled = false;
    loginButton.innerHTML = 'Login <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>';
    toast.dataset.visible = 'true';
    toastTimer = window.setTimeout(() => { toast.dataset.visible = 'false'; }, 3200);
  }, 1100);
});

// Start with the card hidden and keep the room ready for the rope interaction.
setPhase('off');
