import { useState, useEffect, useRef } from "react";
import { AnsiUp } from 'ansi_up';

interface ServerViewProps {
  server: any;
}

export default function ServerView({server}: ServerViewProps) {
  const [log, setLog] = useState("");
  const [status, setStatus] = useState("Offline")
  const textareaRef = useRef<HTMLPreElement | null>(null);
  const bottomRef = useRef(true);

  const ansiUp = new AnsiUp();

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const textarea = textareaRef.current;
        if (textarea) {
          bottomRef.current = textarea.scrollHeight - textarea.scrollTop - textarea.clientHeight < 5;
        }
        const res = await fetch(`/api/servers/${server.name}/server?action=log`);
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
    const textarea = textareaRef.current;
    if (textarea && bottomRef.current) {
      textarea.scrollTop = textarea.scrollHeight;
    }
  }, [log]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/servers/${server.name}/server?action=status`);
        const data = await res.json();
        setStatus(data.status);
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

  const handleStartServer = async () => {
    if (status == 'Offline') {
      try {
        const res = await fetch(`/api/servers/${server.name}/server?action=start`, {
          method: 'GET'
        });
        if (!res.ok) {
          alert(`error starting server: ${(await res.json()).message}`)
        }
      } catch (e) {
        alert(`error starting server: ${e}`);
      }
    } else {
      try {
        const res = await fetch(`/api/servers/${server.name}/server?action=stop`, {
          method: 'GET'
        });
        if (!res.ok) {
          alert(`error stopping server: ${(await res.json()).message}`)
        }
      } catch (e) {
        alert(`error stopping server: ${e}`)
      }
    }
  }

  return (
    <div className="view bg-gray-900 min-h-screen h-screen w-[90%] overflow-hidden">
      <div className="flex flex-row h-[90%]">
        <div className="flex flex-col w-[70%] h-[80%]">
          <pre
            id="textarea-log"
            ref={textareaRef}
            className="bg-black overflow-auto"
            style={{ fontFamily: 'Source Code Pro, monospace', height: '90%' }}
            dangerouslySetInnerHTML={{ __html: ansiUp.ansi_to_html(log) }}
          />
          <input
            type="text"
            className="bg-gray-800 p-2 rounded-md"
            placeholder=">"
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                const target = (e.target as HTMLInputElement);
                const command = target.value;
                target.value = '';
                const res = await fetch(`/api/servers/${server.name}/server`, {
                  method: "POST",
                  body: JSON.stringify({ server, cmd: command })
                })

                if (!res.ok) {
                  alert(`Failed to send command: ${res.statusText}`);
                }
              }
            }}
          />
        </div>
        <div className="p-4 m-2 flex flex-col justify-start h-full">
          <h3 className="text-lg font-semibold text-white">Status</h3>
          <label>{status}</label>
          <button 
            className="p-2 m-2 bg-gray-800 rounded-md hover:bg-gray-700"
            onClick={handleStartServer}
          >
            {status == "Online" && (
              <>Stop</>
            ) || (
              <>Start</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}