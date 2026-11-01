"use client";

export default function CandidateProfilePage({ params }: { params: { id: string } }) {
  return <h1 className="text-2xl font-semibold">Candidate #{params.id}</h1>;
}
