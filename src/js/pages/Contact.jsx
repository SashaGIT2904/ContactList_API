//Páginas de contactos
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ContactCard from "../components/ContactCard.jsx";
import { getContacts, deleteContact } from "../api.js";

const Contact = () => {
  // Estados de contacto, cargando y error
  const [contactos, setContactos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Funcion que carga la lista de contactos
  const cargar = async () => {
    setCargando(true);
    setError("");
    try {
      const list = await getContacts();
      setContactos(list);
    } catch (e) {
      setError(e.message || "Error al cargar contactos");
    } finally {
      setCargando(false);
    }
  };

  //Funcion que borra un contacto
  const onDelete = async (id) => {
    if (!id) return;
    if (!window.confirm("¿Seguro que quieres borrar este contacto?")) return;
    try {
      await deleteContact(id); // DELETE
      await cargar(); // vuelvo a obtener la lista
    } catch (e) {
      setError(e.message || "Error al borrar");
    }
  };

  // Ir a la pantalla de edición, pasando el contacto por state
  const onEdit = (c) => {
    navigate(`/edit/${c.id}`, { state: { contact: c } });
  };

  // Cargar la lista de contactos
  useEffect(() => {
    cargar();
  }, []); // [] para que se ejecute solo una vez

  // Pintar la pantalla de contactos
  return (
    <main className="bg-light min-vh-100 py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h1 className="h4 m-0">📇 Contactos</h1>
              {/* Botón para ir a la pantalla de edición */}
              <Link to="/new" className="btn btn-success">
                Add new contact
              </Link>
            </div>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            {cargando && <div className="alert alert-info py-2">Cargando…</div>}

            {/* Lista de contactos (ContactCard encapsula avatar/datos/botones) */}
            <ul className="list-group list-group-flush mb-4">
              {contactos.map((c) => (
                <ContactCard
                  key={c.id ?? `${c.full_name}-${c.email}`}
                  contact={c}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}

              {/* Mensaje cuando no hay datos */}
              {!cargando && contactos.length === 0 && (
                <li className="list-group-item px-0 text-muted">
                  No hay contactos todavía.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Contact;
