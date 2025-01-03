export interface Product {
    productId: string;
    name: string;
    price: number;
    description: string;
    stock: number;
  }
  
  export interface Order {
    orderId: string;
    customerId: string;
    products: Array<{
      productId: string;
      quantity: number;
    }>;
    totalAmount: number;
    status: 'pending' | 'paid' | 'fulfilled';
    createdAt: string;
  }
  
  export interface Invoice {
    invoiceId: string;
    orderId: string;
    amount: number;
    status: 'pending' | 'paid';
    createdAt: string;
  }
  
  export interface Payment {
    paymentId: string;
    invoiceId: string;
    amount: number;
    status: 'success' | 'failed';
    createdAt: string;
  }
  
  export interface Fulfillment {
    fulfillmentId: string;
    orderId: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered';
    trackingNumber?: string;
    updatedAt: string;
  }
  