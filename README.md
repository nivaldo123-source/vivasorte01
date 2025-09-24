# Viva Sorte - Lottery App with PIX Payment

A Next.js lottery application with PIX payment integration using Sunize API.

## Features

- Lottery ticket purchase interface
- PIX payment processing with QR code generation
- Real-time payment status polling
- Responsive mobile-first design
- Integration with Sunize payment gateway

## Setup

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Configure environment variables:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   
   Update `.env.local` with your actual Sunize API credentials:
   - `SUNIZE_KEY`: Your Sunize API key
   - `SUNIZE_SECRET`: Your Sunize API secret

4. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Environment Variables

The application requires the following environment variables:

- `SUNIZE_KEY`: Your Sunize API key (x-api-key header)
- `SUNIZE_SECRET`: Your Sunize API secret (x-api-secret header)

### Getting Sunize Credentials

1. Sign up at [Sunize Dashboard](https://dashboard.sunize.com.br)
2. Create a new application
3. Copy your API key and secret
4. Add them to your environment variables

### Production Deployment

When deploying to production (Vercel, Netlify, etc.), make sure to:

1. Add environment variables in your deployment platform
2. Never commit actual credentials to version control
3. Use the production Sunize credentials (not test/sandbox)

## API Endpoints

- `POST /api/create-transaction` - Creates a new PIX transaction
- `GET /api/transactions/[id]` - Gets transaction status for polling

## Payment Flow

1. User selects ticket quantity and clicks "COMPRAR TÍTULOS"
2. Checkout popup opens with pre-filled customer data
3. User can modify their information and clicks "Gerar PIX"
4. System creates transaction with Sunize API
5. QR code and PIX payload are displayed
6. System polls for payment status every 5 seconds
7. Success/failure feedback is shown to user

## Security

- All Sunize API calls are made server-side only
- Customer CPF is fixed server-side for security
- Environment variables are used for sensitive credentials
- Input validation on all API endpoints
