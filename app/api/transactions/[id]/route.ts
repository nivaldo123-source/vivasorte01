import { type NextRequest, NextResponse } from "next/server"

interface SunizeTransactionStatusResponse {
  id: string
  status: string
  [key: string]: any
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const transactionId = params.id

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 })
    }

    // Get Sunize credentials from environment
    const sunizeKey = process.env.SUNIZE_KEY
    const sunizeSecret = process.env.SUNIZE_SECRET

    if (!sunizeKey || !sunizeSecret) {
      console.error("Missing Sunize credentials in environment variables")
      return NextResponse.json({ error: "Payment service configuration error" }, { status: 500 })
    }

    console.log("[v0] Checking transaction status:", transactionId)

    // Call Sunize API to get transaction status
    const sunizeResponse = await fetch(`https://api.sunize.com.br/v1/transactions/${transactionId}`, {
      method: "GET",
      headers: {
        "x-api-key": sunizeKey,
        "x-api-secret": sunizeSecret,
      },
    })

    if (!sunizeResponse.ok) {
      const errorText = await sunizeResponse.text()
      console.error("[v0] Sunize API error:", {
        status: sunizeResponse.status,
        statusText: sunizeResponse.statusText,
        body: errorText,
      })
      return NextResponse.json({ error: "Payment service error" }, { status: 500 })
    }

    const sunizeData: SunizeTransactionStatusResponse = await sunizeResponse.json()

    console.log("[v0] Transaction status:", {
      id: sunizeData.id,
      status: sunizeData.status,
    })

    // Return relevant status data to frontend
    return NextResponse.json({
      id: sunizeData.id,
      status: sunizeData.status,
      raw: sunizeData,
    })
  } catch (error) {
    console.error("[v0] Error checking transaction status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
