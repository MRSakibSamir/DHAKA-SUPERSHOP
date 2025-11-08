import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private baseUrl = '/api/purchases';      // POST purchase
  private suppliersUrl = '/api/suppliers';  // GET suppliers
  private productsUrl  = '/api/products';   // GET products

  constructor(private http: HttpClient) {}

  /** Create a new purchase */
  createPurchase(payload: any): Observable<any> {
    return this.http.post(this.baseUrl, payload).pipe(delay(500));
  }

  /** Load suppliers */
  getSuppliers(): Observable<Array<{ id: string | number; name: string }>> {
    return this.http.get<Array<{ id: string | number; name: string }>>(this.suppliersUrl);
  }

  /** Load products */
  getProducts(): Observable<Array<{ id: string | number; name: string; defaultCost?: number }>> {
    return this.http.get<Array<{ id: string | number; name: string; defaultCost?: number }>>(this.productsUrl);
  }
}
