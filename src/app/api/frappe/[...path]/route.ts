/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: any) {
  const params = await context.params;
  return proxyToFrappe(request, params.path as string[]);
}

export async function POST(request: NextRequest, context: any) {
  const params = await context.params;
  return proxyToFrappe(request, params.path as string[]);
}

export async function PUT(request: NextRequest, context: any) {
  const params = await context.params;
  return proxyToFrappe(request, params.path as string[]);
}

export async function DELETE(request: NextRequest, context: any) {
  const params = await context.params;
  return proxyToFrappe(request, params.path as string[]);
}

export async function PATCH(request: NextRequest, context: any) {
  const params = await context.params;
  return proxyToFrappe(request, params.path as string[]);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}
// again chekc with new url
async function proxyToFrappe(request: NextRequest, pathSegments: string[]) {
  const frappeBaseUrl =
    process.env.FRAPPE_SERVER_URL || "http://erp.ozerpan.com.tr:8002";
  const path = pathSegments.join("/");
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();
  const frappeUrl = `${frappeBaseUrl}/${path}${
    queryString ? `?${queryString}` : ""
  }`;

  console.log("Proxying request to:", frappeUrl);
  console.log("Request method:", request.method);

  const headers: Record<string, string> = {};

  // Copy relevant headers from the original request
  request.headers.forEach((value, key) => {
    // Exclude host and origin headers that could cause issues
    if (!["host", "origin", "referer"].includes(key.toLowerCase())) {
      headers[key] = value;
    }
  });

  // Log cookie header for debugging
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    console.log("Cookie header present:", cookieHeader.substring(0, 100) + "...");
  } else {
    console.warn("No cookie header found in request");
  }

  try {
    const body =
      request.method !== "GET" && request.method !== "HEAD"
        ? await request.text()
        : undefined;

    const response = await fetch(frappeUrl, {
      method: request.method,
      headers,
      body,
    });

    console.log(`Frappe API response status: ${response.status} ${response.statusText}`);

    const responseText = await response.text();

    // Log error response for debugging
    if (!response.ok) {
      console.error(`Frappe API error (${response.status}):`, {
        url: frappeUrl,
        status: response.status,
        statusText: response.statusText,
        responsePreview: responseText.substring(0, 500),
      });
    }

    // Create response headers
    const responseHeaders: Record<string, string> = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
      "Access-Control-Allow-Credentials": "true",
    };

    // Copy content-type from the original response
    const contentType = response.headers.get("Content-Type");
    if (contentType) {
      responseHeaders["Content-Type"] = contentType;
    }

    // Copy set-cookie headers for authentication
    // Ancak system_user=no cookie'sini ignore et (bizim authentication sistemimizi bozmasın)
    const setCookie = response.headers.get("Set-Cookie");
    if (setCookie) {
      // Eğer system_user=no içeriyorsa, ignore et
      if (!setCookie.includes("system_user=no")) {
        responseHeaders["Set-Cookie"] = setCookie;
      } else {
        console.warn("Frappe'den gelen system_user=no cookie'si ignore edildi");
      }
    }

    return new NextResponse(responseText, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Proxy Error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
