import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AppContextService {
  // Lista de anos disponíveis para o exercício
  readonly availableYears = [2024, 2025, 2026, 2027];
  
  // Ano de exercício atual (Estado Global)
  // Inicializado com o ano vigente
  anoExercicio = signal(new Date().getFullYear());

  constructor() {
    console.log('AppContextService initialized. Ano:', this.anoExercicio());
  }

  setAno(ano: number | string) {
    this.anoExercicio.set(Number(ano));
  }
}