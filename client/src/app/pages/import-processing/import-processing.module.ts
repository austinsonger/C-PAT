/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SharedModule } from '../../common/shared.module';
import { STIGManagerImportComponent } from './stigmanager-import/stigmanager-import.component';
import { ImportProcessingRoutingModule } from './import-processing-routing.module';

import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ListboxModule } from 'primeng/listbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TabViewModule } from 'primeng/tabview';
import { TreeTableModule } from 'primeng/treetable';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MultiSelectModule } from 'primeng/multiselect';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { SkeletonModule } from 'primeng/skeleton';
import { RippleModule } from 'primeng/ripple';
import { SidebarModule } from 'primeng/sidebar';
import { TenableVulnerabilitiesComponent } from './tenable-import/tenableVulnerabilities.component';
import { TenableSolutionsComponent } from './tenable-import/components/solutions/tenableSolutions.component';
import { TenableIAVVulnerabilitiesComponent } from './tenable-import/components/iavVulnerabilities/tenableIAVVulnerabilities.component';
import { TenableAssetsTableComponent } from './tenable-import/components/tenableAssetsTable/tenableAssetsTable.component';

@NgModule({
  declarations: [
    STIGManagerImportComponent,
    TenableVulnerabilitiesComponent,
    TenableSolutionsComponent,
    TenableIAVVulnerabilitiesComponent,
    TenableAssetsTableComponent,
  ],
  imports: [
    AccordionModule,
    ButtonModule,
    CalendarModule,
    CardModule,
    ListboxModule,
    DialogModule,
    InputTextareaModule,
    TableModule,
    ToastModule,
    TooltipModule,
    TabViewModule,
    TreeTableModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    PanelMenuModule,
    MultiSelectModule,
    OverlayPanelModule,
    SkeletonModule,
    RippleModule,
    SidebarModule,
    CommonModule,
    FormsModule,
    ImportProcessingRoutingModule,
    SharedModule,
  ],
  providers: [
    MessageService,
    ConfirmationService
  ],
  exports: [
    TenableAssetsTableComponent,
  ]
})
export class ImportProcessingModule { }
