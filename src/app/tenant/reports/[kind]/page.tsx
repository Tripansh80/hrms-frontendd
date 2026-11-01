"use client";

export default function ReportPage({ params }: { params: { kind: string } }) {
  return <h1 className="text-2xl font-semibold">Report: {params.kind}</h1>;
}
