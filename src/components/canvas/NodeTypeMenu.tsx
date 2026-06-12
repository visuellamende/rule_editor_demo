import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { RuleNodeType, RuleNodeData } from '../../types/nodes';
import { useI18n } from '../../i18n';
import { useCanvasStore } from '../../store/useCanvasStore';
import './NodeTypeMenu.css';

interface NodeTypeMenuProps {
  onSelect: (type: RuleNodeType) => void;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
  onSelectRef?: (refNodeId: number, label: string) => void;
}

interface MenuOption {
  type: RuleNodeType;
  label: string;
  description: string;
}

export function NodeTypeMenu({ onSelect, onClose, anchorRef, onSelectRef }: NodeTypeMenuProps) {
  const { t } = useI18n();
  const { nodes } = useCanvasStore();

  const existingConsequences = anchorRef
    ? nodes
        .filter((n) => (n.data as unknown as RuleNodeData).nodeType === 'consequence')
        .map((n) => ({
          displayId: (n.data as unknown as RuleNodeData).displayId,
          label: (n.data as unknown as RuleNodeData).label,
        }))
    : [];

  const options: MenuOption[] = [
    {
      type: 'decision',
      label: t('nodeType.decision'),
      description: t('nodeType.decision.description'),
    },
    {
      type: 'condition',
      label: t('nodeType.condition'),
      description: t('nodeType.condition.description'),
    },
    {
      type: 'action',
      label: t('nodeType.action'),
      description: t('nodeType.action.description'),
    },
    {
      type: 'consequence',
      label: t('nodeType.consequence'),
      description: t('nodeType.consequence.description'),
    },
  ];
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  // Position des Menüs anhand des Anker-Elements berechnen
  useEffect(() => {
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + rect.height / 2,
        left: rect.right + 8,
      });
    }
  }, [anchorRef]);

  // Schließen bei Klick außerhalb
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.addEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Schließen bei Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const style: React.CSSProperties = position
    ? {
        position: 'fixed',
        top: position.top,
        left: position.left,
        transform: 'translateY(-50%)',
      }
    : {};

  const menu = (
    <div className="node-type-menu" ref={menuRef} style={style}>
      {options.map((option) => (
        <button
          key={option.type}
          className="node-type-menu__item"
          onClick={() => onSelect(option.type)}
        >
          <span className={`node-type-menu__dot node-type-menu__dot--${option.type}`} />
          <div className="node-type-menu__text">
            <span className="node-type-menu__label">{option.label}</span>
            <span className="node-type-menu__description">{option.description}</span>
          </div>
        </button>
      ))}

      {onSelectRef && existingConsequences.length > 0 && (
        <>
          <div className="node-type-menu__divider" />
          {existingConsequences.map((c) => (
            <button
              key={c.displayId}
              className="node-type-menu__item"
              onClick={() => onSelectRef(c.displayId, c.label)}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ flexShrink: 0, color: 'var(--color-node-consequence)' }}
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <div className="node-type-menu__text">
                <span className="node-type-menu__label">→ #{c.displayId} {c.label}</span>
                <span className="node-type-menu__description">{t('nodeType.consequenceRef.description')}</span>
              </div>
            </button>
          ))}
        </>
      )}
    </div>
  );

  // Wenn ein anchorRef da ist (Knoten-Kontext): Portal nutzen
  // Wenn kein anchorRef (Empty State): direkt rendern
  if (anchorRef) {
    return createPortal(menu, document.body);
  }
  return menu;
}
