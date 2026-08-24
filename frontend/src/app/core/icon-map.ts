const MDI_TO_MATERIAL: Record<string, string> = {
  'view-grid': 'dashboard',
  'view-dashboard': 'dashboard',
  grid: 'dashboard',
  school: 'star',
  star: 'star',
  'crosshairs-gps': 'work',
  briefcase: 'work',
  work: 'work',
  'clipboard-check': 'fact_check',
  'clipboard-text': 'fact_check',
  sitemap: 'account_tree',
  history: 'history',
  settings: 'settings',
  cog: 'settings',
  certificate: 'workspace_premium',
  logout: 'logout',
  account: 'person',
  accountgroup: 'group',
  'account-group': 'group',
  'account-multiple': 'group',
  'account-key': 'admin_panel_settings',
  'account-cog': 'manage_accounts',
  'shield-account': 'admin_panel_settings',
  'shield-lock': 'security',
  shield: 'shield',
  lock: 'lock',
  key: 'key',
  'clipboard-account': 'badge',
  'account-tie': 'badge',
  'office-building': 'apartment',
  domain: 'apartment',
  tune: 'tune',
  wrench: 'build',
  folder: 'folder',
  'file-document': 'description',
  bell: 'notifications',
  quiz: 'quiz',
  chart: 'bar_chart',
  'chart-bar': 'bar_chart',
  'chart-pie': 'pie_chart',
  home: 'home',
};

function lastMdiToken(icon: string): string {
  const tokens = icon
    .split(/\s+/)
    .map((t) => t.replace(/^mdi-/, '').replace(/^mdi$/, ''))
    .filter(Boolean);
  return tokens.at(-1) ?? '';
}

/** Mappe une classe MDI (API modules) vers une ligature Material Icons. */
export function toMaterialIcon(icon: string | null | undefined): string {
  if (!icon) return 'circle';
  const raw = icon.trim();
  if (!raw.includes(' ') && !raw.startsWith('mdi')) {
    return raw;
  }
  const token = lastMdiToken(raw);
  return MDI_TO_MATERIAL[token] ?? 'circle';
}
