interface ProjectData {
  id: string;
  title: string;
  url: string;
}

const PROJECTS: Record<string, ProjectData> = {
  codearena: {
    id: 'codearena',
    title: 'CodeArena',
    url: 'https://coding-arena-lovat.vercel.app',
  },
  automl: {
    id: 'automl',
    title: 'AutoML Copilot',
    url: 'https://auto-ml-weld.vercel.app/',
  },
  mediremind: {
    id: 'mediremind',
    title: 'MediRemind',
    url: 'https://medi-remind-frontend-silk.vercel.app/',
  },
};

let activeMountFn: ((id: string) => void) | null = null;

export function mountProject(id: string): boolean {
  if (activeMountFn && PROJECTS[id]) {
    activeMountFn(id);
    return true;
  }
  return false;
}

export function initProjects(): void {
  const cards = document.querySelectorAll<HTMLElement>('.project-card');
  const iframe = document.getElementById('monitorIframe') as HTMLIFrameElement | null;
  const urlText = document.getElementById('monitorUrlText');
  const extLink = document.getElementById('monitorExtLink') as HTMLAnchorElement | null;
  const refreshBtn = document.getElementById('monitorRefreshBtn');
  const monitorScreen = document.getElementById('monitorScreen');
  const shield = document.getElementById('monitorShield');
  const unlockBtn = document.getElementById('unlockInteractBtn');

  if (!iframe || !urlText) return;

  const validIframe = iframe;
  const validUrlText = urlText;

  function setProject(id: string): void {
    const data = PROJECTS[id];
    if (!data) return;

    cards.forEach((card) => {
      const isCurrent = card.dataset.projectId === id;
      card.classList.toggle('is-active', isCurrent);
      const hint = card.querySelector('.view-mount-hint');
      if (hint) {
        hint.textContent = isCurrent ? 'Mounted on Holo-Deck ●' : 'Click to Mount ↗';
      }
    });

    if (monitorScreen) {
      monitorScreen.classList.add('is-switching');
      setTimeout(() => {
        monitorScreen.classList.remove('is-switching');
      }, 400);
    }

    validIframe.src = data.url;
    validUrlText.textContent = data.url;
    if (extLink) extLink.href = data.url;

    // Reset shield to guard scrolling
    if (shield) {
      shield.classList.remove('is-unlocked');
    }
  }

  activeMountFn = setProject;

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.dataset.projectId;
      if (id) setProject(id);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = card.dataset.projectId;
        if (id) setProject(id);
      }
    });
  });

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      const currentSrc = iframe.src;
      iframe.src = '';
      setTimeout(() => {
        iframe.src = currentSrc;
      }, 80);
    });
  }

  if (unlockBtn && shield) {
    unlockBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      shield.classList.add('is-unlocked');
    });

    if (monitorScreen) {
      monitorScreen.addEventListener('mouseleave', () => {
        shield.classList.remove('is-unlocked');
      });
    }
  }
}
