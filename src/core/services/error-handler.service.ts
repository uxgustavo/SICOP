import { Injectable, signal } from '@angular/core';


export interface AppError {
  timestamp: Date;
  context: string;
  error: any;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private _errors = signal<AppError[]>([]);
  public errors = this._errors.asReadonly();

  handle(error: any, context: string) {
    const errorMsg = error?.message || 'Erro desconhecido';
    console.error(`[SICOP-GATEWAY] [${context}] Erro:`, error);
    
    this._errors.update(currentErrors => [
      ...currentErrors,
      {
        timestamp: new Date(),
        context,
        error,
        message: errorMsg
      }
    ]);
  }
}
