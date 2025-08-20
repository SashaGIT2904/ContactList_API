// Página AddContact: crea o edita un contacto según haya "id" en la URL.
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { getContacts, upsertContact } from "../api.js";

// Estado inicial del formulario
const emptyForm = { full_name: "", email: "", phone: "", address: "" };

const AddContact = () => {
  // Si hay :id en la ruta => estamos editando
  const { id } = useParams();
  const navigate = useNavigate();
  // Si venimos desde la lista, puede llegar el contacto en location.state
  const location = useLocation();
  const fromState = location.state?.contact;

  // Form, flags de envío y error
  const [form, setForm] = useState(emptyForm);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  // Al montar: prefillea el formulario
  // 1) si venía en state (navegación desde la lista), úsalo
  // 2) si recargaron /edit/:id, busca el contacto en la API por id
  useEffect(() => {
    const load = async () => {
      if (fromState) {
        setForm({
          full_name: fromState.full_name || "",
          email: fromState.email || "",
          phone: fromState.phone || "",
          address: fromState.address || "",
        });
      } else if (id) {
        try {
          const list = await getContacts();
          const c = list.find((x) => String(x.id) === String(id));
          if (c) {
            setForm({
              full_name: c.full_name || "",
              email: c.email || "",
              phone: c.phone || "",
              address: c.address || "",
            });
          }
        } catch (e) {
          setError(e.message || "No se pudo cargar el contacto");
        }
      }
    };
    load();
  }, [id, fromState]);

  // Actualiza el form controlado
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Guardar: valida duplicado por email y delega en upsertContact (POST/PUT)
  const onSubmit = async (e) => {
    e.preventDefault();
    if (enviando) return;
    setError("");
    setEnviando(true);

    try {
      // Evita 422 por email repetido en la agenda
      const existentes = await getContacts();
      const yaExiste = existentes.some(
        (c) =>
          (c.email || "").toLowerCase() ===
            (form.email || "").trim().toLowerCase() &&
          String(c.id) !== String(id || "")
      );
      if (yaExiste)
        throw new Error("Ya existe un contacto con ese email en esta agenda.");

      await upsertContact(form, id); // crea si no hay id, actualiza si hay id
      navigate("/"); // vuelve a la lista
    } catch (e) {
      setError(e.message || "No se pudo guardar");
    } finally {
      setEnviando(false);
    }
  };

  // UI: tarjeta con formulario y feedback básico
  return (
    <main className="bg-light min-vh-100 py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card shadow-sm border-0">
              <div className="card-body p-4">
                <h2 className="h3 text-center mb-4">
                  {id ? "Edit contact" : "Add a new contact"}
                </h2>

                {/* Mensaje de error si algo falla */}
                {error && (
                  <div className="alert alert-danger py-2">{error}</div>
                )}

                <form onSubmit={onSubmit} noValidate>
                  <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input
                      name="full_name"
                      className="form-control"
                      value={form.full_name}
                      onChange={onChange}
                      placeholder="Ada Lovelace"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      name="email"
                      type="email"
                      className="form-control"
                      value={form.email}
                      onChange={onChange}
                      placeholder="ada@ejemplo.com"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Phone</label>
                    <input
                      name="phone"
                      className="form-control"
                      value={form.phone}
                      onChange={onChange}
                      placeholder="+34 600 123 123"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label">Address</label>
                    <input
                      name="address"
                      className="form-control"
                      value={form.address}
                      onChange={onChange}
                      placeholder="Calle Falsa 123, Madrid"
                      required
                    />
                  </div>

                  {/* Botón principal con estado de envío */}
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={enviando}
                  >
                    {enviando ? "Saving…" : "save"}
                  </button>

                  {/* Enlace para volver a la lista */}
                  <div className="mt-2 text-center">
                    <Link to="/">or get back to contacts</Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AddContact;
