/**
 * Native radios provide click/keyboard access; pointer dragging adds swipe support.
 * The visual indicator follows the drag and snaps to the chosen segment on release.
 */
export function initModeSwitch(fieldset, onChange) {
  const track = fieldset.querySelector('.mode-track');
  let gesture = null;
  let suppressClick = false;

  fieldset.addEventListener('change', (event) => {
    if (!event.target.matches('input[name="ranking-mode"]')) return;
    track.dataset.mode = event.target.value;
    onChange(event.target.value);
  });
  track.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, dragging: false };
  });
  track.addEventListener('pointermove', (event) => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    if (!gesture.dragging && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(event.clientY - gesture.y)) {
      gesture.dragging = true;
      track.setPointerCapture(event.pointerId);
      track.classList.add('is-dragging');
    }
    if (!gesture.dragging) return;
    const rect = track.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (event.clientX - rect.left - rect.width / 4) / (rect.width / 2)));
    track.style.setProperty('--slide', `${progress * 100}%`);
  });
  const finish = (event) => {
    if (!gesture || gesture.id !== event.pointerId) return;
    if (gesture.dragging && event.type === 'pointerup') {
      const rect = track.getBoundingClientRect();
      const value = event.clientX < rect.left + rect.width / 2 ? 'basic' : 'explained';
      const input = track.querySelector(`input[value="${value}"]`);
      if (!input.checked) {
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      input.focus();
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
    }
    track.classList.remove('is-dragging');
    track.style.removeProperty('--slide');
    gesture = null;
  };
  track.addEventListener('pointerup', finish);
  track.addEventListener('pointercancel', finish);
  track.addEventListener('click', (event) => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  }, true);
}
