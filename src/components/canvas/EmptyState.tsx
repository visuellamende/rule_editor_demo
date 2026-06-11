import { useState } from 'react';
import { useI18n } from '../../i18n';
import { NodeTypeMenu } from './NodeTypeMenu';
import type { RuleNodeType } from '../../types/nodes';
import './EmptyState.css';

interface EmptyStateProps {
  onCreateFirst: (type: RuleNodeType) => void;
}

export function EmptyState({ onCreateFirst }: EmptyStateProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useI18n();

  return (
    <div className="empty-state">
      <div className="empty-state__content">
        <button
          className="empty-state__button"
          onClick={() => setMenuOpen(true)}
          aria-label={t('emptyState.button.ariaLabel')}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <p className="empty-state__hint">{t('emptyState.hint')}</p>
        {menuOpen && (
          <NodeTypeMenu
            onSelect={(type) => {
              onCreateFirst(type);
              setMenuOpen(false);
            }}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
