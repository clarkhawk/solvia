export interface PaymentDTO {
  id: string;
  organizationId: string;
  clientId: string;
  amount: number;
  paidAt: Date;
  reference: string | null;
  createdAt: Date;
  allocations: PaymentAllocationDTO[];
}

export interface PaymentAllocationDTO {
  id: string;
  paymentId: string;
  invoiceId: string;
  amount: number;
}

export interface CreatePaymentInput {
  clientId: string;
  amount: number;
  paidAt: Date;
  reference?: string;
}
