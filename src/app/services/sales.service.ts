import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, switchMap } from 'rxjs';

/* -----------------------------------------------
 * Data Models
 * ---------------------------------------------*/
export interface SaleItemPayload {
  productId: string | number;
  qty: number;
  price: number;
}

export interface CreateSalePayload {
  invoiceNumber: string;
  date: string;          // ISO string or yyyy-MM-dd
  dueDate?: string;
  customerId: string | number;
  status: 'Pending' | 'Paid' | 'Partially Paid' | 'Cancelled';
  notes?: string;
  shipping: number;
  discount: number;
  taxRate: number;
  items: SaleItemPayload[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
}

/* -----------------------------------------------
 * Service
 * ---------------------------------------------*/
@Injectable({ providedIn: 'root' })
export class SalesService {
  private localKey = 'salesRecords';
  private baseUrl: string;

  constructor(
    private http: HttpClient,
    @Optional() @Inject('SALES_API_URL') private apiUrl?: string
  ) {
    // Default base URL (can be overridden via token)
    this.baseUrl = apiUrl ? `${apiUrl}/sales` : '/api/sales';
  }

  /* -----------------------------------------------
   * Create a Sale
   * ---------------------------------------------*/
  createSale(payload: CreateSalePayload): Observable<any> {
    if (this.apiUrl) {
      // ✅ Send to backend if API exists
      return this.http.post<any>(this.baseUrl, payload);
    }

    // 🔁 Fallback: save locally with simulated delay
    return of(null).pipe(
      delay(400),
      switchMap(() => {
        const existing = JSON.parse(localStorage.getItem(this.localKey) || '[]');
        existing.push(payload);
        localStorage.setItem(this.localKey, JSON.stringify(existing));
        return of({ ok: true, source: 'localStorage', data: payload });
      })
    );
  }

  /* -----------------------------------------------
   * Get Sale by ID
   * ---------------------------------------------*/
  getSaleById(id: string | number): Observable<any> {
    if (this.apiUrl) {
      return this.http.get<any>(`${this.baseUrl}/${id}`);
    }

    const allSales = JSON.parse(localStorage.getItem(this.localKey) || '[]');
    const sale = allSales.find((s: any, index: number) => index + 1 === Number(id));
    return of(sale || null);
  }

  /* -----------------------------------------------
   * List Sales
   * ---------------------------------------------*/
  listSales(params?: { page?: number; size?: number; q?: string }): Observable<any> {
    if (this.apiUrl) {
      return this.http.get<any>(this.baseUrl, { params: (params as any) || {} });
    }

    const allSales = JSON.parse(localStorage.getItem(this.localKey) || '[]');
    return of(allSales);
  }

  /* -----------------------------------------------
   * Utility: Clear Local Records
   * ---------------------------------------------*/
  clearLocalSales(): void {
    localStorage.removeItem(this.localKey);
  }
}
