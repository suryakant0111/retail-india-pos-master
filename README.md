# Retail India POS System
## 🌐 Live Demo

You can try the deployed POS system here:  
👉 [https://retailpos.vercel.app/login](https://retailpos.vercel.app/login)

**Sample Login:**  
- **Email:** `ab@gmail.com`  
- **Password:** `123456`



A comprehensive, full-stack Point of Sale (POS) system designed for retail businesses in India. This application is built with a modern tech stack including React, TypeScript, and Supabase, providing a feature-rich solution for managing sales, inventory, customers, and reporting.

## Key Features

- **Point of Sale (POS):** An intuitive interface for processing sales, adding products to a cart, managing quantities, and applying discounts.
- **Product Management:** Add, edit, and delete products. Includes support for categories, stock levels, pricing, barcodes, and images.
- **Inventory Control:** Track stock levels, set minimum stock alerts, and view inventory status.
- **Customer Management:** Maintain a customer database with contact information, purchase history, and loyalty points.
- **Role-Based Access Control:** Pre-defined roles (Admin, Manager, Employee) with an approval system for new employee sign-ups.
- **Sales Dashboard:** Visualize key metrics with statistical cards and charts for daily, weekly, and monthly sales performance.
- **GST-Ready Invoicing:** Generate and download detailed, GST-compliant PDF invoices for every transaction.
- **Transaction History:** View a complete log of all sales transactions.
- **GST Filing Reports:** Generate and download GSTR-1 sales reports in CSV format for tax filing.
- **Multiple Payment Options:** Supports cash, UPI, and card payments, with a configurable QR code for UPI.

## Tech Stack

- **Frontend:**
  - React
  - TypeScript
  - Vite
  - Tailwind CSS
  - shadcn/ui
  - Recharts
  - React Hook Form
- **Backend:**
  - Supabase (Authentication, Database, Edge Functions)
  - Node.js / Express (for specific admin tasks like user creation)
- **Deployment:**
  - Vercel

## Project Structure

The project is organized into a frontend React application and a backend Node.js server.

- **`src/`**: Contains the main React application source code.
  - **`pages/`**: Top-level route components (e.g., `POS.tsx`, `Dashboard.tsx`, `Admin.tsx`).
  - **`components/`**: Reusable UI components, organized by feature (e.g., `pos`, `dashboard`, `auth`).
  - **`contexts/`**: React contexts for managing global state like `AuthContext` and `CartContext`.
  - **`hooks/`**: Custom React hooks.
  - **`integrations/supabase/`**: Supabase client setup.
- **`backend/`**: A simple Express.js server for handling protected admin actions.
- **`supabase/`**: Configuration for Supabase Edge Functions.

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

- Node.js (v18 or later)
- npm

### 1. Clone the Repository

```sh
git clone https://github.com/suryakant0111/retail-india-pos-master.git
cd retail-india-pos-master
```

### 2. Install Dependencies

Install the required packages for both the frontend and the backend.

```sh
npm install
```

### 3. Set Up Supabase

1.  Create a new project on [Supabase](https://supabase.com/).
2.  Navigate to the **SQL Editor** in your Supabase project dashboard.
3.  You will need to create the following tables. You can use the `src/types/index.ts` file as a reference for the column structure.
    - `shops`
    - `profiles` (for user roles and mapping to shops)
    - `products`
    - `customers`
    - `invoices`
4.  Enable Row Level Security (RLS) on your tables and define policies as needed for your security requirements.

### 4. Configure Environment Variables

You will need to create two environment files.

**A. Root `.env` file (for the Vite frontend):**

Create a file named `.env` in the project's root directory and add your Supabase project URL and Anon Key.

```
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_API_URL=http://localhost:3001
```

**B. Backend `.env` file:**

Create a file named `.env` inside the `backend/` directory and add your Supabase project URL, Service Role Key, and JWT Secret.

```
SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET=YOUR_SUPABASE_JWT_SECRET
PORT=3001
```

You can find your Supabase keys in your project's dashboard under **Project Settings > API**.

### 5. Run the Application

You need to run the frontend development server and the backend server concurrently.

**Terminal 1: Start the Backend Server**

```sh
node backend/server.js
```

**Terminal 2: Start the Frontend Vite Server**

```sh
npm run dev
```

The application should now be running at `http://localhost:8080`.
