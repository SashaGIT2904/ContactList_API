// Home.jsx
import React, { useEffect, useState } from "react";

/** ====== Config ====== **/
const API = "https://playground.4geeks.com/contact";
const AGENDA = "sasha1"; // cambia el slug si lo necesitas

const Home = () => {
  /** ====== Estado ====== **/
  const [contactos, setContactos] = useState([]);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [buscando, setBuscando] = useState(false); // carga de lista
  const [enviando, setEnviando] = useState(false); // POST/PUT/DELETE
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null); // null = creando

  /** ====== Utils ====== **/
  // Lee el cuerpo de error (JSON o texto) para entender el 422
  const readError = async (res) => {
    try {
      const data = await res.json();
      // Intenta normalizar mensajes comunes
      if (typeof data === "string") return data;
      if (data?.msg) return data.msg;
      if (data?.detail)
        return Array.isArray(data.detail)
          ? data.detail.join(", ")
          : data.detail;
      return JSON.stringify(data);
    } catch {
      try {
        return await res.text();
      } catch {
        return "Error desconocido";
      }
    }
  };

  // Limpia el formulario
  const resetForm = () => {
    setForm({ full_name: "", email: "", phone: "", address: "" });
    setEditingId(null);
  };

  /** ====== API Calls ====== **/
  // Crea la agenda si no existe
  const crearAgenda = async () => {
    const res = await fetch(`${API}/agendas/${AGENDA}`, { method: "POST" });
    return res.ok; // si ya existe, puede no ser ok; lo toleramos
  };

  // Carga la lista de contactos; si la agenda no existe, la crea y reintenta
  const cargarContactos = async () => {
    setBuscando(true);
    setError("");
    try {
      const res = await fetch(`${API}/agendas/${AGENDA}/contacts`, {
        method: "GET",
        headers: { accept: "application/json" },
      });

      if (!res.ok) {
        // Intento de recuperación: crea agenda y reintenta una vez
        await crearAgenda();
        const res2 = await fetch(`${API}/agendas/${AGENDA}/contacts`, {
          headers: { accept: "application/json" },
        });
        if (!res2.ok) throw new Error(await readError(res2));
        const data2 = await res2.json();
        setContactos(Array.isArray(data2) ? data2 : data2.contacts || []);
      } else {
        const data = await res.json();
        setContactos(Array.isArray(data) ? data : data.contacts || []);
      }
    } catch (e) {
      setError(e.message || "No se pudo cargar la agenda.");
    } finally {
      setBuscando(false);
    }
  };

  // Crea contacto
  const crearContacto = async (form) => {
    setError("");
    setEnviando(true);

    const payload = {
      name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.replace(/\s+/g, ""),
      address: form.address.trim(),
      agenda_slug: AGENDA,
    };

    // Validaciones mínimas para evitar 422
    if (!payload.name || !payload.email || !payload.phone || !payload.address) {
      setError("Todos los campos son obligatorios.");
      setEnviando(false);
      return;
    }
    if (!/\S+@\S+\.\S+/.test(payload.email)) {
      setError("Email no válido.");
      setEnviando(false);
      return;
    }

    try {
      const res = await fetch(`${API}/agendas/${AGENDA}/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const texto = await res.text();
        console.error("POST /contacts ->", res.status, texto);
        throw new Error(texto || "No se pudo crear el contacto.");
      }

      await cargarContactos();
      resetForm();
    } catch (e) {
      setError(e.message || "Error creando el contacto.");
    } finally {
      setEnviando(false);
    }
  };

  // Actualiza contacto
  const actualizarContacto = async (id, payload) => {
    setError("");
    setEnviando(true);
    try {
      const res = await fetch(`${API}/agendas/${AGENDA}/contacts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ ...payload, agenda_slug: AGENDA }),
      });

      if (!res.ok) {
        const msg = await readError(res);
        throw new Error(msg || "No se pudo actualizar el contacto.");
      }

      await cargarContactos();
      resetForm();
    } catch (e) {
      setError(e.message || "Error actualizando el contacto.");
    } finally {
      setEnviando(false);
    }
  };

  // Borra contacto
  const borrarContacto = async (id) => {
    if (!id) return;
    if (!window.confirm("¿Seguro que quieres borrar este contacto?")) return;

    setError("");
    setEnviando(true);
    try {
      const res = await fetch(`${API}/agendas/${AGENDA}/contacts/${id}`, {
        method: "DELETE",
        headers: { accept: "application/json" },
      });

      if (!res.ok) {
        const msg = await readError(res);
        throw new Error(msg || "No se pudo borrar el contacto.");
      }

      await cargarContactos();
    } catch (e) {
      setError(e.message || "Error borrando el contacto.");
    } finally {
      setEnviando(false);
    }
  };

  /** ====== Handlers ====== **/
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (enviando) return;

    if (editingId) {
      // Construye el payload para actualizar
      const payload = {
        name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      };
      await actualizarContacto(editingId, payload);
    } else {
      // Pasa el form original para crear
      await crearContacto(form);
    }
  };

  const cargarParaEditar = (c) => {
    setForm({
      full_name: c.name || "", // <-- CAMBIO AQUÍ
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
    });
    setEditingId(c.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** ====== Efectos ====== **/
  useEffect(() => {
    cargarContactos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ====== Render ====== **/
  return (
    <main className="bg-light min-vh-100 py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">
            <div className="card shadow-sm border-0">
              <div className="card-body p-4">
                {/* Título */}
                <h1 className="h4 mb-4 d-flex align-items-center">
                  <span className="me-2">📇 Contactos de “{AGENDA}”</span>
                  <span className="badge bg-secondary">{contactos.length}</span>
                </h1>

                {/* Estados y errores */}
                {error && (
                  <div className="alert alert-danger py-2" role="alert">
                    {error}
                  </div>
                )}
                {buscando && (
                  <div className="alert alert-info py-2" role="alert">
                    Cargando contactos…
                  </div>
                )}

                {/* Lista */}
                <ul className="list-group list-group-flush mb-4">
                  {contactos.map((c) => (
                    <li
                      key={c.id ?? `${c.full_name}-${c.email}`}
                      className="list-group-item d-flex align-items-center justify-content-between px-0"
                    >
                      <div className="me-3">
                        <div className="fw-semibold">
                          {c.full_name || c.name}
                        </div>{" "}
                        {/* <-- aquí */}
                        <div className="small text-muted">
                          📧 {c.email} &nbsp;|&nbsp; ☎️ {c.phone || "—"}{" "}
                          &nbsp;|&nbsp; 📍 {c.address || "—"}
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => cargarParaEditar(c)}
                          disabled={enviando}
                          title="Editar"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => borrarContacto(c.id)}
                          disabled={enviando}
                          title="Eliminar"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </li>
                  ))}
                  {!buscando && contactos.length === 0 && (
                    <li className="list-group-item px-0 text-muted">
                      No hay contactos todavía. ¡Crea el primero!
                    </li>
                  )}
                </ul>

                {/* Formulario */}
                <form onSubmit={onSubmit} noValidate>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label
                        className="form-label fw-semibold"
                        htmlFor="full_name"
                      >
                        Nombre completo *
                      </label>
                      <input
                        id="full_name"
                        name="full_name"
                        className="form-control"
                        value={form.full_name}
                        onChange={onChange}
                        placeholder="Ada Lovelace"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" htmlFor="email">
                        Email *
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        className="form-control"
                        value={form.email}
                        onChange={onChange}
                        placeholder="ada@ejemplo.com"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" htmlFor="phone">
                        Teléfono *
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        className="form-control"
                        value={form.phone}
                        onChange={onChange}
                        placeholder="+34 600 123 123"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label
                        className="form-label fw-semibold"
                        htmlFor="address"
                      >
                        Dirección *
                      </label>
                      <input
                        id="address"
                        name="address"
                        className="form-control"
                        value={form.address}
                        onChange={onChange}
                        placeholder="Calle Falsa 123, Madrid"
                        required
                      />
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2 mt-3">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={enviando}
                    >
                      {editingId
                        ? enviando
                          ? "Actualizando…"
                          : "Actualizar contacto"
                        : enviando
                        ? "Guardando…"
                        : "Guardar contacto"}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={resetForm}
                        disabled={enviando}
                      >
                        Cancelar edición
                      </button>
                    )}
                    <span className="form-text">
                      Los campos con * son obligatorios.
                    </span>
                  </div>
                </form>
              </div>
            </div>

            <div className="my-3" />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;
