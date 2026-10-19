import { mountProject } from './projects-controller';

export function initTerminal(): void {
  const form = document.getElementById('terminalForm') as HTMLFormElement | null;
  const input = document.getElementById('terminalInput') as HTMLInputElement | null;
  const ghost = document.getElementById('terminalGhost') as HTMLElement | null;
  const logs = document.getElementById('terminalLogs') as HTMLElement | null;
  const pills = document.querySelectorAll<HTMLButtonElement>('.term-pill-btn');

  if (!form || !input || !logs) return;

  const COMMANDS = ['hy', 'projects', 'codearena', 'automl', 'mediremind', 'philosophy', 'cat', 'about', 'clear', 'help'];
  const history: string[] = [];
  let historyIndex = -1;
  let currentSuggestion = '';

  function escapeHtml(str: string): string {
    return str.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[m] || m));
  }

  function updateGhost(): void {
    if (!ghost || !input) return;
    const val = input.value;
    if (!val) {
      ghost.innerHTML = '';
      currentSuggestion = '';
      return;
    }

    const lowerVal = val.toLowerCase();
    const match = COMMANDS.find((c) => c.startsWith(lowerVal) && c !== lowerVal);

    if (match) {
      currentSuggestion = match;
      const typedLen = val.length;
      const remaining = match.slice(typedLen);
      ghost.innerHTML = `<span style="visibility:hidden">${escapeHtml(val)}</span>${escapeHtml(remaining)}`;
    } else {
      currentSuggestion = '';
      ghost.innerHTML = '';
    }
  }

  function appendLine(htmlContent: string, isEcho = false): void {
    if (!logs) return;
    const line = document.createElement('div');
    line.className = isEcho ? 'term-line term-cmd-echo' : 'term-line';
    line.innerHTML = htmlContent;
    logs.appendChild(line);
    logs.scrollTop = logs.scrollHeight;
  }

  function handleCommand(rawCmd: string): void {
    const cmd = rawCmd.trim().toLowerCase();
    if (!cmd) return;

    history.push(rawCmd);
    historyIndex = history.length;

    // Echo command
    appendLine(`❯ ${rawCmd}`, true);

    switch (cmd) {
      case 'hy':
      case 'hi':
      case 'hello':
      case 'hey':
        appendLine(
          `Hy there, fellow visitor! Welcome to the deck.<br>` +
          `<span class="term-muted">Feel free to explore:</span> ` +
          `<span class="term-cyan">projects</span>, ` +
          `<span class="term-cyan">philosophy</span>, ` +
          `<span class="term-cyan">cat</span>, or ` +
          `<span class="term-cyan">clear</span>`
        );
        break;

      case 'help':
        appendLine(
          `<span class="term-hl">COMMANDS:</span><br>` +
          `• <span class="term-cyan">hy</span>           — Say hello<br>` +
          `• <span class="term-cyan">projects</span>     — Deployed systems &amp; scroll to deck<br>` +
          `• <span class="term-cyan">codearena</span>    — Mount CodeArena in Holo-Deck<br>` +
          `• <span class="term-cyan">automl</span>       — Mount AutoML Copilot in Holo-Deck<br>` +
          `• <span class="term-cyan">mediremind</span>   — Mount MediRemind in Holo-Deck<br>` +
          `• <span class="term-cyan">philosophy</span>   — Core ethos &amp; Descartes axiom<br>` +
          `• <span class="term-cyan">cat</span>          — Secret feline companion<br>` +
          `• <span class="term-cyan">about</span>        — Siddharth in a nutshell<br>` +
          `• <span class="term-cyan">clear</span>        — Wipe console display`
        );
        break;

      case 'projects':
        appendLine(
          `<span class="term-hl">DEPLOYED SYSTEMS:</span><br>` +
          `01 // <span class="term-cyan">CodeArena</span> — Multiplayer competitive coding platform<br>` +
          `02 // <span class="term-cyan">AutoML Copilot</span> — AI-powered data science &amp; EDA copilot<br>` +
          `03 // <span class="term-cyan">MediRemind</span> — Vision AI prescription reminder &amp; bot<br>` +
          `<span class="term-muted">Tip: Type 'codearena', 'automl', or 'mediremind' to mount.</span>`
        );
        document.getElementById('projectsSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;

      case 'codearena':
      case '1':
        mountProject('codearena');
        appendLine(`<span class="term-cyan">✓ Mounted CodeArena</span> onto the Holo-Deck.`);
        document.getElementById('projectsSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;

      case 'automl':
      case 'automl copilot':
      case '2':
        mountProject('automl');
        appendLine(`<span class="term-cyan">✓ Mounted AutoML Copilot</span> onto the Holo-Deck.`);
        document.getElementById('projectsSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;

      case 'mediremind':
      case '3':
        mountProject('mediremind');
        appendLine(`<span class="term-cyan">✓ Mounted MediRemind</span> onto the Holo-Deck.`);
        document.getElementById('projectsSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;

      case 'philosophy':
        appendLine(
          `<i>"I think | therefore I am"</i> — Descartes<br>` +
          `<span class="term-muted">Software is modern alchemy. The code is only half the story — the rest is curiosity &amp; taste.</span>`
        );
        break;

      case 'cat':
        appendLine(
          `<pre class="term-cat-art"> /\\_/\\  \n( o.o )  *tippy tappy on mechanical keyboard*\n > ^ &lt;   "meow! built different."</pre>`
        );
        break;

      case 'about':
        appendLine(
          `<span class="term-hl">SIDDHARTH JASWAL:</span><br>` +
          `Software &amp; AI builder obsessed with tactile UI, neural dynamics, and crafting things that feel alive.`
        );
        break;

      case 'clear':
        if (logs) {
          logs.innerHTML = '';
          appendLine(`type <span class="term-cyan">'hy'</span> to begin <span class="typing-blink">_</span>`, false);
        }
        break;

      default:
        appendLine(
          `<span class="term-err">command not found: "${escapeHtml(rawCmd)}".</span> Try typing <span class="term-cyan">'hy'</span>.`
        );
        break;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = input.value;
    input.value = '';
    updateGhost();
    handleCommand(val);
  });

  input.addEventListener('input', () => {
    updateGhost();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = input.value;
      input.value = '';
      updateGhost();
      handleCommand(val);
      return;
    }

    if (e.key === 'Tab' || (e.key === 'ArrowRight' && input.selectionStart === input.value.length)) {
      if (currentSuggestion) {
        e.preventDefault();
        input.value = currentSuggestion;
        updateGhost();
        return;
      }
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        input.value = history[historyIndex] || '';
        updateGhost();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        historyIndex++;
        input.value = history[historyIndex] || '';
        updateGhost();
      } else {
        historyIndex = history.length;
        input.value = '';
        updateGhost();
      }
    }
  });

  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const cmd = pill.dataset.cmd;
      if (cmd) {
        handleCommand(cmd);
      }
    });
  });
}
