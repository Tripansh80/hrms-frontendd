"use client";

export default function PolicyDetailPage({ params }: { params: { id: string } }) {
  return <h1 className="text-2xl font-semibold">Policy #{params.id}</h1>;
}
