import { Routes } from '@angular/router';
import { ClientPanelComponent } from './features/client-panel/client-panel.component';
import { AdministrationComponent } from './features/administration/administration.component';
import { SortingFacilityComponent } from './features/sorting-facility/sorting-facility.component';
import { DispatchStationComponent } from './features/dispatch-station/dispatch-station.component';
import { CourierPanelComponent } from './features/courier/courier-panel.component';
import { LoginComponent } from './features/auth/login.component';

export const routes: Routes = [
  { path: '', redirectTo: 'panel-klienta', pathMatch: 'full' },
  { path: 'panel-klienta', component: ClientPanelComponent },

  { path: 'administracja', redirectTo: 'administracja/konta', pathMatch: 'full' },
  { path: 'administracja/:section', component: AdministrationComponent },

  { path: 'sortownia', redirectTo: 'sortownia/wyszukiwanie', pathMatch: 'full' },
  { path: 'sortownia/:section', component: SortingFacilityComponent },

  { path: 'stanowisko-wydawcze', redirectTo: 'stanowisko-wydawcze/stan', pathMatch: 'full' },
  { path: 'stanowisko-wydawcze/:section', component: DispatchStationComponent },

  { path: 'kurier', redirectTo: 'kurier/trasa', pathMatch: 'full' },
  { path: 'kurier/:section', component: CourierPanelComponent },

  // Kompatybilność z poprzednim adresem doręczeń
  { path: 'doreczenia', redirectTo: 'kurier/trasa', pathMatch: 'full' },
  { path: 'doreczenia/potwierdzenie', redirectTo: 'kurier/doreczenie', pathMatch: 'full' },
  { path: 'doreczenia/:section', redirectTo: 'kurier/trasa', pathMatch: 'full' },

  { path: 'logowanie', component: LoginComponent },
  { path: '**', redirectTo: 'panel-klienta' }
];
