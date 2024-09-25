/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { Component, OnInit } from '@angular/core';
import { UsersService } from './user-processing/users.service';
import { SubSink } from 'subsink';
import { Router } from '@angular/router';

@Component({
  selector: 'cpat-admin-processing',
  templateUrl: './admin-processing.component.html',
  styleUrls: ['./admin-processing.component.scss'],
})
export class AdminProcessingComponent implements OnInit {
  user: any;
  private subs = new SubSink();

  constructor(
    private userService: UsersService,
    private router: Router,
  ) {}

  async ngOnInit() {
    this.user = null;
    this.subs.sink = (await this.userService.getCurrentUser()).subscribe({
      next: (response: any) => {
        this.user = response;
        if (!this.user.isAdmin) {
          this.router.navigate(['/403']);
        }
      },
      error: async (error) => {
        console.error('An error occurred:', error.message);
      },
    });
  }
}
