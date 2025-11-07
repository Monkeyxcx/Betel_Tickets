import axios from "axios";

const WOMPI_API_URL = "https://sandbox.wompi.co/v1";
const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY!;
const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY!;

const wompiApi = axios.create({
  baseURL: WOMPI_API_URL,
  headers: {
    Authorization: `Bearer ${WOMPI_PUBLIC_KEY}`,
  },
});

export interface WompiTransaction {
  id: string;
  status: string;
  amount_in_cents: number;
  reference: string;
  customer_email: string;
  payment_method_type: string;
  redirect_url: string;
}

export const wompi = {
  async createTransaction(
    amount: number,
    email: string,
    reference: string,
    redirectUrl: string
  ): Promise<WompiTransaction> {
    const response = await wompiApi.post("/transactions", {
      amount_in_cents: amount * 100,
      currency: "COP",
      customer_email: email,
      payment_method: {
        type: "CARD",
      },
      reference,
      redirect_url: redirectUrl,
    });

    return response.data.data;
  },

  async getTransaction(transactionId: string): Promise<WompiTransaction> {
    const response = await wompiApi.get(`/transactions/${transactionId}`);
    return response.data.data;
  },
};
