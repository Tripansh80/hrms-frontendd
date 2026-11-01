"use client";

export default function ApplicationDetailPage({ params }: { params: { id: string } }) {
  return <h1 className="text-2xl font-semibold">Application #{params.id}</h1>;
}
