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

const transitionLogos = [
  {
    src: "logo_gizzi.png",
    alt: "Logo Gizzi",
    modifierClass: "",
  },
  {
    src: "logo ceci 2.png",
    alt: "Logo Ceci",
    modifierClass: "page-transition__logo--ceci",
  },
];

const transitionStorageKeys = {
  pending: "pageTransitionPending",
  activeLogoIndex: "pageTransitionLogoIndex",
  nextLogoIndex: "pageTransitionNextLogoIndex",
};

function normalizeTransitionLogoIndex(value) {
  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue)) {
    return 0;
  }

  return ((parsedValue % transitionLogos.length) + transitionLogos.length) % transitionLogos.length;
}

function getNextTransitionLogoIndex() {
  return normalizeTransitionLogoIndex(sessionStorage.getItem(transitionStorageKeys.nextLogoIndex));
}

function setNextTransitionLogoIndex(index) {
  sessionStorage.setItem(transitionStorageKeys.nextLogoIndex, String(normalizeTransitionLogoIndex(index)));
}

function setTransitionLogo(logoElement, logoIndex) {
  if (!logoElement) {
    return 0;
  }

  const normalizedIndex = normalizeTransitionLogoIndex(logoIndex);
  const logoConfig = transitionLogos[normalizedIndex];

  logoElement.src = logoConfig.src;
  logoElement.alt = logoConfig.alt;
  logoElement.classList.toggle("page-transition__logo--ceci", logoConfig.modifierClass === "page-transition__logo--ceci");

  return normalizedIndex;
}

function waitForTransitionLogo(logoElement) {
  if (!logoElement) {
    return Promise.resolve();
  }

  const imageReady = logoElement.complete && logoElement.naturalWidth > 0;
  const decodeLogo = () => {
    if (typeof logoElement.decode !== "function") {
      return Promise.resolve();
    }

    return logoElement.decode().catch(() => {});
  };

  if (imageReady) {
    return decodeLogo();
  }

  return new Promise((resolve) => {
    const finish = () => {
      logoElement.removeEventListener("load", finish);
      logoElement.removeEventListener("error", finish);
      resolve();
    };

    logoElement.addEventListener("load", finish, { once: true });
    logoElement.addEventListener("error", finish, { once: true });
  }).then(decodeLogo);
}

function restoreTransitionLogo(logoElement) {
  if (!logoElement) {
    return 0;
  }

  if (sessionStorage.getItem(transitionStorageKeys.pending)) {
    const activeLogoIndex = sessionStorage.getItem(transitionStorageKeys.activeLogoIndex);

    if (activeLogoIndex !== null) {
      return setTransitionLogo(logoElement, activeLogoIndex);
    }
  }

  return setTransitionLogo(logoElement, getNextTransitionLogoIndex());
}

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

  restoreTransitionLogo(transitionLogo);

  transitionLinks.forEach((link) => {
    link.addEventListener("click", async (event) => {
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
      const activeLogoIndex = getNextTransitionLogoIndex();

      setTransitionLogo(transitionLogo, activeLogoIndex);
      sessionStorage.setItem(transitionStorageKeys.pending, "true");
      sessionStorage.setItem(transitionStorageKeys.activeLogoIndex, String(activeLogoIndex));
      setNextTransitionLogoIndex(activeLogoIndex + 1);
      await waitForTransitionLogo(transitionLogo);
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
async function finishPendingPageTransition() {
  const transitionOverlay = document.querySelector("[data-page-transition]");

  if (!transitionOverlay || !sessionStorage.getItem(transitionStorageKeys.pending)) {
    return;
  }

  const transitionLogo = transitionOverlay.querySelector(".page-transition__logo");

  restoreTransitionLogo(transitionLogo);

  document.body.classList.add("is-transitioning");
  transitionOverlay.setAttribute("aria-hidden", "false");
  transitionOverlay.classList.add("is-active");
  await waitForTransitionLogo(transitionLogo);
  document.documentElement.classList.remove("is-loading-transition");

  const closeTransition = () => {
    transitionOverlay.classList.remove("is-active");
    transitionOverlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-transitioning");
    sessionStorage.removeItem(transitionStorageKeys.pending);
    sessionStorage.removeItem(transitionStorageKeys.activeLogoIndex);
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
  const giftStacks = Array.from(document.querySelectorAll(".gift-stack-mobile[data-gift-stack]"));

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

// Flip delle carte memory lista nozze
function setupGiftMemory() {
  const memoryCarousels = Array.from(document.querySelectorAll("[data-memory-carousel]"));
  const standaloneMemoryGroups = Array.from(document.querySelectorAll(".gift-memory-mobile")).map((group) =>
    Array.from(group.querySelectorAll("[data-memory-card]"))
  );

  if (!memoryCarousels.length && !standaloneMemoryGroups.length) {
    return;
  }

  const resetCards = (cards) => {
    cards.forEach((card) => {
      card.classList.remove("is-flipped");
      card.setAttribute("aria-pressed", "false");
    });
  };

  const setupSingleOpenMemory = (cards) => {
    cards.forEach((card) => {
      card.addEventListener("click", (event) => {
        event.stopPropagation();

        const wasFlipped = card.classList.contains("is-flipped");
        resetCards(cards);

        if (!wasFlipped) {
          card.classList.add("is-flipped");
          card.setAttribute("aria-pressed", "true");
        }
      });
    });
  };

  standaloneMemoryGroups.forEach(setupSingleOpenMemory);

  memoryCarousels.forEach((carousel) => {
    const pages = Array.from(carousel.querySelectorAll("[data-memory-page]"));
    const memoryCards = Array.from(carousel.querySelectorAll("[data-memory-card]"));
    const prevButton = carousel.querySelector("[data-memory-prev]");
    const nextButton = carousel.querySelector("[data-memory-next]");

    if (!pages.length || !memoryCards.length || !prevButton || !nextButton) {
      return;
    }

    const transitionDuration = 1250;
    let isChangingPage = false;
    let transitionTimer = null;
    let activeIndex = Math.max(
      0,
      pages.findIndex((page) => page.classList.contains("is-active"))
    );

    const setControlsDisabled = (isDisabled) => {
      prevButton.disabled = isDisabled;
      nextButton.disabled = isDisabled;
    };

    const showPage = (nextIndex, direction = "next", animate = true) => {
      const normalizedIndex = (nextIndex + pages.length) % pages.length;

      if (isChangingPage || (animate && normalizedIndex === activeIndex)) {
        return;
      }

      resetCards(memoryCards);
      carousel.dataset.memoryDirection = direction;

      if (!animate) {
        activeIndex = normalizedIndex;

        pages.forEach((page, pageIndex) => {
          const isActive = pageIndex === activeIndex;
          page.classList.toggle("is-active", isActive);
          page.classList.remove("is-entering", "is-exiting");
          page.setAttribute("aria-hidden", String(!isActive));
        });

        return;
      }

      isChangingPage = true;
      setControlsDisabled(true);

      const currentPage = pages[activeIndex];
      const nextPage = pages[normalizedIndex];

      currentPage.classList.add("is-exiting");
      currentPage.setAttribute("aria-hidden", "true");
      nextPage.classList.add("is-active", "is-entering");
      nextPage.setAttribute("aria-hidden", "false");

      const finishTransition = () => {
        currentPage.classList.remove("is-active", "is-exiting");
        nextPage.classList.remove("is-entering");
        activeIndex = normalizedIndex;
        isChangingPage = false;
        setControlsDisabled(false);
      };

      window.clearTimeout(transitionTimer);
      transitionTimer = window.setTimeout(finishTransition, transitionDuration);
    };

    setupSingleOpenMemory(memoryCards);

    prevButton.addEventListener("click", () => {
      showPage(activeIndex - 1, "prev");
    });

    nextButton.addEventListener("click", () => {
      showPage(activeIndex + 1, "next");
    });

    showPage(activeIndex, "next", false);
  });

  document.addEventListener("click", () => {
    standaloneMemoryGroups.forEach(resetCards);

    memoryCarousels.forEach((carousel) => {
      resetCards(Array.from(carousel.querySelectorAll("[data-memory-card]")));
    });
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
  setupGiftMemory();
});
