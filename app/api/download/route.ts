import { NextResponse } from "next/server";

import { verifyCheckout } from "@/lib/verifyCheckout";

import fs from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        {
          error: "missing_session",
        },
        {
          status: 400,
        }
      );
    }

    const checkout = await verifyCheckout(sessionId);

    if (!checkout) {
      return NextResponse.json(
        {
          error: "unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const product = checkout.metadata?.product;

    let fileName = "";

    switch (product) {
      case "onboarding":
        fileName = "BOS Onboarding.zip";
        break;

      case "promotions":
        fileName = "BOS Promotions.zip";
        break;

      case "pricing":
        fileName = "BOS Pricing.zip";
        break;

      default:
        return NextResponse.json(
          {
            error: "unknown_product",
          },
          {
            status: 400,
          }
        );
    }

    const filePath = path.join(
      process.cwd(),
      "storage",
      "products",
      fileName
    );

    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "download_failed",
      },
      {
        status: 500,
      }
    );
  }
}