"use client";

export default function JobPipelinePage({ params }: { params: { id: string } }) {
  return <h1 className="text-2xl font-semibold">Job Pipeline #{params.id}</h1>;
}
