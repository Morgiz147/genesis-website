/**
 * Accordion Component (FAQ & Collapsible panels)
 */
export function initAccordion() {
  const faqGroups = document.querySelectorAll('.faq-item-group');
  const iconOpen = 'assets/icons/f862e0bf77ba9b13226c617a76e5382364a0a394.svg'; // Minus
  const iconClosed = 'assets/icons/ac3b9c3ad30662eab01a0a1b8bae92dd0f7af7ea.svg'; // Plus

  faqGroups.forEach((group) => {
    const questionBox = group.querySelector('.faq-question-box');
    const iconImg = group.querySelector('.faq-toggle-icon img');

    if (!questionBox) return;

    questionBox.addEventListener('click', () => {
      const isActive = group.classList.contains('active');

      // Close all other FAQ groups smoothly
      faqGroups.forEach((otherGroup) => {
        if (otherGroup !== group) {
          otherGroup.classList.remove('active');
          otherGroup.querySelector('.faq-question-box')?.setAttribute('aria-expanded', 'false');
          const otherIcon = otherGroup.querySelector('.faq-toggle-icon img');
          if (otherIcon) otherIcon.src = iconClosed;
        }
      });

      // Toggle clicked item
      if (isActive) {
        group.classList.remove('active');
        questionBox.setAttribute('aria-expanded', 'false');
        if (iconImg) iconImg.src = iconClosed;
      } else {
        group.classList.add('active');
        questionBox.setAttribute('aria-expanded', 'true');
        if (iconImg) iconImg.src = iconOpen;
      }
    });
  });
}
