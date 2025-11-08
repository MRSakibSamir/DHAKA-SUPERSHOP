import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';

// pdfMake
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as pdfMake from 'pdfmake/build/pdfmake';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || (pdfFonts as any).vfs;

import { SalesService, CreateSalePayload } from '../../services/sales.service';

interface Supplier {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  cost: number;
}

interface SaleItem {
  productId: number;
  cost: number;
  qty: number;
}

interface SalePayload {
  poNumber: string;
  date: string;
  expectedDate: string;
  supplierId: number;
  status: 'Pending' | 'Approved' | 'Received' | 'Cancelled';
  items: SaleItem[];
  shipping: number;
  discount: number;
  taxRate: number;
  notes: string;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
}

@Component({
  selector: 'app-sales-list',
  templateUrl: './sales-list.component.html',
  styleUrls: ['./sales-list.component.scss']
})
export class SalesListComponent implements OnInit {
  form!: FormGroup;

  suppliers: Supplier[] = [
    { id: 1, name: 'Acme Traders' },
    { id: 2, name: 'Global Mart Ltd' },
    { id: 3, name: 'Fresh Foods Supply' },
    { id: 4, name: 'Akij Group' }
  ];

  products: Product[] = [
    { id: 1, name: 'Milk Vita Butter 100gm', cost: 150 },
    { id: 2, name: 'Farm Fresh Milk Powder 1L', cost: 910 },
    { id: 3, name: 'ACI Pure Chinigura Rice 1kg', cost: 310 },
    { id: 4, name: 'Mojo 1L', cost: 60 }
  ];

  constructor(private fb: FormBuilder, private salesservice: SalesService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      poNumber: [this.generatePoNumber(), Validators.required],
      date: [this.today(), Validators.required],
      expectedDate: [this.today()],
      supplierId: [null as number | null, Validators.required],
      status: ['Pending', Validators.required],
      items: this.fb.array([this.createItem()]),
      shipping: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.required, Validators.min(0)]],
      taxRate: [5, [Validators.required, Validators.min(0)]],
      notes: ['']
    });
  }

  // --- helpers ---
  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private generatePoNumber(): string {
    const d = new Date();
    return `PO-${d.getFullYear().toString().slice(2)}${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}-${d
      .getHours()
      .toString()
      .padStart(2, '0')}${d.getMinutes().toString().padStart(2, '0')}`;
  }

  private toNumber(val: unknown): number {
    const n = Number(val);
    return Number.isFinite(n) ? n : 0;
  }

  // --- items form ---
  get items(): FormArray<FormGroup> {
    return this.form.get('items') as FormArray<FormGroup>;
  }

  private createItem(): FormGroup {
    return this.fb.group({
      productId: [null as number | null, Validators.required],
      cost: [0, [Validators.required, Validators.min(0)]],
      qty: [1, [Validators.required, Validators.min(1)]]
    });
  }

  addItem(): void {
    this.items.push(this.createItem());
  }

  removeItem(i: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(i);
    }
  }

  onProductChange(i: number): void {
    const row = this.items.at(i) as FormGroup;
    const pid = this.toNumber(row.get('productId')?.value);
    const found = this.products.find(p => p.id === pid);
    if (found) {
      row.patchValue({ cost: found.cost }, { emitEvent: false });
    }
  }

  // --- calculations ---
  lineTotal(i: number): number {
    const g = this.items.at(i) as FormGroup;
    const qty = this.toNumber(g.get('qty')?.value);
    const cost = this.toNumber(g.get('cost')?.value);
    return qty * cost;
  }

  get subtotal(): number {
    return this.items.controls.reduce((sum: number, _ctrl: AbstractControl, i: number) => sum + this.lineTotal(i), 0);
  }

  get shipping(): number {
    return Math.max(this.toNumber(this.form.get('shipping')?.value), 0);
  }

  get discount(): number {
    const d = Math.max(this.toNumber(this.form.get('discount')?.value), 0);
    return Math.min(d, this.subtotal + this.shipping);
  }

  get taxAmount(): number {
    const rate = this.toNumber(this.form.get('taxRate')?.value) / 100;
    const base = Math.max(this.subtotal + this.shipping - this.discount, 0);
    return base * rate;
  }

  get grandTotal(): number {
    return this.subtotal + this.shipping - this.discount + this.taxAmount;
  }

  // --- submit ---
  onSubmit(): void {
    if (this.form.invalid || this.subtotal <= 0) {
      this.form.markAllAsTouched();
      return;
    }

    // Build your internal payload (used for PDF and display)
    const base = this.form.value as Omit<SalePayload, 'subtotal' | 'taxAmount' | 'grandTotal'>;
    const payload: SalePayload = {
      ...base,
      shipping: this.shipping,
      discount: this.discount,
      taxRate: this.toNumber(this.form.get('taxRate')?.value),
      subtotal: this.subtotal,
      taxAmount: this.taxAmount,
      grandTotal: this.grandTotal
    };

    // Map to service payload shape (price instead of cost)
    const payloadForApi: CreateSalePayload = {
      poNumber: payload.poNumber,
      date: payload.date,
      dueDate: payload.expectedDate,
      supplierId: payload.supplierId,
      status: payload.status,
      notes: payload.notes,
      shipping: payload.shipping,
      discount: payload.discount,
      taxRate: payload.taxRate,
      items: payload.items.map(it => ({
        productId: it.productId,
        qty: it.qty,
        price: it.cost
      })),
      subtotal: payload.subtotal,
      taxAmount: payload.taxAmount,
      grandTotal: payload.grandTotal
    };

    // ✅ Correct variable used here
    this.salesservice.createSale(payloadForApi).subscribe({
      next: (_res: unknown) => {
        alert('✅ Sale saved successfully!');
        this.generatePDF(payload);

        // Reset form cleanly
        this.form.reset({
          poNumber: this.generatePoNumber(),
          date: this.today(),
          expectedDate: this.today(),
          supplierId: null,
          status: 'Pending',
          shipping: 0,
          discount: 0,
          taxRate: 5,
          notes: ''
        });

        // Reset items to a single fresh row
        while (this.items.length) this.items.removeAt(0);
        this.addItem();
      },
      error: (err: unknown) => {
        console.error('Save failed:', err);
        alert('❌ Failed to save sale!');
      }
    });
  }

  onReset(): void {
    // Full page refresh (your earlier requirement)
    window.location.reload();
  }

  // --- PDF generation ---
  private generatePDF(data: SalePayload): void {
    const itemsTable = (data.items || []).map((item: SaleItem, i: number) => {
      const product = this.products.find(p => p.id === Number(item.productId));
      const qty = this.toNumber(item.qty);
      const cost = this.toNumber(item.cost);
      return [
        { text: i + 1, alignment: 'center' },
        { text: product ? product.name : 'Unknown', alignment: 'left' },
        { text: qty.toString(), alignment: 'center' },
        { text: `৳ ${cost.toFixed(2)}`, alignment: 'right' },
        { text: `৳ ${(qty * cost).toFixed(2)}`, alignment: 'right' }
      ];
    });

    const docDefinition: any = {
      content: [
        { text: 'INVOICE', style: 'header', alignment: 'center' },
        { text: `PO Number: ${data.poNumber}`, margin: [0, 5, 0, 2] },
        { text: `Date: ${data.date}`, margin: [0, 0, 0, 10] },

        { text: 'Items', style: 'subheader' },
        {
          table: {
            widths: ['auto', '*', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'SL', bold: true },
                { text: 'Product', bold: true },
                { text: 'Qty', bold: true },
                { text: 'Cost', bold: true },
                { text: 'Amount', bold: true }
              ],
              ...itemsTable
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 5, 0, 10]
        },

        {
          columns: [
            { width: '*', text: '' },
            {
              width: 'auto',
              table: {
                body: [
                  ['Subtotal:', `৳ ${data.subtotal.toFixed(2)}`],
                  ['Shipping:', `৳ ${data.shipping.toFixed(2)}`],
                  ['Discount:', `৳ ${data.discount.toFixed(2)}`],
                  ['Tax:', `৳ ${data.taxAmount.toFixed(2)}`],
                  [{ text: 'Grand Total:', bold: true }, { text: `৳ ${data.grandTotal.toFixed(2)}`, bold: true }]
                ]
              },
              layout: 'noBorders'
            }
          ]
        },

        { text: 'Thank you for your business!', alignment: 'center', margin: [0, 20, 0, 0] }
      ],
      styles: {
        header: { fontSize: 18, bold: true },
        subheader: { fontSize: 14, bold: true }
      },
      defaultStyle: { fontSize: 10 }
    };

    (pdfMake as any).createPdf(docDefinition).download(`${data.poNumber}.pdf`);
  }

  // Optional: still available if user clicks the separate PDF button
  downloadPDF(): void {
    if (this.form.invalid || this.subtotal <= 0) {
      this.form.markAllAsTouched();
      return;
    }

    const data: SalePayload = {
      ...(this.form.value as any),
      shipping: this.shipping,
      discount: this.discount,
      taxRate: this.toNumber(this.form.get('taxRate')?.value),
      subtotal: this.subtotal,
      taxAmount: this.taxAmount,
      grandTotal: this.grandTotal
    };

    this.generatePDF(data);
  }
}
