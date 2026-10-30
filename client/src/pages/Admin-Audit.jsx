import { useEffect, useState } from "react";
import { api } from "../utils/api";

export const AdminAudit = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await api("/api/admin/audit");
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          setLogs(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error(error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="admin-users-section">
      <div className="container">
        <h1>Admin audit log</h1>
      </div>
      <div className="container admin-users">
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id}>
                <td>{log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}</td>
                <td>{log.actorEmail}</td>
                <td>{log.action}</td>
                <td>
                  {log.targetType} {log.targetId}
                </td>
                <td>{log.ip || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
