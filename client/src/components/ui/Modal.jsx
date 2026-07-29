import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Accessible modal dialog.
 *
 * Handles the four things hand-rolled modals usually miss:
 *   - focus moves into the dialog on open and returns to the trigger on close
 *   - Tab and Shift+Tab are trapped inside the dialog
 *   - Escape closes it
 *   - background scroll is locked without the page shifting under the overlay
 *
 * Rendered through a portal so an ancestor's `transform`, `filter` or
 * `overflow` can never clip it or steal its containing block.
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  labelledBy,
}) => {
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`);
  const descId = useRef(`modal-desc-${Math.random().toString(36).slice(2, 9)}`);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
        return;
      }

      if (e.key !== 'Tab') return;

      const nodes = dialogRef.current?.querySelectorAll(FOCUSABLE);
      if (!nodes?.length) {
        // Nothing focusable inside — keep focus on the dialog itself rather
        // than letting Tab escape to the page behind the overlay.
        e.preventDefault();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === dialogRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  // Lock background scroll. Compensating for the scrollbar width stops the
  // page behind the overlay jumping sideways as it disappears.
  useEffect(() => {
    if (!open) return undefined;

    const { body } = document;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;

    body.style.overflow = 'hidden';
    if (scrollBarWidth > 0) body.style.paddingRight = `${scrollBarWidth}px`;

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [open]);

  // Move focus in on open, and restore it to the trigger on close.
  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;

    const node = dialogRef.current;
    const firstField = node?.querySelector(FOCUSABLE);
    (firstField ?? node)?.focus({ preventScroll: true });

    return () => {
      previouslyFocused.current?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        // Only a press that both starts and ends on the overlay dismisses —
        // otherwise a text selection that drags out of the dialog closes it.
        if (closeOnOverlayClick && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        className={`modal ${size === 'lg' ? 'modal-lg' : ''} ${size === 'xl' ? 'modal-xl' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy ?? (title ? titleId.current : undefined)}
        aria-describedby={description ? descId.current : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {(title || onClose) && (
          <div className="modal-header">
            <div>
              {title && (
                <h2 className="modal-title" id={titleId.current}>
                  {title}
                </h2>
              )}
              {description && (
                <p className="modal-description" id={descId.current}>
                  {description}
                </p>
              )}
            </div>
            {onClose && (
              <button type="button" className="modal-close" onClick={onClose} aria-label="Close dialog">
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
