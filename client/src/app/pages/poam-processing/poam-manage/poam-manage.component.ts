/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { SubSink } from 'subsink';
import { PoamService } from '../poams.service';
import { CollectionsService } from '../../admin-processing/collection-processing/collections.service';
import { SharedService } from '../../../common/services/shared.service';
import { Subscription, forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { PayloadService } from '../../../common/services/setPayload.service';

interface LabelInfo {
  poamId: number;
  labelId: number;
  labelName: string;
}

@Component({
  selector: 'cpat-poam-manage',
  templateUrl: './poam-manage.component.html',
  styleUrls: ['./poam-manage.component.scss'],
})
export class PoamManageComponent implements OnInit, AfterViewInit, OnDestroy {
  advancedSeverityseverityPieChartData: any[] = [];
  advancedStatusPieChartData: any[] = [];
  approvalColumns = ['POAM ID', 'Adjusted Severity', 'Approval Status', 'POAM'];
  private subs = new SubSink();
  public isLoggedIn = false;
  public monthlyPoamStatus: any[] = [];
  public poamCountData: any[] = [];
  approvalData: any[] = [];
  poams: any[] = [];
  poamsForChart: any[] = [];
  selectedPoamId: any;
  users: any;
  userPermissions: any = [];
  collection: any;
  selectedCollection: any;
  selectedCollectionName: any;
  allPoams: any[] = [];
  poamsNeedingAttention: any[] = [];
  submittedPoams: any[] = [];
  poamsPendingApproval: any[] = [];
  user: any;
  payload: any;
  protected accessLevel: any;
  private subscriptions = new Subscription();
  private payloadSubscription: Subscription[] = [];

  constructor(
    private collectionService: CollectionsService,
    private poamService: PoamService,
    private sharedService: SharedService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private setPayloadService: PayloadService,
  ) {
  }

  async ngOnInit() {
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
      })
    );
    this.setPayload();
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
          this.getPoamData();
        }
      })
    );
  }

  async getPoamData() {
    this.subs.sink = forkJoin([
      await this.poamService.getPoamsByCollection(
        this.payload.lastCollectionAccessedId, true, true, false
      ),
      await this.poamService.getPoamLabels(
        this.payload.lastCollectionAccessedId
      ),
      await this.collectionService.getCollectionBasicList()
    ]).subscribe(([poams, poamLabelResponse, basicListData]: any) => {
      if (!Array.isArray(poamLabelResponse)) {
        console.error(
          'poamLabelResponse.poamLabels is not an array',
          poamLabelResponse
        );
      }

      const poamLabelMap: { [poamId: number]: string[] } = {};
      (poamLabelResponse as LabelInfo[]).forEach(labelInfo => {
        if (!poamLabelMap[labelInfo.poamId]) {
          poamLabelMap[labelInfo.poamId] = [];
        }
        poamLabelMap[labelInfo.poamId].push(labelInfo.labelName);
      });

      this.poams = poams.map((poam: any) => ({
        ...poam,
        labels: poamLabelMap[poam.poamId] || ['']
      }));

      const selectedCollection = basicListData.find(
        (collection: any) => collection.collectionId === this.selectedCollection
      );
      this.selectedCollectionName = selectedCollection?.collectionName;

      this.updateGridData();
      this.updateAdvancedPieChart();
    });
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  onPoamsChange(updatedPoams: any[]) {
    this.poamsForChart = updatedPoams;
  }

  managePoam(row: any) {
    const poamId = row.data.poamId;
    this.router.navigateByUrl(`/poam-processing/poam-details/${poamId}`);
  }

  updateGridData() {
    this.allPoams = this.poams;

    const currentDate = new Date();
    const thirtyDaysFromNow = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    this.poamsNeedingAttention = this.poams.filter(poam => {
      if (!poam.scheduledCompletionDate) {
        return false;
      }
      const scheduledCompletionDate = new Date(poam.scheduledCompletionDate);
      if (isNaN(scheduledCompletionDate.getTime())) {        
        return false;
      }
      return scheduledCompletionDate <= thirtyDaysFromNow && poam.status != 'Closed' && poam.status != 'Draft';
    });

    this.submittedPoams = this.poams.filter(poam => poam.status != 'Closed' && poam.submitterId === this.user.userId);

    this.poamsPendingApproval = this.poams.filter(poam => poam.status === 'Submitted' || poam.status === 'Extension Requested');
  }

  updateAdvancedPieChart(): void {
    const severityOrder = ['CAT I - Critical' || 'CAT I - High', 'CAT II - Medium', 'CAT III - Low' || 'CAT III - Informational'];
    const severityLabel = ['CAT I', 'CAT II', 'CAT III'];
    const statusOrder = ['Submitted', 'Approved', 'Closed', 'Rejected', 'Extension Requested', 'Expired', 'Draft'];

    const severityCounts: { [severity: string]: number } = {};
    const statusCounts: { [status: string]: number } = {};

    this.poams.forEach(poam => {
      const severity = poam.rawSeverity;
      severityCounts[severity] = (severityCounts[severity] || 0) + 1;
    });

    const severityPieChartData = severityOrder.map((severity, index) => ({
      name: severityLabel[index],
      value: severityCounts[severity] || 0,
    }));

    this.advancedSeverityseverityPieChartData = severityPieChartData;

    this.poams.forEach(poam => {
      const status = poam.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const statusPieChartData = statusOrder.map((status, index) => ({
      name: statusOrder[index],
      value: statusCounts[status] || 0,
    }));

    this.advancedStatusPieChartData = statusPieChartData;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
