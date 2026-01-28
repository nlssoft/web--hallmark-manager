import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./ServiceTypes.css";

export default function ServiceTypes() {
    const navigate = useNavigate();

    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get("/history/service-type/")
            .then(res => {
                setServices(res.data);
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to load service types");
                setLoading(false);
            });
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
                    {services.map(service => (
                        <div key={service.id} className="service-card">
                            <h3>{service.type_of_work}</h3>
                            <div className="used-count">
                                <span>{service.used}</span>
                                <small>used this month</small>
                            </div>
                        </div>
                    ))}

                    {services.length === 0 && (
                        <div className="empty">
                            No service types found
                        </div>
                    )}
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
