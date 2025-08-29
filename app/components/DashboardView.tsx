import { useState, useEffect } from "react";

interface ServerViewProps {
  server: any;
}

export default function ServerView({server}: ServerViewProps) {
  const [log, setLog] = useState("");
  const [status, setStatus] = useState("Offline")

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const res = await fetch(`/api/servers/${server.name}/logs/latest`);
        const data = await res.json();
        setLog(data.log);
      } catch {
        setLog("Failed to load log");
      }
    };
    fetchLog();
    const interval = setInterval(fetchLog, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/servers/${server.name}/status`);
        const data = await res.json();
        setStatus(data.status? "Online" : "Offline");
      } catch {
        setStatus("Offline · Error");
      }
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  if (typeof document !== "undefined") {
    const link1 = document.createElement("link");
    link1.rel = "preconnect";
    link1.href = "https://fonts.googleapis.com";
    document.head.appendChild(link1);

    const link2 = document.createElement("link");
    link2.rel = "preconnect";
    link2.href = "https://fonts.gstatic.com";
    link2.crossOrigin = "anonymous";
    document.head.appendChild(link2);

    const link3 = document.createElement("link");
    link3.rel = "stylesheet";
    link3.href = "https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&display=swap";
    document.head.appendChild(link3);
  }

  return (
    <div className="view bg-gray-900">
      <div className="flex flex-row">
        <textarea readOnly className="bg-black w-[50%] h-96" style={{ fontFamily: 'Source Code Pro, monospace' }} value={log}/>
        <div className="p-4 m-2">
          <h3 className="text-lg font-semibold text-white">Status</h3>
          <label>{status}</label>
        </div>
      </div>
    </div>
  )
}