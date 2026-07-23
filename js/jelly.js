// js/jelly.js - Jelly Interaction Effect on Hover
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.jelly-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'scale(1.03) translateY(-4px)';
      card.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'scale(1) translateY(0)';
      card.style.transition = 'transform 0.3s ease';
    });
  });
});