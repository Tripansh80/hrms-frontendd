"use client";

export default function RoleDetailPage({ params }: { params: { id: string } }) {
  return <h1 className="text-2xl font-semibold">Role #{params.id}</h1>;
}
