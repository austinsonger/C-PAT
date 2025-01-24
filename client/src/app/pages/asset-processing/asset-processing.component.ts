/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { AssetService } from './assets.service';
import { forkJoin, Subscription } from 'rxjs';
import { SubSink } from 'subsink';
import { PayloadService } from '../../common/services/setPayload.service';
import { DialogService } from 'primeng/dynamicdialog';
import { Table, TableModule } from 'primeng/table';
import { SharedService } from '../../common/services/shared.service';
import { CollectionsService } from '../admin-processing/collection-processing/collections.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { STIGManagerAssetsTableComponent } from '../import-processing/stigmanager-import/stigManagerAssetsTable/stigManagerAssetsTable.component';
import { TenableAssetsTableComponent } from '../import-processing/tenable-import/components/tenableAssetsTable/tenableAssetsTable.component';
import { TabsModule } from 'primeng/tabs';
import { DialogModule } from 'primeng/dialog';
import { AssetComponent } from './asset/asset.component';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { Select } from 'primeng/select';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';

interface Column {
  field: string;
  header: string;
  customExportHeader?: string;
}
interface AssetEntry {
  assetId: any;
  assetName: string;
  description: string;
  ipAddress: string;
  macAddress: string;
}

@Component({
  selector: 'cpat-asset-processing',
  templateUrl: './asset-processing.component.html',
  styleUrls: ['./asset-processing.component.scss'],
  standalone: true,
  imports: [
    AssetComponent,
    ButtonModule,
    CardModule,
    ChartModule,
    CommonModule,
    DialogModule,
    Select,
    FormsModule,
    InputIconModule,
    IconFieldModule,
    InputTextModule,
    STIGManagerAssetsTableComponent,
    TableModule,
    TabsModule,
    TenableAssetsTableComponent,
    TooltipModule,
  ],
  providers: [DialogService],
})
export class AssetProcessingComponent implements OnInit, OnDestroy {
  @ViewChild('assetTable') assetTable!: Table;
  public assetLabel: any[] = [];
  chartData: any;
  chartOptions: any;
  cols!: Column[];
  exportColumns!: Column[];
  data: AssetEntry[] = [];
  filterValue: string = '';
  assets: AssetEntry[] = [];
  asset: AssetEntry = {
    assetId: '',
    assetName: '',
    description: '',
    ipAddress: '',
    macAddress: '',
  };
  selectedCollection: any;
  assetDialogVisible: boolean = false;
  selectedAssets: AssetEntry[] = [];
  collectionOrigin: string;
  originCollectionId: number;
  protected accessLevel: number;
  user: any;
  payload: any;
  private payloadSubscription: Subscription[] = [];
  private subs = new SubSink();
  private subscriptions = new Subscription();

  constructor(
    private assetService: AssetService,
    private setPayloadService: PayloadService,
    private sharedService: SharedService,
    private collectionsService: CollectionsService
  ) {
    this.initializeChartOptions();
  }

  async ngOnInit() {
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
      })
    );

    this.collectionsService.getCollectionBasicList().subscribe({
      next: data => {
        const selectedCollectionData = data.find(
          (collection: any) => collection.collectionId === this.selectedCollection
        );
        if (selectedCollectionData) {
          this.collectionOrigin = selectedCollectionData.collectionOrigin;
          this.originCollectionId = selectedCollectionData.originCollectionId;
        }
      },
      error: () => {
        this.collectionOrigin = '';
      },
    });

    this.setPayload();
    this.initializeColumns();
  }

  private initializeChartOptions() {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: true } },
        y: {
          beginAtZero: true,
          grace: '5%',
          grid: { display: false },
          ticks: {
            font: { weight: 600 }
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            font: {
              size: 13,
              family: 'sans-serif',
              weight: 600
            }
          }
        }
      }
    };
  }

  async setPayload() {
    await this.setPayloadService.setPayload();
    this.payloadSubscription.push(
      this.setPayloadService.user$.subscribe(user => {
        this.user = user;
      }),
      this.setPayloadService.payload$.subscribe(payload => {
        this.payload = payload;
      }),
      this.setPayloadService.accessLevel$.subscribe(level => {
        this.accessLevel = level;
        if (this.accessLevel > 0) {
          this.getAssetData();
        }
      })
    );
  }

  getAssetData() {
    if (!this.payload) return;

    this.subs.sink = forkJoin([
      this.assetService.getAssetsByCollection(this.user.lastCollectionAccessedId),
      this.assetService.getCollectionAssetLabel(this.payload.lastCollectionAccessedId)
    ]).subscribe(
      ([assetData, assetLabelResponse]: any) => {
        if (!Array.isArray(assetData)) {
          console.error('Unexpected response format:', assetData);
          return;
        }
        if (!Array.isArray(assetLabelResponse.assetLabel)) {
          console.error('assetLabelResponse.assetLabel is not an array', assetLabelResponse.assetLabel);
          return;
        }

        this.assetLabel = assetLabelResponse.assetLabel;
        this.setLabelChartData(this.assetLabel);

        this.data = (assetData as AssetEntry[])
          .map(asset => ({
            ...asset,
            assetId: Number(asset.assetId),
          }))
          .sort((a, b) => a.assetId - b.assetId);
        this.assets = this.data;
      },
      error => {
        console.error('Failed to fetch assets by collection', error);
      }
    );
  }

  initializeColumns() {
    this.cols = [
      {
        field: 'assetId',
        header: 'Asset ID',
        customExportHeader: 'Asset Identifier',
      },
      { field: 'assetName', header: 'Asset Name' },
      { field: 'description', header: 'Description' },
      { field: 'ipAddress', header: 'IP Address' },
      { field: 'macAddress', header: 'MAC Address' },
    ];
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    if (this.assetTable) {
      this.assetTable.filterGlobal(filterValue, 'contains');
    }
  }

  clear() {
    if (this.assetTable) {
      this.assetTable.clear();
    }
    this.filterValue = '';
    this.data = [...this.assets];
  }

  setLabelChartData(assetLabel: any[]) {
    this.chartData = {
      labels: ['Assets'],
      datasets: assetLabel.map(item => ({
        label: item.label,
        data: [item.labelCount]
      }))
    };
  }

  exportChart() {
    const canvas = document.getElementsByTagName('canvas')[0];
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'C-PAT_Asset_Label_Chart.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }

  setAsset(assetId: number) {
    const selectedData = this.data.find(asset => asset.assetId === assetId);
    if (selectedData) {
      this.asset = { ...selectedData };
      this.assetDialogVisible = true;
    } else {
      this.asset = {
        assetId: '',
        assetName: '',
        description: '',
        ipAddress: '',
        macAddress: '',
      };
    }
  }

  addAsset() {
    this.asset = {
      assetId: 'ADDASSET',
      assetName: '',
      description: '',
      ipAddress: '',
      macAddress: '',
    };
    this.assetDialogVisible = true;
  }

  resetData() {
    this.asset = {
      assetId: '',
      assetName: '',
      description: '',
      ipAddress: '',
      macAddress: '',
    };
    this.getAssetData();
  }

  closeAssetDialog() {
    this.assetDialogVisible = false;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.subscriptions.unsubscribe();
    this.payloadSubscription.forEach(subscription => subscription.unsubscribe());
  }
}
