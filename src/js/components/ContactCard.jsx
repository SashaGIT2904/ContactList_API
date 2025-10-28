// Componente que sirve de item de lista de contactos
import React from "react";


//Funcion que pinta los datos de un contacto
const ContactCard = ({ contact, onEdit, onDelete }) => {
  // Avatar generado a partir del email
  const avatar = `https://i.pravatar.cc/96?u=${encodeURIComponent(
    contact.email || contact.full_name || contact.id || Math.random()
  )}`;
  
  return (
    
    <li className="list-group-item d-flex align-items-center justify-content-between px-0">
     
      <div className="d-flex align-items-center gap-3">
      
        <img
          src={avatar}
          alt={contact.full_name || "contact"}
          className="rounded-circle"
          style={{ width: 64, height: 64, objectFit: "cover" }}
        />
       
        <div>
          <div className="fw-semibold">{contact.full_name || "Sin nombre"}</div>
          <div className="small text-muted">
            📧 {contact.email} &nbsp;|&nbsp; ☎️ {contact.phone || "—"}
            &nbsp;|&nbsp; 📍 {contact.address || "—"}
          </div>
        </div>
      </div>

   
      <div className="d-flex gap-2">
       
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => onEdit(contact)}
          title="Editar"
        >
          ✏️
        </button>

        {/* Botón de eliminar contacto */}
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={() => {
            console.log("Borrando contacto:", contact); 
            onDelete(contact.id);
          }}
          title="Eliminar"
        >
          🗑️
        </button>
      </div>
    </li>
  );
};

export default ContactCard;
