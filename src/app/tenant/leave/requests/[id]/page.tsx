"use client";

export default function LeaveRequestDetailPage({ params }: { params: { id: string } }) {
  return <h1 className="text-2xl font-semibold">Leave Request #{params.id}</h1>;
}
