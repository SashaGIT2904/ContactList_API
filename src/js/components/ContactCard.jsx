// Componente de tarjeta de contacto simple.
// Recibe: contact (datos), onEdit (función al editar), onDelete (función al borrar)
import React from "react";

const ContactCard = ({ contact, onEdit, onDelete }) => {
  // Avatar generado según un identificador estable (email/nombre/id)
  const avatar = `https://i.pravatar.cc/96?u=${encodeURIComponent(
    contact.email || contact.full_name || contact.id || Math.random()
  )}`;

  return (
    // Ítem de lista con la info del contacto y acciones
    <li className="list-group-item d-flex align-items-center justify-content-between px-0">
      {/* Zona izquierda: avatar + datos */}
      <div className="d-flex align-items-center gap-3">
        {/* Imagen redonda del contacto */}
        <img
          src={avatar}
          alt={contact.full_name || "contact"}
          className="rounded-circle"
          style={{ width: 64, height: 64, objectFit: "cover" }}
        />
        {/* Texto: nombre (o fallback) + línea con email/teléfono/dirección */}
        <div>
          <div className="fw-semibold">{contact.full_name || "Sin nombre"}</div>
          <div className="small text-muted">
            📧 {contact.email} &nbsp;|&nbsp; ☎️ {contact.phone || "—"}
            &nbsp;|&nbsp; 📍 {contact.address || "—"}
          </div>
        </div>
      </div>

      {/* Zona derecha: botones de acción */}
      <div className="d-flex gap-2">
        {/* Editar: pasa el contacto completo al handler */}
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => onEdit(contact)}
          title="Editar"
        >
          ✏️
        </button>

        {/* Eliminar: llama al handler con el id del contacto */}
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={() => onDelete(contact.id)}
          title="Eliminar"
        >
          🗑️
        </button>
      </div>
    </li>
  );
};

export default ContactCard;
