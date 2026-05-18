// Registro locale per le icone in stile Lucide
const localLucideIcons = {
  menu: `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <line x1="4" y1="6" x2="20" y2="6"></line>
      <line x1="4" y1="12" x2="20" y2="12"></line>
      <line x1="4" y1="18" x2="20" y2="18"></line>
    </svg>
  `,
  x: `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 6 6 18"></path>
      <path d="m6 6 12 12"></path>
    </svg>
  `,
};

// Iniezione delle icone nel markup
function createLocalIcons() {
  const iconNodes = document.querySelectorAll("[data-lucide]");

  iconNodes.forEach((iconNode) => {
    const iconName = iconNode.getAttribute("data-lucide");
    const iconMarkup = localLucideIcons[iconName];

    if (!iconMarkup) {
      return;
    }

    iconNode.innerHTML = iconMarkup.trim();
  });
}

// Apertura e chiusura del menu
function setupMenu() {
  const menuPanel = document.querySelector("[data-menu-panel]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const menuClose = document.querySelector("[data-menu-close]");

  if (!menuPanel || !menuToggle || !menuClose) {
    return;
  }

  menuToggle.setAttribute("aria-expanded", "false");

  const closeMenu = () => {
    document.body.classList.remove("menu-open");
    menuPanel.setAttribute("aria-hidden", "true");
    menuToggle.setAttribute("aria-expanded", "false");
  };

  const openMenu = () => {
    document.body.classList.add("menu-open");
    menuPanel.setAttribute("aria-hidden", "false");
    menuToggle.setAttribute("aria-expanded", "true");
  };

  menuToggle.addEventListener("click", openMenu);
  menuClose.addEventListener("click", closeMenu);

  menuPanel.addEventListener("click", (event) => {
    if (event.target === menuPanel) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

// Transizione con logo tra le pagine
function spinLogoOnce(logo, onSpinEnd) {
  if (!logo) {
    return;
  }

  const handleAnimationEnd = () => {
    logo.removeEventListener("animationend", handleAnimationEnd);
    logo.classList.remove("is-spinning");

    if (onSpinEnd) {
      onSpinEnd();
    }
  };

  logo.classList.remove("is-spinning");
  void logo.offsetWidth;
  logo.addEventListener("animationend", handleAnimationEnd, { once: true });
  logo.classList.add("is-spinning");
}

function setupPageTransition() {
  const transitionOverlay = document.querySelector("[data-page-transition]");
  const transitionLogo = transitionOverlay?.querySelector(".page-transition__logo");
  const transitionLinks = document.querySelectorAll("[data-transition-link]");

  if (!transitionOverlay || !transitionLogo || !transitionLinks.length) {
    return;
  }

  transitionLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const url = link.getAttribute("href");
      const currentPath = window.location.pathname.split("/").pop() || "index.html";

      if (!url || url === currentPath || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      event.preventDefault();

      if (document.body.classList.contains("is-transitioning")) {
        return;
      }

      document.body.classList.remove("menu-open");
      document.body.classList.add("is-transitioning");
      sessionStorage.setItem("pageTransitionPending", "true");
      transitionOverlay.setAttribute("aria-hidden", "false");
      transitionOverlay.classList.add("is-active");

      let hasNavigated = false;

      const navigateToTarget = () => {
        if (hasNavigated) {
          return;
        }

        hasNavigated = true;
        window.location.href = url;
      };

      spinLogoOnce(transitionLogo, () => {
        navigateToTarget();
      });
    });
  });
}

// Chiusura dell'overlay sulla pagina di arrivo
function finishPendingPageTransition() {
  const transitionOverlay = document.querySelector("[data-page-transition]");

  if (!transitionOverlay || !sessionStorage.getItem("pageTransitionPending")) {
    return;
  }

  document.body.classList.add("is-transitioning");
  transitionOverlay.setAttribute("aria-hidden", "false");
  transitionOverlay.classList.add("is-active");
  document.documentElement.classList.remove("is-loading-transition");

  const closeTransition = () => {
    transitionOverlay.classList.remove("is-active");
    transitionOverlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-transitioning");
    sessionStorage.removeItem("pageTransitionPending");
  };

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      closeTransition();
    });
  });
}

// Animazioni di comparsa dei blocchi
function setupRevealAnimations() {
  const revealBlocks = document.querySelectorAll(".reveal");

  if (!revealBlocks.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12,
    }
  );

  revealBlocks.forEach((block) => observer.observe(block));
}

// Feedback temporaneo del modulo RSVP
function setupRsvpForm() {
  const rsvpForm = document.querySelector("[data-rsvp-form]");
  const feedback = document.querySelector("[data-form-feedback]");

  if (!rsvpForm || !feedback) {
    return;
  }

  rsvpForm.addEventListener("submit", (event) => {
    event.preventDefault();
    feedback.textContent = "Struttura pronta: nel prossimo passaggio collegheremo questo modulo alla raccolta reale delle risposte.";
  });
}

// Apertura a fisarmonica dei placeholder lista nozze
function setupGiftStack() {
  const giftStacks = Array.from(document.querySelectorAll("[data-gift-stack]"));

  if (!giftStacks.length) {
    return;
  }

  const stackControllers = giftStacks
    .map((giftStack) => {
      const giftCards = Array.from(giftStack.querySelectorAll("[data-gift-card]"));

      if (!giftCards.length) {
        return null;
      }

      let activeIndex = -1;

      const resetStack = () => {
        activeIndex = -1;
        giftStack.dataset.stackOpen = "false";

        giftCards.forEach((card) => {
          card.classList.remove("is-active");
          card.style.setProperty("--stack-shift", "0px");
        });
      };

      const openCard = (index) => {
        const baseHeight = giftCards[index].offsetHeight;
        const revealGap = 10;
        const overlapOffset = Math.round(baseHeight * 0.65) + revealGap;

        activeIndex = index;
        giftStack.dataset.stackOpen = "true";

        giftCards.forEach((card, cardIndex) => {
          card.classList.toggle("is-active", cardIndex === index);

          if (cardIndex <= index) {
            card.style.setProperty("--stack-shift", "0px");
            return;
          }

          card.style.setProperty("--stack-shift", `${overlapOffset}px`);
        });
      };

      giftCards.forEach((card, index) => {
        card.addEventListener("click", (event) => {
          event.stopPropagation();

          stackControllers.forEach((controller) => {
            if (controller && controller.stack !== giftStack) {
              controller.reset();
            }
          });

          if (activeIndex === index) {
            resetStack();
            return;
          }

          openCard(index);
        });
      });

      giftStack.addEventListener("click", (event) => {
        if (event.target === giftStack) {
          resetStack();
        }
      });

      resetStack();

      return {
        stack: giftStack,
        reset: resetStack,
      };
    })
    .filter(Boolean);

  if (!stackControllers.length) {
    return;
  }

  document.addEventListener("click", (event) => {
    const clickedInsideStack = stackControllers.some((controller) => controller.stack.contains(event.target));

    if (!clickedInsideStack) {
      stackControllers.forEach((controller) => controller.reset());
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      stackControllers.forEach((controller) => controller.reset());
    }
  });
}

// Avvio generale della pagina
document.addEventListener("DOMContentLoaded", () => {
  createLocalIcons();
  setupMenu();
  setupPageTransition();
  finishPendingPageTransition();
  setupRevealAnimations();
  setupRsvpForm();
  setupGiftStack();
});
