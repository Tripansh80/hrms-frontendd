"use client";

export default function WorkflowDetailPage({ params }: { params: { id: string } }) {
  return <h1 className="text-2xl font-semibold">Workflow #{params.id}</h1>;
}
