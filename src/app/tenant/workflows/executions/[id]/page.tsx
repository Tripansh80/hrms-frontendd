"use client";

export default function ExecutionDetailPage({ params }: { params: { id: string } }) {
  return <h1 className="text-2xl font-semibold">Execution #{params.id}</h1>;
}
