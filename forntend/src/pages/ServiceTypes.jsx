import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./ServiceTypes.css";

export default function ServiceTypes() {
    const navigate = useNavigate();

    const [services, setServices] = useState([]); // ALWAYS array
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;

        const loadServices = async () => {
            try {
                const res = await api.get("/history/service-type/");
                if (mounted) {
                    setServices(Array.isArray(res.data) ? res.data : []);
                    setError("");
                }
            } catch {
                if (mounted) {
                    setError("Failed to load service types");
                    setServices([]);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadServices();

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div className="service-page">
            <header className="service-header">
                <h1>Service Types</h1>
                <p>Monthly usage overview</p>
            </header>

            {loading && <p className="muted">Loading...</p>}
            {error && <p className="error">{error}</p>}

            {!loading && !error && (
                <div className="service-grid">
                    {services.length === 0 && (
                        <div className="empty">No service types found</div>
                    )}

                    {services.map((service) => (
                        <div key={service.id} className="service-card">
                            <div className="service-name">
                                {service.type_of_work}
                            </div>

                            <div className="used-count">
                                <span>{service.used ?? 0}</span>
                                <small>used this month</small>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="bottom-actions">
                <button onClick={() => navigate("/dashboard")}>
                    ← Back to Dashboard
                </button>
            </div>
        </div>
    );
}
