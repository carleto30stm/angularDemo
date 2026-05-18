import {
  Component, inject, signal, computed, effect, OnInit,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ProductoService } from '../../../core/services/producto.service';
import { ExchangeRateService } from '../../../core/services/exchange-rate.service';
import {
  Producto, PaginationInfo, ApiError, ErrorDetail,
  ProductoCreateRequest, ProductoUpdateRequest, SortField, SortDir
} from '../../../core/models/producto.model';

@Component({
  selector: 'app-productos-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './productos-list.component.html',
  styleUrl: './productos-list.component.css'
})
export class ProductosListComponent implements OnInit {
  private readonly svc = inject(ProductoService);
  private readonly exchangeSvc = inject(ExchangeRateService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  // ──────────── Estado de la lista ────────────
  productos = signal<Producto[]>([]);
  pagination = signal<PaginationInfo>({ page: 0, limit: 10, total: 0, totalPages: 0 });
  loading = signal(false);
  search = signal('');
  sortBy = signal<SortField>('productoId');
  sortDir = signal<SortDir>('ASC');

  // ──────────── Exchange Rates ────────────
  readonly CURRENCIES = ['USD', 'EUR', 'MXN', 'GBP', 'COP'];
  selectedCurrency = signal('USD');
  exchangeRates = signal<Record<string, number>>({});
  loadingRates = signal(false);

  currentRate = computed(() => {
    const moneda = this.selectedCurrency();
    if (moneda === 'USD') return 1;
    return this.exchangeRates()[moneda] ?? 1;
  });

  constructor() {
    // Cuando cambia currentRate (señal computed), fuerza detección de cambios
    // en OnPush para que el @for re-evalúe el precio en todos los items
    effect(() => {
      this.currentRate(); // suscribe la dependencia
      this.cdr.markForCheck();
    });
  }

  // ──────────── Estado del modal ────────────
  modalVisible = signal(false);
  modalMode = signal<'crear' | 'editar'>('crear');
  selectedProducto = signal<Producto | null>(null);
  submitting = signal(false);
  apiError = signal<ApiError | null>(null);
  fieldErrors = signal<Record<string, string>>({});

  // ──────────── Confirmar eliminación ────────────
  deleteTarget = signal<Producto | null>(null);
  deleting = signal(false);

  // ──────────── Toast ────────────
  toast = signal<{ msg: string; type: 'success' | 'error' } | null>(null);

  // ──────────── Formulario ────────────
  form = this.fb.group({
    codigo_ean: ['', [Validators.required, Validators.pattern(/^\d{13}$/)]],
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    precio: [null as number | null, [Validators.required, Validators.min(0.01)]],
    stock: [null as number | null, [Validators.required, Validators.min(0)]]
  });

  // ──────────── Paginación helpers ────────────
  pages = computed(() => {
    const total = this.pagination().totalPages;
    return Array.from({ length: total }, (_, i) => i);
  });

  ngOnInit(): void {
    this.cargar();
    this.cargarTasas();
  }

  cargarTasas(): void {
    this.loadingRates.set(true);
    this.exchangeSvc.getLatestRates().subscribe({
      next: res => {
        this.exchangeRates.set(res.rates);
        this.loadingRates.set(false);
      },
      error: () => this.loadingRates.set(false)
    });
  }

  onCurrencyChange(moneda: string): void {
    this.selectedCurrency.set(moneda);
    this.cdr.markForCheck();
  }

  cargar(page = 0): void {
    this.loading.set(true);
    this.svc.listar({
      page,
      limit: this.pagination().limit,
      search: this.search() || undefined,
      sortBy: this.sortBy(),
      sortDir: this.sortDir()
    }).subscribe({
      next: res => {
        this.productos.set(res.data);
        this.pagination.set(res.pagination);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showToast('Error al cargar los productos', 'error');
      }
    });
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.cargar(0);
  }

  onSort(field: SortField): void {
    if (this.sortBy() === field) {
      this.sortDir.set(this.sortDir() === 'ASC' ? 'DESC' : 'ASC');
    } else {
      this.sortBy.set(field);
      this.sortDir.set('ASC');
    }
    this.cargar(0);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.pagination().totalPages) {
      this.cargar(page);
    }
  }

  // ──────────── Modal ────────────
  abrirCrear(): void {
    this.modalMode.set('crear');
    this.selectedProducto.set(null);
    this.apiError.set(null);
    this.fieldErrors.set({});
    this.form.reset();
    this.modalVisible.set(true);
  }

  abrirEditar(producto: Producto): void {
    this.modalMode.set('editar');
    this.selectedProducto.set(producto);
    this.apiError.set(null);
    this.fieldErrors.set({});
    this.form.patchValue({
      codigo_ean: producto.codigo_ean,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      stock: producto.stock
    });
    this.modalVisible.set(true);
  }

  cerrarModal(): void {
    this.modalVisible.set(false);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.submitting.set(true);
    this.apiError.set(null);
    this.fieldErrors.set({});

    if (this.modalMode() === 'crear') {
      const payload: ProductoCreateRequest = {
        codigo_ean: raw.codigo_ean!,
        nombre: raw.nombre!,
        descripcion: raw.descripcion!,
        precio: raw.precio!,
        stock: raw.stock!
      };
      this.svc.crear(payload).subscribe({
        next: () => {
          this.submitting.set(false);
          this.cerrarModal();
          this.cargar(0);
          this.showToast('Producto creado exitosamente', 'success');
        },
        error: (err: HttpErrorResponse) => this.handleApiError(err)
      });
    } else {
      const payload: ProductoUpdateRequest = {
        ...(raw.codigo_ean ? { codigo_ean: raw.codigo_ean } : {}),
        ...(raw.nombre ? { nombre: raw.nombre } : {}),
        ...(raw.descripcion ? { descripcion: raw.descripcion } : {}),
        ...(raw.precio != null ? { precio: raw.precio } : {}),
        ...(raw.stock != null ? { stock: raw.stock } : {})
      };
      this.svc.actualizar(this.selectedProducto()!.producto_id, payload).subscribe({
        next: () => {
          this.submitting.set(false);
          this.cerrarModal();
          this.cargar(this.pagination().page);
          this.showToast('Producto actualizado exitosamente', 'success');
        },
        error: (err: HttpErrorResponse) => this.handleApiError(err)
      });
    }
  }

  // ──────────── Eliminar ────────────
  confirmarEliminar(producto: Producto): void {
    this.deleteTarget.set(producto);
  }

  cancelarEliminar(): void {
    this.deleteTarget.set(null);
  }

  ejecutarEliminar(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleting.set(true);
    this.svc.eliminar(target.producto_id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        const page = this.productos().length === 1 && this.pagination().page > 0
          ? this.pagination().page - 1
          : this.pagination().page;
        this.cargar(page);
        this.showToast('Producto eliminado exitosamente', 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.deleting.set(false);
        const apiErr = err.error as ApiError;
        this.showToast(apiErr?.message ?? 'Error al eliminar el producto', 'error');
        this.deleteTarget.set(null);
      }
    });
  }

  // ──────────── Helpers ────────────
  private handleApiError(err: HttpErrorResponse): void {
    this.submitting.set(false);
    const apiErr = err.error as ApiError;
    this.apiError.set(apiErr);
    if (apiErr?.details?.length) {
      const map: Record<string, string> = {};
      apiErr.details.forEach((d: ErrorDetail) => { map[d.target] = d.message; });
      this.fieldErrors.set(map);
    }
  }

  fieldError(field: string): string | null {
    return this.fieldErrors()[field] ?? null;
  }

  controlHasError(controlName: string): boolean {
    const ctrl = this.form.get(controlName) as AbstractControl;
    return ctrl.invalid && ctrl.touched;
  }

  getControlError(controlName: string): string {
    const ctrl = this.form.get(controlName) as AbstractControl;
    const fe = this.fieldError(controlName);
    if (fe) return fe;
    if (ctrl.errors?.['required']) return 'Este campo es requerido';
    if (ctrl.errors?.['minlength']) return `Mínimo ${ctrl.errors['minlength'].requiredLength} caracteres`;
    if (ctrl.errors?.['maxlength']) return `Máximo ${ctrl.errors['maxlength'].requiredLength} caracteres`;
    if (ctrl.errors?.['min']) return `El valor mínimo es ${ctrl.errors['min'].min}`;
    if (ctrl.errors?.['pattern']) return 'Formato inválido';
    return '';
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 4000);
  }
}
