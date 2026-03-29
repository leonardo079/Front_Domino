import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  readonly modules = [
    {
      title: 'Agent vs Agent',
      description: 'Dos modelos juegan en vivo con metricas por turno y arbol de decision de ambos agentes.',
      cta: 'Iniciar modo',
      route: '/game/agent-vs-agent'
    },
    {
      title: 'Agent vs Human',
      description: 'Juega contra un modelo y observa como cambian sus costos de busqueda en tiempo real.',
      cta: 'Jugar ahora',
      route: '/game/agent-vs-human'
    },
    {
      title: 'Benchmark',
      description: 'Selecciona modelos y numero de partidas para correr comparativas con streaming de resultados.',
      cta: 'Abrir benchmark',
      route: '/benchmark'
    }
  ];
}
