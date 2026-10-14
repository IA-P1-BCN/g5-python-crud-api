import { useState } from "react";
import es from "../../../i18n/es.js";
import Alert from "../../../shared/ui/Alert.jsx";
import Spinner from "../../../shared/ui/Spinner.jsx";
import { RoomForm } from "../components/RoomForm";
import { RoomsTable } from "../components/RoomsTable";
import { useAdminRooms } from "../hooks/useAdminRooms";
import { DUPLICATE_SLUG_ERROR } from "../model/errors";

export function AdminRoomsPage() {
  const { rooms, loading, error, saveRoom, toggleActive } = useAdminRooms();
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (values) => {
    setApiError(null);
    setSuccess(null);
    try {
      await saveRoom(values);
      setSuccess(es.adminRooms.createSuccess);
    } catch (err) {
      const code = err?.response?.data?.error;
      setApiError(code === DUPLICATE_SLUG_ERROR ? DUPLICATE_SLUG_ERROR : err?.message);
    }
  };

  const handleToggleActive = async (id, active) => {
    setApiError(null);
    try {
      await toggleActive(id, active);
    } catch (err) {
      setApiError(err?.message);
    }
  };

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="heading-hero text-text mb-6">{es.adminRooms.title}</h1>

      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      <RoomForm onSubmit={handleSubmit} apiError={apiError} />

      <div className="mt-6">
        {loading ? <Spinner label="Cargando salas..." /> : (
          <RoomsTable rooms={rooms} onToggleActive={handleToggleActive} />
        )}
      </div>
    </main>
  );
}

export default AdminRoomsPage;
