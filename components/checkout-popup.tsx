"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Copy, CheckCircle, Loader2, QrCode } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

interface CheckoutPopupProps {
  isOpen: boolean
  onClose: () => void
  quantity: number
  totalPrice: number
}

interface Orderbump {
  id: string
  title: string
  description: string
  originalPrice: number
  discountPrice: number
  discount: string
  extraTitles: number
}

interface TransactionResponse {
  transactionId: string
  pixPayload: string
  raw: any
}

interface TransactionStatus {
  status: string
  id: string
}

const orderbumps: Orderbump[] = [
  {
    id: "orderbump-1",
    title: "COMPRE + 15 TÍTULOS COM 30% DE DESCONTO",
    description: "15 títulos extras",
    originalPrice: 14.85,
    discountPrice: 10.4,
    discount: "30% OFF",
    extraTitles: 15,
  },
  {
    id: "orderbump-2",
    title: "COMPRE + 30 TÍTULOS COM 30% DE DESCONTO",
    description: "30 títulos extras",
    originalPrice: 19.7,
    discountPrice: 13.79,
    discount: "30% OFF",
    extraTitles: 30,
  },
  {
    id: "orderbump-3",
    title: "COMPRE + 60 TÍTULOS COM 50% DE DESCONTO",
    description: "60 títulos extras",
    originalPrice: 59.4,
    discountPrice: 29.7,
    discount: "50% OFF",
    extraTitles: 60,
  },
]

export default function CheckoutPopup({ isOpen, onClose, quantity, totalPrice }: CheckoutPopupProps) {
  const [step, setStep] = useState<"form" | "qr" | "success" | "error">("form")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [transactionData, setTransactionData] = useState<TransactionResponse | null>(null)
  const [error, setError] = useState<string>("")

  const [selectedOrderbumps, setSelectedOrderbumps] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  })

  const calculateFinalTotal = () => {
    const orderbumpTotal = selectedOrderbumps.reduce((sum, orderbumpId) => {
      const orderbump = orderbumps.find((ob) => ob.id === orderbumpId)
      return sum + (orderbump?.discountPrice || 0)
    }, 0)
    return totalPrice + orderbumpTotal
  }

  const calculateExtraTitles = () => {
    return selectedOrderbumps.reduce((sum, orderbumpId) => {
      const orderbump = orderbumps.find((ob) => ob.id === orderbumpId)
      return sum + (orderbump?.extraTitles || 0)
    }, 0)
  }

  const finalTotal = calculateFinalTotal()
  const extraTitles = calculateExtraTitles()
  const finalQuantity = quantity + extraTitles

  const toggleOrderbump = (orderbumpId: string) => {
    setSelectedOrderbumps((prev) =>
      prev.includes(orderbumpId) ? prev.filter((id) => id !== orderbumpId) : [...prev, orderbumpId],
    )
  }

  useEffect(() => {
    if (step === "qr" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [step, timeLeft])

  useEffect(() => {
    if (step === "qr" && transactionData?.transactionId) {
      const pollStatus = async () => {
        try {
          const response = await fetch(`/api/transactions/${transactionData.transactionId}`)
          const data: TransactionStatus = await response.json()

          if (data.status === "AUTHORIZED") {
            setStep("success")
          } else if (data.status === "FAILED") {
            setStep("error")
            setError("Pagamento falhou. Tente novamente.")
          }
        } catch (err) {
          console.error("Error polling status:", err)
        }
      }

      const interval = setInterval(pollStatus, 5000) // Poll every 5 seconds
      return () => clearInterval(interval)
    }
  }, [step, transactionData?.transactionId])

  useEffect(() => {
    if (isOpen) {
      setStep("form")
      setLoading(false)
      setCopied(false)
      setTimeLeft(600)
      setTransactionData(null)
      setError("")
      setSelectedOrderbumps([])
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleCreateTransaction = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/create-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity,
          totalPrice,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          selectedOrderbumps: selectedOrderbumps.map((id) => {
            const orderbump = orderbumps.find((ob) => ob.id === id)
            return {
              id: orderbump?.id,
              title: orderbump?.title,
              description: orderbump?.description,
              price: orderbump?.discountPrice,
              extraTitles: orderbump?.extraTitles,
            }
          }),
          finalTotal,
          finalQuantity,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao criar transação")
      }

      const data: TransactionResponse = await response.json()
      setTransactionData(data)
      setStep("qr")
    } catch (err) {
      setError("Erro ao processar pagamento. Tente novamente.")
      setStep("error")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyPix = async () => {
    if (transactionData?.pixPayload) {
      try {
        await navigator.clipboard.writeText(transactionData.pixPayload)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error("Failed to copy:", err)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-md mx-auto shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <QrCode className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-800">Pagamento PIX</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Total Value Box */}
        <div className="bg-blue-900 text-white p-4 text-center">
          <div className="text-sm opacity-90">Valor total</div>
          <div className="text-3xl font-bold">R$ {finalTotal.toFixed(2).replace(".", ",")}</div>
          <div className="text-sm opacity-90">{finalQuantity} títulos</div>
          {extraTitles > 0 && (
            <div className="text-xs opacity-75 mt-1">
              ({quantity} + {extraTitles} extras)
            </div>
          )}
        </div>

        {/* Content based on step */}
        <div className="p-6">
          {step === "form" && (
            <>
              <div className="flex justify-center mb-6">
                <img src="/pix.webp" alt="PIX" className="h-12 object-contain" />
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Você também pode adicionar:</h3>
                <div className="space-y-3">
                  {orderbumps.map((orderbump) => (
                    <div
                      key={orderbump.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedOrderbumps.includes(orderbump.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => toggleOrderbump(orderbump.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              selectedOrderbumps.includes(orderbump.id)
                                ? "bg-blue-600 border-blue-600"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedOrderbumps.includes(orderbump.id) && (
                              <CheckCircle className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                        <img src="/orderbump.png" alt="Viva Sorte Mascot" className="w-12 h-12 object-contain" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-800 text-sm">{orderbump.title}</h4>
                            <div className="text-right">
                              <div className="text-xs text-gray-500 line-through">
                                R$ {orderbump.originalPrice.toFixed(2).replace(".", ",")}
                              </div>
                              <div className="text-lg font-bold text-green-600">
                                R$ {orderbump.discountPrice.toFixed(2).replace(".", ",")}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-gray-600">{orderbump.description}</p>
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                              {orderbump.discount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateTransaction}
                disabled={loading || !formData.name || !formData.phone || !formData.email}
                className="w-full bg-blue-900 text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando PIX...
                  </>
                ) : (
                  `Gerar PIX - R$ ${finalTotal.toFixed(2).replace(".", ",")}`
                )}
              </button>
            </>
          )}

          {step === "qr" && transactionData && (
            <>
              {/* QR Code Circle Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4 flex justify-center">
                <QRCodeSVG value={transactionData.pixPayload} size={220} level="M" includeMargin={true} />
              </div>

              {/* Timer */}
              <div className="text-center mb-4">
                <div className="text-sm text-gray-600">Código expira em</div>
                <div className="text-lg font-bold text-red-600">{formatTime(timeLeft)}</div>
              </div>

              {/* PIX Code */}
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <div className="text-xs text-gray-600 mb-2">Código PIX:</div>
                <div className="text-xs font-mono break-all text-gray-800 bg-white p-2 rounded border">
                  {transactionData.pixPayload}
                </div>
              </div>

              {/* Copy Button */}
              <button
                onClick={handleCopyPix}
                className="w-full bg-blue-900 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-800 transition-colors mb-4"
              >
                <Copy className="w-5 h-5" />
                {copied ? "Copiado!" : "Copiar código PIX"}
              </button>

              {/* Instructions */}
              <div className="text-xs text-gray-600 space-y-1">
                <div>1. Abra o app do seu banco</div>
                <div>2. Escolha pagar com PIX</div>
                <div>3. Cole o código ou escaneie o QR</div>
              </div>
            </>
          )}

          {step === "success" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-600 mb-2">Pagamento aprovado!</h3>
              <p className="text-gray-600 mb-6">Seus títulos foram confirmados com sucesso.</p>
              <button
                onClick={onClose}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          )}

          {step === "error" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-red-600 mb-2">Erro no pagamento</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-2">
                <button
                  onClick={() => setStep("form")}
                  className="w-full bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors"
                >
                  Tentar novamente
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
