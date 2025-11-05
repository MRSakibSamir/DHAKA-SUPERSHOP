// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class PurchaseService {
//   private apiUrl = 'http://localhost:8080/api/purchases'; // ✅ Spring Boot endpoint

//   constructor(private http: HttpClient) {}

//   /** Get all purchases */
//   getAllPurchases(): Observable<any[]> {
//     return this.http.get<any[]>(this.apiUrl);
//   }

//   /** Get a single purchase by ID */
//   getPurchaseById(id: number): Observable<any> {
//     return this.http.get<any>(`${this.apiUrl}/${id}`);
//   }

//   /** Create a new purchase */
//   createPurchase(purchase: any): Observable<any> {
//     return this.http.post<any>(this.apiUrl, purchase);
//   }

//   /** Update an existing purchase */
//   updatePurchase(id: number, purchase: any): Observable<any> {
//     return this.http.put<any>(`${this.apiUrl}/${id}`, purchase);
//   }

//   /** Delete a purchase */
//   deletePurchase(id: number): Observable<void> {
//     return this.http.delete<void>(`${this.apiUrl}/${id}`);
//   }
// }


import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, delay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private baseUrl = '/api/purchases';      // POST purchase
  private suppliersUrl = '/api/suppliers';  // GET suppliers
  private productsUrl  = '/api/products';   // GET products

  constructor(private http: HttpClient) {}

  createPurchase(payload: any): Observable<any> {
    return this.http.post(this.baseUrl, payload).pipe(delay(500));
  }

  getSuppliers(): Observable<Array<{ id: string; name: string }>> {
    return this.http.get<Array<{ id: string; name: string }>>(this.suppliersUrl);
  }

  getProducts(): Observable<Array<{ id: string; name: string; defaultCost?: number }>> {
    return this.http.get<Array<{ id: string; name: string; defaultCost?: number }>>(this.productsUrl);
  }
}
