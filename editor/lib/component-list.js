// UI groups can combine layers without changing their storage or identity.
export const componentTab = (item, key) => key === 'blocks' && item.group === 'chu' ? 'texts' : key;

export function componentEntries(project, tab) {
  const keys = tab === 'texts' ? ['texts', 'blocks'] : [tab];
  return keys.flatMap(key => (project?.[key] || [])
    .filter(item => componentTab(item, key) === tab)
    .map(item => ({item, key})));
}

export const componentSelected = (state, item, key) =>
  (state.selKind || state.tab) === key && state.selId === item.id;
