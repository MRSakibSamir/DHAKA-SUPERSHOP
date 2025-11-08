import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, switchMap } from 'rxjs';

export interface SaleItemPayload {
  productId: string | number;
  qty: number;
  price: number;
}

export interface CreateSalePayload {
  invoiceNumber?: string;
  poNumber?: string;
  date: string;
  dueDate?: string;
  customerId?: string | number;
  supplierId?: string | number;
  status: 'Pending' | 'Approved' | 'Received' | 'Cancelled';
  notes?: string;
  shipping: number;
  discount: number;
  taxRate: number;
  items: SaleItemPayload[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
}

@Injectable({ providedIn: 'root' })
export class SalesService {
  private localKey = 'salesRecords';
  private baseUrl: string;

  constructor(
    private http: HttpClient,
    @Optional() @Inject('SALES_API_URL') private apiUrl?: string
  ) {
    this.baseUrl = apiUrl ? `${apiUrl}/sales` : '/api/sales';
  }

  createSale(payload: CreateSalePayload): Observable<any> {
    if (this.apiUrl) {
      return this.http.post<any>(this.baseUrl, payload);
    }

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
} 