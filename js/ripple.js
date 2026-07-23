// js/ripple.js - Ripple Effect for Buttons
document.addEventListener('click', (e) => {
  const target = e.target.closest('.btn-ripple');
  if (!target) return;

  const rect = target.getBoundingClientRect();
  const circle = document.createElement('span');
  const diameter = Math.max(rect.width, rect.height);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${e.clientX - rect.left - radius}px`;
  circle.style.top = `${e.clientY - rect.top - radius}px`;
  circle.classList.add('ripple-span');

  const existing = target.getElementsByClassName('ripple-span')[0];
  if (existing) existing.remove();

  target.appendChild(circle);
});