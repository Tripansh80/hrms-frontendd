import { NextRequest, NextResponse } from "next/server";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost";
const INTERNAL_BACKEND = process.env.API_INTERNAL_URL || "http://127.0.0.1:8000";

async function proxyRequest(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/");
  const host = req.headers.get("host") || req.nextUrl.host;
  
  // Next.js/dev proxies can preserve the browser host in either forwarded
  // headers or the request URL, even when `Host` is rewritten to localhost.
  // Use those values too so the backend receives the workspace host.
  let slug = req.headers.get("x-tenant-slug");
  if (!slug) {
    const candidateHosts = [
      req.headers.get("x-forwarded-host"),
      req.headers.get("x-original-host"),
      host,
      req.nextUrl.hostname,
      req.headers.get("referer"),
    ];

    for (const candidate of candidateHosts) {
      if (!candidate) continue;

      let candidateHost = candidate.split(",", 1)[0].trim();
      try {
        if (candidateHost.includes("://")) {
          candidateHost = new URL(candidateHost).hostname;
        }
      } catch {
        continue;
      }

      const hostWithoutPort = candidateHost.split(":")[0].toLowerCase();
      if (hostWithoutPort.endsWith(`.${BASE_DOMAIN}`)) {
        slug = hostWithoutPort.slice(0, -(BASE_DOMAIN.length + 1));
        break;
      }
    }
  }

  // Determine backend URL
  // If we have a tenant slug, pass Host header to FastAPI as {slug}.localhost:8000
  const backendHost = slug ? `${slug}.${BASE_DOMAIN}:8000` : `localhost:8000`;
  const queryString = req.nextUrl.search;
  const targetUrl = `${INTERNAL_BACKEND}/${path}${queryString}`;

  // Forward headers
  const forwardHeaders = new Headers();
  forwardHeaders.set("Content-Type", req.headers.get("content-type") || "application/json");
  forwardHeaders.set("Accept", req.headers.get("accept") || "*/*");
  forwardHeaders.set("Host", backendHost);
  if (slug) {
    forwardHeaders.set("X-Tenant-Slug", slug);
  }
  forwardHeaders.set("X-Forwarded-Host", host);
  forwardHeaders.set("X-Forwarded-Proto", req.nextUrl.protocol.replace(":", ""));

  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    forwardHeaders.set("Authorization", authHeader);
  }

  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    forwardHeaders.set("Cookie", cookieHeader);
  }

  let body: ArrayBuffer | undefined = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.arrayBuffer();
  }

  try {
    // Use Node's HTTP client here: Undici (used by fetch) overwrites the Host
    // header with the internal API hostname, which makes FastAPI treat tenant
    // requests as root-domain requests.
    const target = new URL(targetUrl);
    const transport = target.protocol === "https:" ? httpsRequest : httpRequest;
    const backendRes = await new Promise<import("node:http").IncomingMessage>((resolve, reject) => {
      const backendReq = transport(
        target,
        {
          method: req.method,
          headers: Object.fromEntries(forwardHeaders.entries()),
        },
        resolve
      );
      backendReq.on("error", reject);
      if (body) backendReq.write(Buffer.from(body));
      backendReq.end();
    });

    const responseChunks: Buffer[] = [];
    for await (const chunk of backendRes) {
      responseChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const resData = Buffer.concat(responseChunks);
    const resHeaders = new Headers();

    for (const [key, value] of Object.entries(backendRes.headers)) {
      // Don't forward transfer-encoding or content-encoding as Next handles it
      if (["transfer-encoding", "content-encoding", "content-length"].includes(key.toLowerCase()) || value == null) {
        continue;
      }
      for (const headerValue of Array.isArray(value) ? value : [value]) {
        resHeaders.append(key, headerValue);
      }
    }

    return new NextResponse(resData, {
      status: backendRes.statusCode || 502,
      headers: resHeaders,
    });
  } catch (err: any) {
    console.error(`[API Proxy Error] Failed to proxy ${req.method} ${targetUrl}:`, err.message);
    return NextResponse.json(
      {
        detail: `Cannot connect to backend server at ${targetUrl}. Please ensure FastAPI is running on port 8000.`,
        error: { message: err.message, target: targetUrl },
      },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
