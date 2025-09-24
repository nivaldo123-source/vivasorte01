"use client"

import { useState } from "react"
import { Menu, Minus, Plus, ShoppingCart, Star } from "lucide-react"
import Head from "next/head"
import CheckoutPopup from "../components/checkout-popup"

export default function Home() {
  const [selectedQuantity, setSelectedQuantity] = useState(20)
  const [customQuantity, setCustomQuantity] = useState(20)
  const [showCheckout, setShowCheckout] = useState(false)

  const ticketOptions = [
    { quantity: 20, price: 19.9, popular: false },
    { quantity: 30, price: 29.7, popular: false },
    { quantity: 40, price: 39.6, popular: false },
    { quantity: 70, price: 69.3, popular: true },
    { quantity: 100, price: 99.0, popular: false },
    { quantity: 200, price: 199.0, popular: false },
  ]

  const handleQuantitySelect = (quantity: number) => {
    setSelectedQuantity(quantity)
    setCustomQuantity(quantity)
  }

  const incrementQuantity = () => {
    setCustomQuantity((prev) => {
      let newValue
      if (prev < 20) newValue = 20
      else if (prev < 30) newValue = 30
      else if (prev < 40) newValue = 40
      else if (prev < 70) newValue = 70
      else if (prev < 100) newValue = 100
      else if (prev < 200) newValue = 200
      else newValue = prev // Already at maximum

      // Auto-select the corresponding card
      setSelectedQuantity(newValue)
      return newValue
    })
  }

  const decrementQuantity = () => {
    setCustomQuantity((prev) => {
      let newValue
      if (prev > 200) newValue = 200
      else if (prev > 100) newValue = 100
      else if (prev > 70) newValue = 70
      else if (prev > 40) newValue = 40
      else if (prev > 30) newValue = 30
      else if (prev > 20) newValue = 20
      else newValue = prev // Already at minimum

      // Auto-select the corresponding card
      setSelectedQuantity(newValue)
      return newValue
    })
  }

  const calculatePrice = (qty: number): number => {
    const option = ticketOptions.find((opt) => opt.quantity === qty)
    if (option) return option.price

    // Calcular preço proporcional para quantidades customizadas
    const basePrice = 0.99 // R$ 0,99 por título
    return qty * basePrice
  }

  const handleBuyClick = () => {
    setShowCheckout(true)
  }

  return (
    <>
      <Head>
        <title>Página Viva Sorte - Loteria Milionário</title>
        <meta name="description" content="Viva Sorte - Loteria Milionário" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-white">
          <div className="flex items-center">
            <img src="/logoviva.png" alt="VIVA SORTE" className="h-8 md:h-10" />
          </div>
          <button className="p-2">
            <Menu className="w-6 h-6 text-blue-600" />
          </button>
        </header>

        <div className="px-4 max-w-sm mx-auto">
          {/* Banner Principal */}
          <div className="relative rounded-2xl mb-6 overflow-hidden">
            <img src="/imgviva.webp" alt="1 MILHÃO - Viva Sorte" className="w-full h-auto object-cover" />
          </div>

          {/* Informação do sorteio */}
          <div className="text-center mb-4 px-2">
            <span className="text-gray-700">O Sorteio será </span>
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">HOJE</span>
            <span className="text-gray-700"> por apenas </span>
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">R$0,99</span>
          </div>

          {/* Cards de seleção */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {ticketOptions.map((option) => (
              <button
                key={option.quantity}
                onClick={() => handleQuantitySelect(option.quantity)}
                className={`relative p-3 rounded-lg text-center transition-all duration-200 ${
                  selectedQuantity === option.quantity
                    ? "bg-green-500 text-white ring-4 ring-green-300 scale-105"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                } active:scale-95`}
              >
                {option.popular && (
                  <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                    <Star className="w-3 h-3 text-white fill-white" />
                  </div>
                )}
                <div className="text-xl font-bold">+{option.quantity}</div>
                <div className="text-xs">R${option.price.toFixed(2).replace(".", ",")}</div>
                <div
                  className={`text-xs mt-1 rounded px-1 py-1 ${
                    selectedQuantity === option.quantity ? "bg-green-600" : "bg-blue-700"
                  }`}
                >
                  {selectedQuantity === option.quantity ? "SELECIONADO" : "SELECIONAR"}
                </div>
              </button>
            ))}
          </div>

          {/* Contador customizado */}
          <div className="bg-blue-600 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={decrementQuantity}
                disabled={customQuantity <= 20}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors ${
                  customQuantity <= 20 ? "bg-gray-400 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800"
                }`}
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="bg-white rounded-lg px-6 py-2 min-w-[100px] text-center">
                <div className="text-xl font-bold text-gray-800">{customQuantity}</div>
              </div>

              <button
                onClick={incrementQuantity}
                disabled={customQuantity >= 200}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors ${
                  customQuantity >= 200 ? "bg-gray-400 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800"
                }`}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Botão de comprar */}
          <button
            onClick={handleBuyClick}
            className="w-full bg-green-500 text-white py-3 rounded-lg text-lg font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors active:scale-98 mb-4"
          >
            <ShoppingCart className="w-5 h-5" />
            COMPRAR TÍTULOS
          </button>

          {/* Texto informativo */}
          <p className="text-center text-gray-600 text-sm mb-6 px-2">
            Comprar mais títulos aumenta suas chances de ganhar!
          </p>

          {/* Imagem do rodapé */}
          <div className="mb-6">
            <img
              src="/imagecopy.png"
              alt="Hospital do Câncer de Londrina - Instituição beneficiada"
              className="w-full h-auto object-cover rounded-lg"
            />
          </div>

          {/* Rodapé com informações legais */}
          <div className="mb-6">
            <img
              src="/imagecopycopy.png"
              alt="Informações legais - Viva Sorte, ViaCap, Viva Privilégios, EDJ Digital"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* Popup de Checkout */}
        <CheckoutPopup
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          quantity={customQuantity}
          totalPrice={calculatePrice(customQuantity)}
        />
      </div>
    </>
  )
}
