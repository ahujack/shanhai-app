export interface PanelAction {
  label: string;
  primary?: boolean;
  onClick: () => void;
}

const panel = () => document.getElementById('panel')!;
const titleEl = () => document.getElementById('panel-title')!;
const bodyEl = () => document.getElementById('panel-body')!;
const actionsEl = () => document.getElementById('panel-actions')!;

export function openPanel(title: string, html: string, actions: PanelAction[] = []) {
  titleEl().textContent = title;
  bodyEl().innerHTML = html;
  actionsEl().innerHTML = '';
  for (const a of actions) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = a.label;
    if (a.primary) btn.classList.add('primary');
    btn.addEventListener('click', a.onClick);
    actionsEl().appendChild(btn);
  }
  panel().classList.remove('hidden');
}

export function closePanel() {
  panel().classList.add('hidden');
  bodyEl().innerHTML = '';
  actionsEl().innerHTML = '';
}

export function bindPanelChrome() {
  document.getElementById('panel-close')?.addEventListener('click', closePanel);
  panel().addEventListener('click', (e) => {
    if (e.target === panel()) closePanel();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });
}
