'use client'

import Link from "next/link";

interface ServerCardProps {
  name: string;
  id: string;
}

export default function ServerCard({name, id}: ServerCardProps) {
  return (
    <Link href={`/servers/${id}`}>
      <div className="bg-gray-800 hover:bg-gray-700 rounded-md p-2">
        <span className="text-lg font-semibold">{name}</span>
      </div>
    </Link>
  )
}