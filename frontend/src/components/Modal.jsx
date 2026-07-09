import { useEffect, useRef } from 'react';

// Modal accesible: cierra con Esc o clic en el fondo, bloquea el scroll del
// body, enfoca el diálogo y declara role/aria para lectores de pantalla.
export default function Modal({ titulo, onClose, children }) {
  const ref = useRef(null);

  // Guardamos el onClose más reciente en una ref para que el efecto de montaje
  // NO dependa de él. Si dependiera, cada render (p. ej. al escribir en un input)
  // reejecutaría el efecto y el focus() robaría el foco del campo.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // Solo al montar/desmontar: el foco inicial se pone una vez, al abrir.
  }, []);

  return (
    <div
      className="modal-overlay"
      // Cerrar solo si el gesto empieza y termina en el fondo (no al arrastrar).
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo} tabIndex={-1} ref={ref}>
        <div className="modal-header">
          <h3 className="modal-title">{titulo}</h3>
          <button className="modal-close" aria-label="Cerrar" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
