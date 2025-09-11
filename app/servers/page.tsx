'use client'

import { FormEvent, useState } from "react";
import { ServersGrid } from "../components/ServersGrid";

export default function Server() {
  const [addOpen, setAddOpen] = useState(false);
  const [addErr, setAddErr] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAddErr('');

    const name = (document.getElementById('in-name') as HTMLInputElement).value
    const directory = (document.getElementById('in-dir') as HTMLInputElement).value

    const server = {
      "name": name,
      "location": directory,
      "software": "paper",
      "version": "",
      "build": "0",
      "plugins": []
    };

    const res = await fetch(`/api/servers/SErver/server`, {
      method: "PATCH",
      body: JSON.stringify({server, param: '', action: 'add'})
    });

    if (!res.ok) setAddErr(`Error adding server: ${(await res.json()).error}`);
    else location.reload();
  };

  return (
    <div className="view bg-gray-900 w-screen h-screen">
      <header className="flex flex-row justify-between p-2 items-center">
        <h1 className="text-xl font-semibold">Servers</h1>
        <button className="bg-gray-800 p-2 rounded-md hover:bg-gray-700 font-semibold" onClick={() => setAddOpen(true)}>+</button>
      </header>
      <ServersGrid/>

      {addOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-h-[75vh] p-4 sm:p-6 w-full max-w-md relative border border-gray-700 mx-2">
            <button
              onClick={() => setAddOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h2 className="text-lg sm:text-xl mb-4 text-white">Add Server</h2>
            <form onSubmit={handleSubmit} className="flex flex-col">
              <input type="text" id="in-name" className="bg-gray-700 m-1 p-2 rounded-md w-full" placeholder="Name" required/>
              <input type="text" id="in-dir" className="bg-gray-700 m-1 p-2 rounded-md w-full" placeholder="Directory" required/>
              <input type="submit" className="bg-blue-600 m-1 p-2 rounded-md w-min" value="Add"/>
            </form>
            {addErr && (
              <label className="text-red-500">{addErr}</label>
            )}
          </div>
        </div>
      )}
    </div>
  )
}