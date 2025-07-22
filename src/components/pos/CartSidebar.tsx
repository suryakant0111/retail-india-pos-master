import React, { useState } from 'react';
import { CartSection } from '@/components/pos/CartSection';
import HoldCartButtons from '@/components/pos/HoldCartButtons';

export const CartSidebar = ({
  customers,
  openPaymentDialog,
  refreshCustomers,
  items,
  paymentSettings,
  currentCart,
  onResumeCart,
  onClearCart,
  onReviewConflicts
}: any) => {
  const [cartOpen, setCartOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  return (
    <>
      {/* Desktop: show CartSection as sidebar as before */}
      <div className="hidden lg:block h-full">
        <CartSection 
          customers={customers}
          openPaymentDialog={openPaymentDialog}
          refreshCustomers={refreshCustomers}
          paymentSettings={paymentSettings}
          currentCart={currentCart}
          onResumeCart={onResumeCart}
          onClearCart={onClearCart}
          onReviewConflicts={onReviewConflicts}
        />
      </div>
      {/* Mobile Floating Cart Button and Slide-Over */}
      <button
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-indigo-600 text-white rounded-full shadow-lg p-4 flex items-center gap-2 focus:outline-none"
        onClick={() => setCartOpen(true)}
        aria-label="Open Cart"
        style={{ display: cartOpen ? 'none' : 'flex' }}
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 2.7A2 2 0 008.48 19h7.04a2 2 0 001.83-1.3L17 13M7 13V6a1 1 0 011-1h5a1 1 0 011 1v7" /></svg>
        <span className="font-bold">Cart</span>
        {items.length > 0 && (
          <span className="ml-2 bg-white text-indigo-600 rounded-full px-2 py-0.5 text-xs font-bold">{items.length}</span>
        )}
      </button>
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative w-full max-w-md ml-auto h-full bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Current Order</h2>
              <button onClick={() => setCartOpen(false)} className="text-gray-500 hover:text-gray-700 p-2 focus:outline-none">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CartSection 
                customers={customers}
                openPaymentDialog={openPaymentDialog}
                refreshCustomers={refreshCustomers}
                paymentSettings={paymentSettings}
                currentCart={currentCart}
                onResumeCart={onResumeCart}
                onClearCart={onClearCart}
                onReviewConflicts={onReviewConflicts}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 