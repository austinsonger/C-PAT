/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, Observable, of, Subscription } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { CollectionsService } from '../../collection-processing/collections.service';
import { PoamService } from '../poams.service';
import { Router } from '@angular/router';
import { SubSink } from 'subsink';
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../Shared/components/confirmation-dialog/confirmation-dialog.component';
import { NbDialogService, NbWindowRef } from '@nebular/theme';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { UsersService } from '../../user-processing/users.service'
import { Settings } from 'angular2-smart-table';
import { SharedService } from '../../../Shared/shared.service';
import { SmartTableDatepickerComponent } from 'src/app/Shared/components/smart-table/smart-table-datepicker.component';
import { SmartTableTextareaComponent } from 'src/app/Shared/components/smart-table/smart-table-textarea.component';
import { SmartTableInputDisabledComponent } from 'src/app/Shared/components/smart-table/smart-table-inputDisabled.component';
import { SmartTableSelectComponent } from 'src/app/Shared/components/smart-table/smart-table-select.component';
import { addDays, format, formatISO, isAfter, isValid, parseISO } from 'date-fns';

interface Label {
  labelId?: number;
  labelName?: string;
  description?: string;
}

interface Permission {
  userId: number;
  collectionId: number;
  accessLevel: number;
}

@Component({
  selector: 'cpat-poamdetails',
  templateUrl: './poam-details.component.html',
  styleUrls: ['./poam-details.component.scss'],
  providers: [DatePipe]
})
export class PoamDetailsComponent implements OnInit {

  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;

  labelList: any;

  poamLabels: any[] = [];
  users: any;
  user: any;
  poam: any;
  poamId: string = "";
  payload: any;
  token: any;
  dates: any = {};
  collectionUsers: any;
  collectionSubmitters: any[] = [];
  collection: any;
  collectionApprovers: any;
  collectionBasicList: any[] = [];
  poamApprovers: any[] = [];
  poamMilestones: any[] = [];
  assets: any;
  poamAssets: any[] = [];
  poamAssignees: any[] = [];
  canModifySubmitter: boolean = false;
  showApprove: boolean = false;
  showSubmit: boolean = false;
  showClose: boolean = false;
  showCheckData: boolean = false;
  stigmanCollections: any[] = [];
  stigmanSTIGs: any;
  selectedStig: any = null;
  selectedStigTitle: string = '';
  selectedStigBenchmarkId: string = '';
  assetList: any[] = [];
  stateData: any;
  vulnerabilitySources: string[] = [
    "Assured Compliance Assessment Solution (ACAS) Nessus Scanner",
    "STIG",
    "RMF Controls",
    "EXORD",
  ];
  selectedCollection: any;
  private subscriptions = new Subscription();

  poamAssetsSettings: Settings = {
    add: {
      addButtonContent: '<img src="../../../../assets/icons/plus-outline.svg" width="20" height="20" >',  
      createButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >',       confirmCreate: true,
    },
    edit: {
      editButtonContent: '<img src="../../../../assets/icons/edit-outline.svg" width="20" height="20" >',
      saveButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >',     },
    delete: {
      deleteButtonContent: '<img src="../../../../assets/icons/trash-2-outline.svg" width="20" height="20" >',
      confirmDelete: true,
    },
    actions: {
      columnTitle: '',
      add: true,
      edit: false,
      delete: true,
    },
    columns: {
      assetId: {
        title: 'Asset',
        width: '100%',
        isFilterable: false,
        type: 'html',
        valuePrepareFunction: (_cell: any, row: any) => {
          const assetId = parseInt(row.value, 10);
          const asset = this.assets.find((tl: {assetId: number;}) => tl.assetId === assetId);
          return asset ? `Asset ID: ${assetId} - Asset Name: ${asset.assetName}` : `Asset ID: ${assetId}`;
      },
        editor: {
          type: 'list',
          config: {
            list: [],
          },
        },
      },
    },
    hideSubHeader: false,
  };

  poamApproverSettings: Settings = {
    add: {
      addButtonContent: '<img src="../../../../assets/icons/plus-outline.svg" width="20" height="20" >',  
      createButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >',       confirmCreate: true,
    },
    edit: {
      editButtonContent: '<img src="../../../../assets/icons/edit-outline.svg" width="20" height="20" >',
      saveButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >',       confirmSave: true,
    },
    delete: {
      deleteButtonContent: '<img src="../../../../assets/icons/trash-2-outline.svg" width="20" height="20" >',
      confirmDelete: true,
    },
    actions: {
      columnTitle: '',
      add: true,
      edit: false,
      delete: true,
    },
    columns: {
      userId: {
        title: 'Approver',
        width: '20%',
        isFilterable: false,
        type: 'html',
        isEditable: false,
        isAddable: true,
        valuePrepareFunction: (_cell: any, row: any) => {
          try {
            var userId = row.value;
            if (userId === undefined || userId === null) {
              return '';
            }
            var user = this.collectionApprovers.find((tl: any) => tl.userId === parseInt(userId, 10));
            return user ? user.fullName : userId.toString();
          } catch (error) {
            console.error("Error in valuePrepareFunction: ", error);
            return userId ? userId.toString() : '';
          }
        },
        editor: {
          type: 'list',
          config: {
            list: [],
          },
        },
      },
      approvalStatus: {
        title: 'Approval Status',
        width: '20%',
        isFilterable: false,
        type: 'html',
        isAddable: false,
        valuePrepareFunction: (_cell: any, row: any) => {
          return (row.value) ? row.value : 'Not Reviewed'
        },
        editor: {
          type: 'custom',
          component: SmartTableInputDisabledComponent,
          },
      },
      approvedDate: {
        title: 'Approved Date',
        width: '20%',
        isFilterable: false,
        type: 'html',
        isEditable: false,
        isAddable: false,
        valuePrepareFunction: (_cell: any, row: any) => {
          return (row.value) ? row.value.substr(0, 10) : 'Not Reviewed';
        },
        editor: {
          type: 'custom',
          component: SmartTableInputDisabledComponent,
        },
      },
      comments: {
        title: 'Comments',
        width: '40%',
        isFilterable: false,
        editor: {
          type: 'custom',
          component: SmartTableTextareaComponent,
        },
        isEditable: true,
        isAddable: true,
        valuePrepareFunction: (_cell: any, row: any) => {
          return (row.value) ? row.value : ' '
        },
      },
    },
    hideSubHeader: false,
  };

  poamAssigneesSettings: Settings = {
    add: {
      addButtonContent: '<img src="../../../../assets/icons/plus-outline.svg" width="20" height="20" >',  
      createButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >',       confirmCreate: true,
    },
    edit: {
      editButtonContent: '<img src="../../../../assets/icons/edit-outline.svg" width="20" height="20" >',
      saveButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >',     },
    delete: {
      deleteButtonContent: '<img src="../../../../assets/icons/trash-2-outline.svg" width="20" height="20" >',
      confirmDelete: true,
    },
    actions: {
      columnTitle: '',
      add: true,
      edit: false,
      delete: true,
    },
    columns: {
      userId: {
        title: 'Members Assigned',
        width: '100%',
        isFilterable: false,
        type: 'html',
        valuePrepareFunction: (_cell: any, row: any) => {
          try {
            var userId = row.value;
            if (userId === undefined || userId === null) {
              return '';
            }
            var user = this.collectionUsers.find((tl: any) => tl.userId === userId);
            return user ? user.fullName : userId.toString();
          } catch (error) {
            console.error("Error in valuePrepareFunction: ", error);
            return userId ? userId.toString() : '';
          }
        },   
        editor: {
          type: 'list',
          config: {
            list: [],
          },
        },
      },
    },
    hideSubHeader: false,
  };

  poamMilestoneSettings: Settings = {
    add: {
      addButtonContent: '<img src="../../../../assets/icons/plus-outline.svg" width="20" height="20" >',
      createButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >',
      confirmCreate: true,
    },
    edit: {
      editButtonContent: '<img src="../../../../assets/icons/edit-outline.svg" width="20" height="20" >',
      saveButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >',
      confirmSave: true,
    },
    delete: {
      deleteButtonContent: '<img src="../../../../assets/icons/trash-2-outline.svg" width="20" height="20" >',
      confirmDelete: true,
    },
    actions: {
      columnTitle: '',
      add: true,
      edit: true,
      delete: true,
    },
    columns: {
      milestoneComments: {
        title: 'Milestone Comments',
        width: '60%',
        isFilterable: false,
        editor: {
          type: 'custom',
          component: SmartTableTextareaComponent,
        },
        isEditable: true,
        isAddable: true,
        valuePrepareFunction: (_cell: any, row: any) => {
          return (row.value) ? row.value : ' '
        },
      },
      milestoneDate: {
        title: 'Milestone Date',
        width: '20%',
        isFilterable: false,
        type: 'text',
        isEditable: true,
        isAddable: true,
        valuePrepareFunction: (_cell: any, row: any) => {
          return row.value ? format(row.value, 'yyyy-MM-dd') : '';
        },
        editor: {
          type: 'custom',
          component: SmartTableDatepickerComponent,
        },
      },
      milestoneStatus: {
        title: 'Milestone Status',
        width: '20%',
        isFilterable: false,
        type: 'html',
        valuePrepareFunction: (_cell: any, row: any) => {
          return (row.value) ? row.value : 'Pending'
        },
        editor: {
          type: 'custom',
          component: SmartTableSelectComponent,
          config: {
            list: [
              { value: 'Pending', title: 'Pending' },
              { value: 'Complete', title: 'Complete' }
            ],
          },
        },
      },
    },
    hideSubHeader: false,
  };

  poamLabelsSettings: Settings = {
    add: {
      addButtonContent: '<img src="../../../../assets/icons/plus-outline.svg" width="20" height="20" >',
      createButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >',
      confirmCreate: true,
    },
    edit: {
      editButtonContent: '<img src="../../../../assets/icons/edit-outline.svg" width="20" height="20" >',
      saveButtonContent: '<img src="../../../../assets/icons/checkmark-square-2-outline.svg" width="20" height="20" >',
      cancelButtonContent: '<img src="../../../../assets/icons/close-square-outline.svg" width="20" height="20" >',
      confirmSave: true
    },
    delete: {
      deleteButtonContent: '<img src="../../../../assets/icons/trash-2-outline.svg" width="20" height="20" >',
      confirmDelete: true,
    },
    actions: {
      columnTitle: '',
      add: true,
      edit: false,
      delete: true,
    },
    columns: {
      labelId: {
        title: 'Label',
        width: '100%',
        isFilterable: false,
        type: 'html',
        valuePrepareFunction: (cell, row) => {
          const label = this.poamLabels.find(l => l.labelId === cell);
          return label ? `${label.labelName}` : `Label ID: ${cell}`;
        },
        editor: {
          type: 'custom',
          component: SmartTableSelectComponent,
          config: {
            list: [],
          },
        },
      },
    },
    hideSubHeader: false,
  };

  modalWindow: NbWindowRef | undefined
  dialog!: TemplateRef<any>;

  private subs = new SubSink()

  constructor(
    private collectionService: CollectionsService,
    private poamService: PoamService,
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private router: Router,
    private dialogService: NbDialogService,
    private datePipe: DatePipe,
    private readonly keycloak: KeycloakService,
    private userService: UsersService,
  ) { }

  onDeleteConfirm() { }

  ngOnInit() {
    this.route.params.subscribe(async params => {
      this.stateData = history.state;
      this.poamId = params['poamId'];
      this.isLoggedIn = await this.keycloak.isLoggedIn();
      if (this.isLoggedIn) {
        this.userProfile = await this.keycloak.loadUserProfile();
        this.setPayload();
      }
    });
    this.subscriptions.add(
      this.sharedService.selectedCollection.subscribe(collectionId => {
        this.selectedCollection = collectionId;
      })
    );
  }

  setPayload() {
    this.user = null;
    this.payload = null;

    this.userService.getCurrentUser().subscribe({
      next: (response: any) => {
        if (response && response.userId) {
          this.user = response;
          if (this.user.accountStatus === 'ACTIVE') {

            const mappedPermissions = this.user.permissions.map((permission: Permission) => ({
              collectionId: permission.collectionId,
              accessLevel: permission.accessLevel,
            }));

            this.payload = {
              ...this.user,
              collections: mappedPermissions
            };

            let selectedPermissions = this.payload.collections.find((x: { collectionId: any; }) => x.collectionId == this.payload.lastCollectionAccessedId);
            let myRole = '';

            if (!selectedPermissions && !this.user.isAdmin) {
              myRole = 'none';
            } else {
              myRole = (this.user.isAdmin) ? 'admin' :
                (selectedPermissions.accessLevel === 2) ? 'submitter' :
                  (selectedPermissions.accessLevel === 1) ? 'approver' :
                    (selectedPermissions.accessLevel === 3) ? 'viewer' :
                      'none';
            }
            this.payload.role = myRole;
            this.showApprove = ['admin', 'submitter', 'approver'].includes(this.payload.role);
            this.showClose = ['admin', 'submitter'].includes(this.payload.role);
            this.showSubmit = ['admin', 'submitter'].includes(this.payload.role);
            this.canModifySubmitter = ['admin', 'submitter'].includes(this.payload.role);
            this.updateTableSettings();
            this.getData();
          }
        } else {
          console.error('User data is not available or user is not active');
        }
      },
      error: (error) => {
        console.error('An error occurred:', error);
      }
    });
  }


  getData() {
    this.getLabelData();
    if (this.poamId == undefined || !this.poamId) return;
    if (this.poamId === "ADDPOAM") {
      this.createNewPoam();
    } else {
      forkJoin([
        this.poamService.getPoam(this.poamId),
        this.poamService.getCollection(this.payload.lastCollectionAccessedId, this.payload.userName),
        this.collectionService.getUsersForCollection(this.payload.lastCollectionAccessedId),
        this.poamService.getAssetsForCollection(this.payload.lastCollectionAccessedId),
        this.poamService.getPoamAssets(this.poamId),
        this.poamService.getPoamAssignees(this.poamId),
        this.poamService.getPoamApprovers(this.poamId),
        this.poamService.getPoamMilestones(this.poamId),
        this.poamService.getPoamLabelsByPoam(this.poamId)
      ]).subscribe(([poam, collection, users, collectionAssets, poamAssets, assignees, poamApprovers, poamMilestones, poamLabels]: any) => {
        this.poam = { ...poam };
        this.dates.scheduledCompletionDate = (this.poam.scheduledCompletionDate) ? parseISO(this.poam.scheduledCompletionDate.substr(0, 10)) : '';
        this.dates.iavComplyByDate = (this.poam.iavComplyByDate) ? parseISO(this.poam.iavComplyByDate.substr(0, 10)) : '';
        this.dates.submittedDate = (this.poam.submittedDate) ? parseISO(this.poam.submittedDate.substr(0, 10)) : '';
        this.dates.closedDate = (this.poam.closedDate) ? parseISO(this.poam.closedDate.substr(0, 10)) : null;
        this.collection = collection.collection;
        this.collectionUsers = users;
        this.assets = collectionAssets;
        this.poamAssignees = assignees;
        this.poamApprovers = poamApprovers;
        this.poamMilestones = poamMilestones.poamMilestones.map((milestone: any) => ({
          ...milestone,
          milestoneDate: (milestone.milestoneDate) ? parseISO(milestone.milestoneDate.substr(0, 10)) : null,
        }));
        this.selectedStigTitle = this.poam.stigTitle;
        this.selectedStigBenchmarkId = this.poam.stigBenchmarkId;
        this.collectionApprovers = this.collectionUsers.filter((user: Permission) => user.accessLevel >= 2 || this.user.isAdmin);
        if (this.collectionApprovers.length > 0 && (this.poamApprovers == undefined || this.poamApprovers.length == 0)) {
          this.addDefaultApprovers();
        }
        if (this.collectionUsers) {
          this.collectionUsers.forEach((user: any) => {
            if (user.accessLevel >= 2) {
              this.collectionSubmitters.push({ ...user });
            }
          });
        }
        if (this.stateData.vulnerabilitySource && this.stateData.benchmarkId) {
          this.poamAssets = [];
          this.validateStigManagerCollection();
        } else {
          this.poamAssets = poamAssets;
        }
        this.poamLabels = poamLabels;
        this.setChartSelectionData();
      });
      this.keycloak.getToken().then((token) => {
        this.sharedService.getSTIGsFromSTIGMAN(token).subscribe({
          next: (data) => {
            this.stigmanSTIGs = data.map((stig: any) => ({
              title: stig.title,
              benchmarkId: stig.benchmarkId
            }));

            if (!data || data.length === 0) {
              console.warn("Unable to retrieve list of current STIGs from STIGMAN.");
            }
          },
        });
      });
    }
  }

  createNewPoam() {
    this.canModifySubmitter = true;

    forkJoin([
      this.poamService.getCollection(this.payload.lastCollectionAccessedId, this.payload.userName),
      this.collectionService.getUsersForCollection(this.payload.lastCollectionAccessedId),
      this.poamService.getAssetsForCollection(this.payload.lastCollectionAccessedId),
    ]).subscribe(([collection, users, collectionAssets]: any) => {
      this.poam = {
        poamId: "ADDPOAM",
        collectionId: this.payload.lastCollectionAccessedId,
        vulnerabilitySource: this.stateData.vulnerabilitySource || "",
        aaPackage: "",
        vulnerabilityId: this.stateData.vulnerabilityId || "",
        description: "",
        rawSeverity: this.stateData.severity || "",
        scheduledCompletionDate: '',
        submitterId: this.payload.userId,
        status: "Draft",
        submittedDate: new Date().toISOString().slice(0, 10),
      };

      this.dates.scheduledCompletionDate = this.poam.scheduledCompletionDate;
      this.dates.iavComplyByDate = this.poam.iavComplyByDate;
      this.dates.submittedDate = this.poam.submittedDate;

      this.collection = collection;
      this.collectionUsers = users;
      this.assets = collectionAssets;
      this.poamAssets = [];
      this.poamAssignees = [];
      this.collectionApprovers = [];
      this.collectionApprovers = this.collectionUsers.filter((user: Permission) => user.accessLevel >= 2 || this.user.isAdmin);
      this.collectionSubmitters = [];
      if (this.collectionUsers) {
        this.collectionUsers.forEach((user: any) => {
          if (user.accessLevel >= 2) {
            this.collectionSubmitters.push({ ...user });
          }
        });
      }
      this.setChartSelectionData();

      this.keycloak.getToken().then((token) => {
        this.sharedService.getSTIGsFromSTIGMAN(token).subscribe({
          next: (data) => {
            this.stigmanSTIGs = data.map((stig: any) => ({
              title: stig.title,
              benchmarkId: stig.benchmarkId
            }));

            if (!data || data.length === 0) {
              console.warn("Unable to retrieve list of current STIGs from STIGMAN.");
            }

            if (this.stateData.vulnerabilitySource && this.stateData.benchmarkId) {
              this.poam.vulnerabilitySource = this.stateData.vulnerabilitySource;
              this.poam.vulnerabilityId = this.stateData.vulnerabilityId;
              this.poam.rawSeverity = this.stateData.severity;
              this.poam.stigCheckData = this.stateData.ruleData;
              const benchmarkId = this.stateData.benchmarkId;
              const selectedStig = this.stigmanSTIGs.find((stig: any) => stig.benchmarkId === benchmarkId);
              this.validateStigManagerCollection();
              if (selectedStig) {
                this.onStigSelected(selectedStig);
              }
              else {
                this.poam.stigBenchmarkId = benchmarkId;
              }
            }
          },
        });
      });
    });
  }

  getLabelData() {
    this.subs.sink = this.poamService.getLabels(this.selectedCollection).subscribe((labels: any) => {
      this.labelList = labels;
      this.updateLabelEditorConfig();
    });
  }

  getPoamLabels() {
    this.subs.sink = this.poamService.getPoamLabelsByPoam(this.poamId).subscribe((poamLabels: any) => {
      this.poamLabels = poamLabels;
    });
  }

  updateLabelEditorConfig() {
    let labelSettings = this.poamLabelsSettings;

    const labelOptionsList = [
      ...this.labelList.map((label: any) => ({
        title: label.labelName,
        value: label.labelId
      }))
    ];

    labelSettings.columns['labelId'].editor = {
      type: 'custom',
      component: SmartTableSelectComponent,
      config: {
        list: labelOptionsList,
      },
    };
this.poamLabelsSettings = Object.assign({}, labelSettings);
 }

  addDefaultApprovers() {
    this.collectionApprovers.forEach(async (collectionApprover: any) => {
      let approver: any = {
        poamId: +this.poamId,
        collectionId: +collectionApprover.collectionId,
        userId: +collectionApprover.userId,
        approvalStatus: 'Not Reviewed',
        poamLog: [{ userId: this.user.userId }],
      }
      await this.poamService.addPoamApprover(approver).subscribe((res: any) => {
        approver.fullName = collectionApprover.fullName;
        approver.firstName = collectionApprover.firstName;
        approver.lastName = collectionApprover.lastName;
        approver.userEmail = collectionApprover.userEmail;

        if (approver) {
          this.poamApprovers.push(approver);
          this.poamApprovers = [...this.poamApprovers];
        }
      })
    })
  }

  updateTableSettings(){

    if (this.showApprove)
    {
      this.poamApproverSettings.columns['approvalStatus'] = {
        title: 'Approval Status',
        width: '20%',
        isFilterable: false,
        isEditable: true,
        type: 'html',
        isAddable: false,
        valuePrepareFunction: (_cell: any, row: any) => {
          return (row.value) ? row.value : 'Not Reviewed'
        },
        editor: {
          type: 'custom',
          component: SmartTableInputDisabledComponent,
          config: {
            list: [
              { value: 'Not Reviewed', title: 'Not Reviewed' },
              { value: 'Approved', title: 'Approved' },
              { value: 'Rejected', title: 'Rejected' }
            ],
          },
        },
      }
    }
  }

  setChartSelectionData() {
    this.collectionSubmitters = [];
  
    if (this.collectionUsers) {
      this.collectionUsers.forEach((user: any) => {
        if (user.accessLevel >= 2) this.collectionSubmitters.push({ ...user });
      });
    }
  
    let assetSettings = this.poamAssetsSettings;
    const assetList = [
      ...this.assets.map((asset: any) => ({
        title: asset.assetName,
        value: asset.assetId.toString(),
      }))
    ];
    
    assetSettings.columns['assetId'].editor = {
      type: 'custom',
      component: SmartTableSelectComponent,
      config: {
        list: assetList,
      },
    };    
    this.poamAssetsSettings = Object.assign({}, assetSettings);
    
  
    let assigneeSettings = this.poamAssigneesSettings;
    const assigneeList = [
      ...this.collectionUsers.map((assignee: any) => ({
        title: assignee.fullName,
        value: assignee.userId.toString(),
      }))
    ];    
    assigneeSettings.columns['userId'].editor = {
      type: 'custom',
      component: SmartTableSelectComponent,
      config: {
        list: assigneeList,
      },
    };    
    this.poamAssigneesSettings = Object.assign({}, assigneeSettings);
  
    let approverSettings = this.poamApproverSettings;
    const approverList = [
      ...this.collectionApprovers.map((approver: any) => ({
        title: approver.fullName,
        value: approver.userId.toString(),
      }))
    ];
    approverSettings.columns['userId'].editor = {
      type: 'custom',
      component: SmartTableSelectComponent,
      config: {
        list: approverList,
      },
    };
    this.poamApproverSettings = Object.assign({}, approverSettings);
  }
  
  async approvePoam(poam: any) {
    await this.router.navigateByUrl("/poam-approve/" + this.poam.poamId);
  }

  async approvePoamAll(poam: any) {

    let options = new ConfirmationDialogOptions({
      header: "Warning",
      body: "You are about to mark all approvers on this POAM as having approved, are you sure?",
      button: {
        text: "ok",
        status: "Warning",
      },
      cancelbutton: "true",
    });

    await this.confirm(options).subscribe(async (res: boolean) => {
      if (res) {
        if (!this.validateData()) return;

        this.poamApprovers.forEach(async approver => {
          let updApprover = {
            poamId: +approver.poamId,
            userId: +approver.userId,
            approvalStatus: 'Approved',
            approvedDate: this.datePipe.transform(new Date(), 'yyyy-MM-dd'),
            comments: approver.comments + " - Approved ALL by submitter or admin"
          }
          await this.poamService.updatePoamApprover(updApprover).subscribe((res: any) =>{
          })

        })
        this.poam.status = "Approved";      

        this.dates.iavComplyByDate = this.poam.iavComplyByDate;
        this.poam.scheduledCompletionDate = this.dates.scheduledCompletionDate;
        this.poam.submittedDate = this.dates.submittedDate;
    
        this.poam.requiredResources = (this.poam.requiredResources) ? this.poam.requiredResources : ""
        this.poam.vulnIdRestricted = (this.poam.vulnIdRestricted) ? this.poam.vulnIdRestricted : ""
        this.subs.sink = this.poamService.updatePoam(this.poam).subscribe(data => {
          this.poam = data;
          this.getData();
          this.showConfirmation("Updated POAM", "Success", "Success", true);
        });
      }
    });
  }

  extendPoam(poamId: any) {
    if (this.poam.poamId === "ADDPOAM") {
      this.showConfirmation("You may not extend POAM until after it has been saved.", "Information", "warning");
      return;
    }
    this.router.navigate(['/poam-extend', this.poam.poamId]);
  }

  poamLog(poamId: any) {
    if (this.poam.poamId === "ADDPOAM") {
      this.showConfirmation("You may not view a POAM log until after the POAM has been saved.", "Information", "warning");
      return;
    }
    this.router.navigate(['/poam-log', this.poam.poamId]);
  }

  closePoam(poam: any) {
    if (this.poam.poamId === "ADDPOAM") {
      this.showConfirmation("You may not close a POAM until after it has been saved.","Information","warning");
      return;
    }
    this.poam.status = "Closed";
    this.poam.closedDate = new Date().toISOString().slice(0, 10);
    this.savePoam(this.poam);
  }

  savePoam(poam: any) {
    if (!this.validateData()) return;
    this.poam.scheduledCompletionDate = format(this.dates.scheduledCompletionDate, "yyyy-MM-dd");
    this.poam.submittedDate = format(this.dates.submittedDate, "yyyy-MM-dd");
    this.poam.requiredResources = this.poam.requiredResources ? this.poam.requiredResources : "";
    this.poam.vulnIdRestricted = this.poam.vulnIdRestricted ? this.poam.vulnIdRestricted : "";
    this.poam.iavComplyByDate = this.poam.iavComplyByDate ? format(this.dates.iavComplyByDate, "yyyy-MM-dd") : null;
    this.poam.poamLog = [{ userId: this.user.userId }];

    if (this.poam.status === "Closed") {
      this.poam.closedDate = new Date().toISOString().slice(0, 10);
    }

    if (this.poam.poamId === "ADDPOAM") {
      this.poam.poamId = 0;
      let assignees: any[] = [];
      let assets: any[] = [];
      if (this.poamAssignees) {
        this.poamAssignees.forEach((user: any) => {
          assignees.push({ userId: +user.userId })
        });
      }
      this.poam.assignees = assignees;
      if (this.poamAssets) {
        this.poamAssets.forEach((asset: any) => {
          assets.push({ assetId: +asset.assetId })
        });
      }
      this.poam.assets = assets;
      this.poamService.postPoam(this.poam).subscribe({
        next: (res) => {
          if (res.null || res.null == "null") {
            this.showConfirmation("unexpected error adding poam");
          } else {
            this.showConfirmation("Added POAM: " + res.poamId, "Success", "Success", true);
            this.poam.poamId = res.poamId;
            this.poamService.newPoam(this.poam);
          }
        },
        error: (err) => {
          this.showConfirmation("unexpected error adding poam");
        }
      });
    } else {
      let assets: any[] = [];
      if (this.stateData && this.stateData.vulnerabilityId) {
        this.poamAssets.forEach((asset: any) => {
          assets.push({ assetId: +asset.assetId });
        });
        this.poam.assets = assets;
      }

      this.subs.sink = this.poamService.updatePoam(this.poam).subscribe(data => {
        this.poam = data;
        this.showConfirmation("Updated POAM", "Success", "Success", true);
      });
    }
  }

  onStigSelected(stig: any) {
    this.selectedStig = stig;
    this.selectedStigTitle = stig.title;
    this.selectedStigBenchmarkId = stig.benchmarkId;
    this.poam.stigTitle = stig.title;
    this.poam.stigBenchmarkId = stig.benchmarkId;
  }

  validateStigManagerCollection() {
    this.keycloak.getToken().then((token) => {
      forkJoin([
        this.sharedService.getCollectionsFromSTIGMAN(token).pipe(
          catchError(err => {
            console.error('Failed to fetch from STIGMAN:', err);
            return of([]);
          })
        ),
        this.collectionService.getCollectionBasicList().pipe(
          catchError(err => {
            console.error('Failed to fetch basic collection list:', err);
            return of([]);
          })
        )
      ]).subscribe(([stigmanData, basicListData]) => {
        const stigmanCollectionsMap = new Map(stigmanData.map(collection => [collection.name, collection]));
        const basicListCollectionsMap = new Map(basicListData.map(collection => [collection.collectionId, collection]));

        const selectedCollection = basicListCollectionsMap.get(this.selectedCollection);
        const selectedCollectionName = selectedCollection?.collectionName;
        const stigmanCollection = selectedCollectionName ? stigmanCollectionsMap.get(selectedCollectionName) : undefined;

        if (!stigmanCollection || !selectedCollectionName) {
          this.showConfirmation('Unable to determine matching STIG Manager collection for Asset association. Please ensure that you are creating the POAM in the correct collection.');
          return;
        }
        this.updateAssetSettings(token);
      });
    });
  }

  updateAssetSettings(token: string) {
    this.sharedService.getAffectedAssetsFromSTIGMAN(token, this.selectedCollection).pipe(
      map(data => data.filter(entry => entry.groupId === this.poam.vulnerabilityId)),
      switchMap(filteredData => {
        if (filteredData.length > 0) {
          this.assetList = filteredData[0].assets.map((assets: { name: any; assetId: string; }) => ({
            assetName: assets.name,
            assetId: parseInt(assets.assetId, 10),
          }));

          if (this.poamId !== "ADDPOAM" && this.stateData.vulnerabilitySource === 'STIG') {
            return this.poamService.deletePoamAssetByPoamId(+this.poamId).pipe(
              tap(() => {
              }),
              catchError((error) => {
                console.error('Failed to remove outdated assets:', error);
                return of(null);
              }),
              map(() => filteredData)
            );
          } else {
            return of(filteredData);
          }
        } else {
          return of([]);
        }
      })
    ).subscribe({
      next: (filteredData) => {
        if (filteredData.length > 0) {
          this.poamAssets = this.assetList;
          this.showConfirmation("Asset list updated with STIG Manager findings.");
        } else {
          this.showConfirmation(`No assets found for Vulnerability ID ${this.poam.vulnerabilityId}.`);
        }
      },
      error: (err) => console.error('Failed to fetch affected assets from STIGMAN:', err)
    });
  }

  submitPoam(poam: any) {
    if (this.poam.poamId === "ADDPOAM") {
      this.showConfirmation("You may not submit a POAM until after it has been saved.","Information","warnging");
      return;
    }
    if (this.poam.status === "Closed") {
      this.poam.closedDate = new Date().toISOString().slice(0, 10);
    }
    this.poam.status = "Submitted";
    this.poam.iavComplyByDate = this.poam.iavComplyByDate ? format(this.dates.iavComplyByDate, "yyyy-MM-dd") : null;
    this.poam.scheduledCompletionDate = format(this.dates.scheduledCompletionDate, "yyyy-MM-dd");
    this.poam.submittedDate = format(this.dates.submittedDate, "yyyy-MM-dd");
    this.savePoam(this.poam);
  }

  validateData() {

    if (!this.poam.description) {
      this.showConfirmation("POAM Description is required");
      return false;
    }
    if (!this.poam.status) {
      this.showConfirmation("POAM Status is required");
      return false;
    }
    if (!this.poam.aaPackage) {
      this.showConfirmation("POAM aaPackage is required");
      return false;
    }
    if (!this.poam.vulnerabilitySource) {
      this.showConfirmation("POAM Vulnerability Source is required");
      return false;
    }
    if (!this.poam.rawSeverity) {
      this.showConfirmation("POAM Raw Severity is required");
      return false;
    }
    if (!this.poam.submitterId) {
      this.showConfirmation("POAM Submitter ID is required");
      return false;
    }
    if (!this.dates.scheduledCompletionDate) {
      this.showConfirmation("Scheduled Completion Date is required");
      return false;
    }
    if (this.isIavmNumberValid(this.poam.iavmNumber) && !this.dates.iavComplyByDate) {
      this.showConfirmation("IAV Comply By Date is required if an IAVM Number is provided.");
      return false;
    }
    return true;
  }

  cancelPoam() {
    this.router.navigateByUrl("/poam-processing");
  }

  isIavmNumberValid(iavmNumber: string): boolean {
    return /^\d{4}-[A-Za-z]-\d{4}$/.test(iavmNumber);
  }

  async confirmCreateMilestone(event: any) {
    if (this.poam.poamId === "ADDPOAM") {
      event.confirm.resolve();
      return;
    }

    if (this.poam.status != "Draft") {
      this.showConfirmation("You may only modify the milestone list if poam status is 'Draft'.");
      event.confirm.reject();
      return;
    }

    if (!event.newData.milestoneDate) {
      this.showConfirmation("You must provide a milestone date.");
      event.confirm.reject();
      return;
    }

    const scheduledCompletionDate = parseISO(this.poam.scheduledCompletionDate);
    const milestoneDate = format(event.newData.milestoneDate, "yyyy-MM-dd");

    if (this.poam.extensionTimeAllowed === 0 || this.poam.extensionTimeAllowed == null) {
      if (isAfter(milestoneDate, scheduledCompletionDate)) {
        this.showConfirmation("The Milestone date provided exceeds the POAM scheduled completion date.");
        event.confirm.reject();
        return;
      }
    } else {
      const maxAllowedDate = addDays(scheduledCompletionDate, this.poam.extensionTimeAllowed);

      if (isAfter(milestoneDate, maxAllowedDate)) {
        this.showConfirmation("The Milestone date provided exceeds the POAM scheduled completion date and the allowed extension time.");
        event.confirm.reject();
        return;
      }
    }

    if (this.poam.poamId) {
      let milestone: any = {
        milestoneDate: format(event.newData.milestoneDate, "yyyy-MM-dd"),
        milestoneComments: (event.newData.milestoneComments) ? event.newData.milestoneComments : ' ',
        milestoneStatus: (event.newData.milestoneStatus) ? event.newData.milestoneStatus : 'Pending',
        poamLog: [{ userId: this.user.userId }],
      }


      await this.poamService.addPoamMilestone(this.poam.poamId, milestone).subscribe((res: any) => {
        if (res.null) {
          this.showConfirmation("Unable to insert row, potentially a duplicate.");
          event.confirm.reject();
          this.getData();
          return;
        } else {

          event.confirm.resolve();
          this.poamMilestones.push(milestone);
          this.poamMilestones = [...this.poamMilestones];
          this.getData();
        }
      })

    } else {
      this.showConfirmation("Failed to create POAM milestone entry. Invalid input.");
      event.confirm.reject();
    }
  }

  confirmEditMilestone(event: any) {
    if (this.poam.poamId === "ADDPOAM" || this.poam.status !== "Draft") {
      this.showConfirmation("Milestones can only be modified if the POAM status is 'Draft'.");
      event.confirm.reject();
      return;
    }

    const scheduledCompletionDate = parseISO(this.poam.scheduledCompletionDate);
    const milestoneDate = format(event.newData.milestoneDate, "yyyy-MM-dd");

    if (this.poam.extensionTimeAllowed === 0 || this.poam.extensionTimeAllowed == null) {
      if (isAfter(milestoneDate, scheduledCompletionDate)) {
        this.showConfirmation("The Milestone date provided exceeds the POAM scheduled completion date.");
        event.confirm.reject();
        return;
      }
    } else {
      const maxAllowedDate = addDays(scheduledCompletionDate, this.poam.extensionTimeAllowed);

      if (isAfter(milestoneDate, maxAllowedDate)) {
        this.showConfirmation("The Milestone date provided exceeds the POAM scheduled completion date and the allowed extension time.");
        event.confirm.reject();
        return;
      }
    }

    const milestoneUpdate = {
      ...(event.newData.milestoneDate && { milestoneDate: format(event.newData.milestoneDate, "yyyy-MM-dd") }),
      ...(event.newData.milestoneComments && { milestoneComments: (event.newData.milestoneComments) ? event.newData.milestoneComments : ' ' }),
      ...(event.newData.milestoneStatus && { milestoneStatus: (event.newData.milestoneStatus) ? event.newData.milestoneStatus : 'Pending' }),
      poamLog: [{ userId: this.user.userId }],
    };

    this.poamService.updatePoamMilestone(this.poam.poamId, event.data.milestoneId, milestoneUpdate).subscribe({
      next: () => {
        event.confirm.resolve();
        this.getData();
      },
      error: (error) => {
        this.showConfirmation("Failed to update the milestone. Please try again.");
        console.error(error);
        event.confirm.reject();
      }
    });
  } 

  async confirmDeleteMilestone(event: any) {
    if (this.poam.poamId === "ADDPOAM") {
      event.confirm.resolve();
      return;
    }

    if (this.poam.status != "Draft") {
      this.showConfirmation("You may only modify the milestone list if POAM status is 'Draft'.");
      event.confirm.reject();
      return;
    }

    this.poamService.deletePoamMilestone(this.poam.poamId, event.data.milestoneId, this.user.userId, false).subscribe((res: any) => {
      const index = this.poamMilestones.findIndex((e: any) => e.poamId == event.data.poamId && e.milestoneId == event.data.milestoneId);

      if (index > -1) {
        this.poamMilestones.splice(index, 1);
      }
      event.confirm.resolve();
    })
  }

  confirmEditApprover(event: any) {
    if (this.poam.poamId === "ADDPOAM") {
      event.confirm.reject();
      return;
    }

    if (this.poam.status != "Draft") {
      this.showConfirmation("you may only modify the approver list if poam status is 'Draft'.");
      event.confirm.reject();
      return;
    }

    if (
      event.newData.userId &&
      this.poam.poamId
    ) {

      let approver = {
        poamId: +this.poam.poamId,
        userId: +event.newData.userId,
        approvalStatus: event.newData.approvalStatus,
        approvedDate: (event.newData.approvalStatus != 'Not Reviewed') ?  this.datePipe.transform(new Date(), 'yyyy-MM-dd') : '',
        comments: event.newData.comments,
        poamLog: [{ userId: this.user.userId }],
      }

      this.poamService.updatePoamApprover(approver).subscribe(res => {
        event.confirm.resolve();
        this.getData();
      })

    } else {
      this.showConfirmation("Failed to create entry. Invalid input.");
      event.confirm.reject();
    }
  }

  async confirmDeleteApprover(event: any) {
    if (this.poam.poamId === "ADDPOAM") {
      event.confirm.resolve();
      return;
    }

    if (this.poam.status != "Draft") {
      this.showConfirmation("You may only modify the approver list if the POAM status is 'Draft'.");
      event.confirm.reject();
      return;
    }

    this.poamService.deletePoamApprover(event.data.poamId, event.data.userId, this.user.userId).subscribe((res: any) => {
      const index = this.poamApprovers.findIndex((e: any) => e.poamId == event.data.poamId && e.userId == event.data.userId);
      if (index > -1) {
        this.poamApprovers.splice(index, 1);
        this.poamApprovers = [...this.poamApprovers];
      }
      event.confirm.resolve();
    });
  }

  async confirmCreateApprover(event: any) {
    if (this.poam.poamId === "ADDPOAM") {
      event.confirm.resolve();
      return;
    }

    if (this.poam.status != "Draft") {
      this.showConfirmation("You may only modify the approver list if the POAM status is 'Draft'.");
      event.confirm.reject();
      return;
    }

    if (this.poam.poamId && event.newData.userId) {
      let user = await this.collectionApprovers.find((tl: any) => tl.collectionId == this.poam.collectionId && tl.userId == event.newData.userId);

      let approver: any = {
        poamId: +this.poam.poamId,
        userId: +event.newData.userId,
        status: event.newData.status,
        approved: 'Not Reviewed',
        comments: event.newData.comments,
        poamLog: [{ userId: this.user.userId }],
      };

      if (user) {
        approver.firstName = user.firstName;
        approver.lastName = user.lastName;
        approver.fullName = user.fullName;
        approver.userEmail = user.userEmail;
      }

      this.poamService.addPoamApprover(approver).subscribe((res: any) => {
        event.confirm.resolve();
        this.poamService.getPoamApprovers(this.poamId).subscribe((poamApprovers: any) => {
          this.poamApprovers = poamApprovers;
        })      
      });
    } else {
      this.showConfirmation("Failed to create entry on poamApprover. Invalid input.");
      event.confirm.reject();
    }
  }

  confirmCreateLabel(event: any) {
    if (this.poam.poamId === "ADDPOAM") {
      this.showConfirmation("You may not assign a label until after the POAM has been saved.", "Information", "warning");
      event.confirm.reject();
      return;
    }

    if (this.poam.poamId && event.newData.labelId) {
      const label_index = this.labelList.findIndex((e: any) => e.labelId == event.newData.labelId);
      if (label_index === -1) {
        this.showConfirmation("Unable to resolve assigned label.");
        event.confirm.reject();
        return;
      }

      const poamLabel = {
        poamId: +this.poam.poamId,
        labelId: +event.newData.labelId,
        poamLog: [{ userId: this.user.userId }],
      };

      this.poamService.postPoamLabel(poamLabel).subscribe((poamLabelData: any) => {
        event.confirm.resolve();
        this.getPoamLabels();
      });
    } else {
      this.showConfirmation("Failed to create entry. Invalid input.");
      event.confirm.reject();
    }
  }

  confirmDeleteLabel(event: any) {
    if (this.poam.poamId === "ADDPOAM") {
      event.confirm.resolve();
      return;
    }

    const label_index = this.poamLabels.findIndex((data: any) => {
      return event.data.poamId === data.poamId && event.data.labelId === data.labelId;
    });

    if (label_index === -1) {
      this.showConfirmation("Unable to resolve assigned label.");
      event.confirm.reject();
    } else {
      this.poamService.deletePoamLabel(+event.data.poamId, +event.data.labelId, this.user.userId).subscribe(() => {
        event.confirm.resolve();
        this.poamLabels.splice(label_index, 1);
        this.poamLabels = [...this.poamLabels];
      });
    }
  }

  confirmCreate(data: any) {
    if (this.poam.poamId === "ADDPOAM") {
      data.confirm.resolve();
      return;
    }

    if (this.poam.poamId &&
      data.newData.userId
    ) {
      var user_index = this.poamAssignees.findIndex((e: any) => e.userId == data.newData.userId);

      if (!user_index && user_index != 0) {
        this.showConfirmation("Unable to resolve user");
        data.confirm.reject();
        return;
      }
      let poamAssignee = {
        poamId: +this.poam.poamId,
        userId: +data.newData.userId,
        poamLog: [{ userId: this.user.userId }],
      }

      this.poamService.postPoamAssignee(poamAssignee).subscribe(poamAssigneeData => {
        data.confirm.resolve();
        this.poamService.getPoamAssignees(this.poamId).subscribe((poamAssignees: any) => {
          this.poamAssignees = poamAssignees;
        })
      })

    } else if (this.poam.poamId && data.newData.assetId) {

      var asset_index = this.poamAssets.findIndex((e: any) => e.assetId == data.newData.assetId);
      if (!asset_index && asset_index != 0) {
        this.showConfirmation("Unable to resolve asset");
        data.confirm.reject();
        return;
      }

      let poamAsset = {
        poamId: +this.poam.poamId,
        assetId: +data.newData.assetId,
        poamLog: [{ userId: this.user.userId }],
      }
      this.poamService.postPoamAsset(poamAsset).subscribe(poamAssetData => {
        data.confirm.resolve();
        this.poamService.getPoamAssets(this.poamId).subscribe((poamAssets: any) => {
          this.poamAssets = poamAssets;
        })
      })
    }
    else {
      this.showConfirmation("Failed to create entry. Invalid input.");
      data.confirm.reject();
    }
  }

  confirmDelete(assigneeData: any) {
    if (this.poam.poamId === "ADDPOAM") { 
      assigneeData.confirm.resolve();
      return;
    }
    if (this.poam.poamId && assigneeData.data.userId) {
      var user_index = this.poamAssignees.findIndex((data: any) => {
        if (assigneeData.data.poamId === data.poamId && assigneeData.data.userId === data.userId) return true;
        else return false;
      })

      if (!user_index && user_index != 0) {
        this.showConfirmation("Unable to resolve user assinged")
        assigneeData.confirm.reject();
      } else {
        this.poamService.deletePoamAssignee(+assigneeData.data.poamId, +assigneeData.data.userId, this.user.userId).subscribe(poamAssigneeData => {
          assigneeData.confirm.resolve();
          this.getData();
        });
      }

    } else if (this.poam.poamId && assigneeData.data.assetId) {
      var asset_index = this.poamAssets.findIndex((data: any) => {
        if (assigneeData.data.poamId === data.poamId && assigneeData.data.assetId === data.assetId) return true;
        else return false;
      })

      if (!asset_index && asset_index != 0) {
        this.showConfirmation("Unable to resolve asset assinged")
        assigneeData.confirm.reject();
      } else if (this.stateData.vulnerabilitySource && this.stateData.benchmarkId) {
        this.poamAssets = this.poamAssets.filter((asset: any) => asset.assetId !== assigneeData.data.assetId);
        assigneeData.confirm.resolve();
      } else {
        this.poamService.deletePoamAsset(+assigneeData.data.poamId, +assigneeData.data.assetId, this.user.userId).subscribe(poamAssetData => {
          assigneeData.confirm.resolve();
          this.getData();
        });
      }
    } else {
      this.showConfirmation("Failed to delete entry. Invalid input.");
      assigneeData.confirm.reject();
    }
  }

  async showConfirmation(errMsg: string, header?: string, status?: string, isSuccessful: boolean = false) {
    let options = new ConfirmationDialogOptions({
      header: header ? header : "Notification",
      body: errMsg,
      button: {
        text: "Ok",
        status: status ? status : "Primary",
      },
      cancelbutton: "false",
    });

    const dialogRef = this.confirm(options);

    dialogRef.subscribe((res: boolean) => {
      if (res && isSuccessful) {
        this.router.navigateByUrl('/poam-processing');
      }
    });
  }

  confirm = (dialogOptions: ConfirmationDialogOptions): Observable<boolean> => 
    this.dialogService.open(ConfirmationDialogComponent, {
      hasBackdrop: false,
      closeOnBackdropClick: true,
      context: {
        options: dialogOptions,
      },
    }).onClose;

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.subscriptions.unsubscribe();
  }
}
