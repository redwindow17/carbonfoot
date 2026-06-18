/**
 * An accessible tabs widget following the WAI-ARIA Authoring Practices:
 * `tablist`/`tab`/`tabpanel` roles, roving tabindex, and arrow/Home/End
 * keyboard navigation. Only the active panel is rendered (state lives in the
 * store, so nothing is lost when switching).
 */

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface TabDefinition {
  id: string;
  label: string;
  icon?: string;
  render: () => ReactNode;
}

interface TabsProps {
  tabs: TabDefinition[];
  ariaLabel: string;
}

export function Tabs({ tabs, ariaLabel }: TabsProps) {
  const baseId = useId();
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? '');
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  function focusTab(id: string) {
    setActiveId(id);
    buttonRefs.current[id]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const lastIndex = tabs.length - 1;
    let nextIndex = -1;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = index === lastIndex ? 0 : index + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = index === 0 ? lastIndex : index - 1;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = lastIndex;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    if (nextTab) focusTab(nextTab.id);
  }

  if (!activeTab) return null;

  return (
    <div className="tabs">
      <div role="tablist" aria-label={ariaLabel} className="tabs__list">
        {tabs.map((tab, index) => {
          const selected = tab.id === activeTab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                buttonRefs.current[tab.id] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              className={`tabs__tab${selected ? ' tabs__tab--active' : ''}`}
              onClick={() => setActiveId(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              {tab.icon ? (
                <span aria-hidden="true" className="tabs__icon">
                  {tab.icon}
                </span>
              ) : null}
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel-${activeTab.id}`}
        aria-labelledby={`${baseId}-tab-${activeTab.id}`}
        tabIndex={0}
        className="tabs__panel"
      >
        {activeTab.render()}
      </div>
    </div>
  );
}
