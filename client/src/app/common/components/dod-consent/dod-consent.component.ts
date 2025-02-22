/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { AfterViewInit, Component } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConsentDialogComponent } from './consent-dialog.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'cpat-consent',
  templateUrl: './dod-consent.component.html',
  standalone: true,
  imports: [CommonModule, DialogModule, FormsModule],
  providers: [DialogService],
})
export class DoDConsentComponent implements AfterViewInit {
  modalWindow: DynamicDialogRef | undefined;

  constructor(private dialogService: DialogService) {}

  async ngAfterViewInit() {
    this.modalWindow = this.dialogService.open(ConsentDialogComponent, {
      header: 'DoD Consent',
      width: '70%',
    });
  }

  consentOk() {
    if (this.modalWindow) {
      this.modalWindow.close();
    }
  }
}
