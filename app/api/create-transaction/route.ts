import { type NextRequest, NextResponse } from "next/server"

interface OrderbumpData {
  id: string
  title: string
  description: string
  price: number
  extraTitles: number
}

interface SunizeTransactionRequest {
  external_id: string
  total_amount: number
  payment_method: string
  items: Array<{
    id: string
    title: string
    description: string
    price: number
    quantity: number
    is_physical: boolean
  }>
  ip: string
  customer: {
    name: string
    email: string
    phone: string
    document_type: string
    document: string
  }
}

interface SunizeTransactionResponse {
  id: string
  status: string
  total_value: number
  payment_method: string
  pix: {
    payload: string
    expires_at?: string
  }
  [key: string]: any
}

function validateUtmData(utmData: any) {
  return {
    utm_source: utmData?.utm_source || "direct",
    utm_medium: utmData?.utm_medium || "direct",
    utm_campaign: utmData?.utm_campaign || "direct",
    utm_content: utmData?.utm_content || "direct",
    utm_term: utmData?.utm_term || "direct",
  }
}

export async function POST(request: NextRequest) {
  try {
    const sunizeKey = "ck_5dcff3d411d66b49b0d4493af46cb621"
    const sunizeSecret = "cs_6a6ffd67144c133071aa7eafc3fb664"

    const body = await request.json()
    const {
      quantity,
      totalPrice,
      selectedOrderbumps = [],
      finalTotal,
      finalQuantity,
      name,
      email,
      phone,
      utmData,
    } = body

    if (!name || !email || !phone) {
      return NextResponse.json({ error: "Nome, email e telefone são obrigatórios" }, { status: 400 })
    }

    const items = [
      {
        id: "titulo-principal",
        title: "Compra de Títulos - Plano Principal",
        description: `Compra de ${quantity} títulos`,
        price: totalPrice,
        quantity: 1,
        is_physical: false,
      },
    ]

    // Add orderbump items to the items array
    selectedOrderbumps.forEach((orderbump: OrderbumpData, index: number) => {
      items.push({
        id: orderbump.id,
        title: orderbump.title,
        description: orderbump.description,
        price: orderbump.price,
        quantity: 1,
        is_physical: false,
      })
    })

    const formattedPhone = phone.startsWith("+55") ? phone : `+55${phone.replace(/\D/g, "")}`
    const externalId = `transaction-${Date.now()}`
    const amountInCentavos = Math.round((finalTotal || totalPrice) * 100)

    const sunizeRequest: SunizeTransactionRequest = {
      external_id: externalId,
      total_amount: finalTotal || totalPrice,
      payment_method: "PIX",
      items,
      ip: "127.0.0.1",
      customer: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: formattedPhone,
        document_type: "CPF",
        document: "20264830106", // Keep hardcoded for now as requested
      },
    }

    console.log("[v0] Creating Sunize transaction with user data:", {
      external_id: sunizeRequest.external_id,
      total_amount: sunizeRequest.total_amount,
      items_count: sunizeRequest.items.length,
      customer_name: sunizeRequest.customer.name,
      customer_email: sunizeRequest.customer.email,
    })

    // Call Sunize API
    const sunizeResponse = await fetch("https://api.sunize.com.br/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": sunizeKey,
        "x-api-secret": sunizeSecret,
      },
      body: JSON.stringify(sunizeRequest),
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

    const sunizeData: SunizeTransactionResponse = await sunizeResponse.json()

    console.log("[v0] Sunize transaction created:", {
      id: sunizeData.id,
      status: sunizeData.status,
      has_pix: !!sunizeData.pix,
    })

    if (utmData) {
      const validatedUtmData = validateUtmData(utmData)

      const utmifyData = {
        orderId: sunizeData.id,
        externalId: externalId,
        priceInCents: amountInCentavos,
        status: "waiting_payment",
        trackingParameters: validatedUtmData,
        commission: {
          value: 0,
          type: "percentage",
        },
        products: items.map((item) => ({
          id: item.id,
          name: item.title,
          price: Math.round(item.price * 100),
          quantity: item.quantity,
        })),
        customer: {
          name: sunizeRequest.customer.name,
          email: sunizeRequest.customer.email,
          phone: sunizeRequest.customer.phone,
          document: sunizeRequest.customer.document,
        },
      }

      // Fire-and-forget UTMfy API call
      fetch("https://api.utmify.com.br/api-credentials/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-token": "8z16m5xwzRlUmzAxMWuMdkPkeUS0G9eIddyf",
        },
        body: JSON.stringify(utmifyData),
      }).catch((error) => {
        console.error("[v0] UTMfy API error (fire-and-forget):", error)
      })

      console.log("[v0] UTMfy data sent:", {
        orderId: utmifyData.orderId,
        priceInCents: utmifyData.priceInCents,
        utm_source: validatedUtmData.utm_source,
      })
    }

    return NextResponse.json({
      transactionId: sunizeData.id,
      pixPayload: sunizeData.pix.payload,
      raw: sunizeData,
    })
  } catch (error) {
    console.error("[v0] Error creating transaction:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
