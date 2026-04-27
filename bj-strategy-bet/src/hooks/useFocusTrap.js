import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// active が true の間、ref で参照したコンテナ内のフォーカス可能要素で Tab をループさせ、
// active が false に戻ったら開く直前のフォーカス位置に戻す。モーダル/オーバーレイ向け。
//
// 使い方:
//   const ref = useFocusTrap(open);
//   return <div ref={ref} role="dialog" aria-modal="true" ...>...</div>;
export function useFocusTrap(active) {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    previousFocusRef.current = document.activeElement;

    // 初期フォーカスをコンテナ内の最初の要素に
    const root = containerRef.current;
    if (root) {
      const first = root.querySelector(FOCUSABLE_SELECTOR);
      if (first instanceof HTMLElement) first.focus();
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') return;
      const node = containerRef.current;
      if (!node) return;
      const focusables = Array.from(node.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) => el instanceof HTMLElement
      );
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;
      if (event.shiftKey) {
        if (current === first || !node.contains(current)) {
          last.focus();
          event.preventDefault();
        }
      } else if (current === last) {
        first.focus();
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      const prev = previousFocusRef.current;
      if (prev instanceof HTMLElement) prev.focus();
    };
  }, [active]);

  return containerRef;
}
