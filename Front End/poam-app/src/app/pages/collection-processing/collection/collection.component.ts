/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnInit, TemplateRef, Input, EventEmitter, Output } from '@angular/core';
import { CollectionsService } from '../collections.service';
import { Observable } from 'rxjs';
import { NbDialogService, NbWindowRef } from '@nebular/theme';
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../../Shared/components/confirmation-dialog/confirmation-dialog.component'
import { SubSink } from 'subsink';
import { UsersService } from '../../user-processing/users.service';

@Component({
  selector: 'cpat-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss']
})
export class CollectionComponent implements OnInit {
  @Input() collection: any;
  @Input() collections: any;
  @Input() payload: any;
  @Input() poams: any;
  @Output() collectionchange = new EventEmitter();
  isLoading: boolean = false;
  modalWindow: NbWindowRef | undefined
  errorMessage: string = '';
  data: any = [];
  collectionUsers: any;
  deleteEvent: any;
  showLaborCategorySelect: boolean = false;
  user: any;
  private subs = new SubSink()

  constructor(private collectionService: CollectionsService,
    private userService: UsersService,
    private dialogService: NbDialogService,
  ) { }

  attemptingDelete(dialog: TemplateRef<any>, event: any) {
    this.deleteEvent = event
    this.dialogService.open(dialog)
  }

  onSubmit() {
    if (!this.validData()) return;

    let collection = {
      collectionId: this.collection.collectionId,
      collectionName: this.collection.collectionName,
      description: this.collection.description,
      grantCount: this.collection.grantCount,
      assetCount: this.collection.assetCount,
      poamCount: this.collection.poamCount,
    }

    if (collection.collectionId == "ADDCOLLECTION") {
      delete collection.collectionId;

      this.subs.sink = this.collectionService.addCollection(collection).subscribe(
        data => {
          this.collectionchange.emit(data.collectionId);
        }, () => {

          this.invalidData("Unexpected error while adding Collection.");
        }
      );

    } else {
      this.collectionService.updateCollection(collection).subscribe(data => {
        this.collection = data;
      });
      this.collectionchange.emit();
    }
  }

  deleteCollection() {
    this.resetData();
  }

  ngOnInit() {
  }


  resetData() {
    this.collection.collectionId = "COLLECTION";
    this.collectionchange.emit();
  }

  addCollection() {
    this.collection = [];
    this.collection.collectionId = "COLLECTION";
  }

  confirm = (dialogOptions: ConfirmationDialogOptions): Observable<boolean> =>
    this.dialogService.open(ConfirmationDialogComponent, {
      hasBackdrop: true,
      closeOnBackdropClick: true,
      context: {
        options: dialogOptions,
      },
    }).onClose;


  validData(): boolean {
    if (!this.collection.collectionName || this.collection.collectionName == undefined) {
      this.invalidData("Collection name required");
      return false;
    }

    if (this.collection.collectionId == "ADDCOLLECTION") {
      let exists = this.collections.find((e: { collectionName: any; }) => e.collectionName === this.collection.collectionName);
      if (exists) {
        this.invalidData("Duplicate collection");
        return false;
      }
    }

    if (this.collection.grantCount < 0 || this.collection.grantCount == undefined) {
      this.invalidData("Grant Count must be defined and >= 0");
      return false;
    }
    return true;
  }

  invalidData(errMsg: string) {
    this.confirm(
      new ConfirmationDialogOptions({
        header: "Invalid Data",
        body: errMsg,
        button: {
          text: "ok",
          status: "warning",
        },
        cancelbutton: "false",
      }));
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
