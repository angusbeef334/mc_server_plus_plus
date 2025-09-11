'use client'

import Link from "next/link";

interface ServerCardProps {
  name: string;
  id: string;
}

export default function ServerCard({name, id}: ServerCardProps) {
  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!confirm('Really delete server?')) return;

    const server = {
      "name": name
    }
    const res = await fetch(`/api/servers/${name}/server`, {
      method: "DELETE",
      body: JSON.stringify({server})
    });
    if (!res.ok) alert(`Failed to remove server: ${(await res.json()).error}`);
    else location.reload();
  }
  return (
    <Link href={`/servers/${id}`}>
      <div className="bg-gray-800 hover:bg-gray-700 rounded-md p-2 flex flex-row justify-between cursor-default">
        <span className="text-lg font-semibold">{name}</span>
        <button className="cursor-pointer" onClick={handleDelete}>
          <svg
            className="w-6 h-6 text-red-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 011-1h4a1 1 0 011 1m-7 0h8"
            />
          </svg>
        </button>
      </div>
    </Link>
  )
}