/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!########################################################################
*/

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const guardType = route.data['guardType'];

    if (guardType === 'admin') {
      return this.canAdmin();
    } else {
      return this.authService.isAuthenticated('cpat').pipe(
        map(isAuthenticated => {
          if (!isAuthenticated) {
            return false;
          }
          return true;
        })
      );
    }
  }

  canAdmin(): Observable<boolean> {
    return this.authService.isAuthenticated('cpat').pipe(
      switchMap(isAuthenticated => {
        if (!isAuthenticated) {
          return of(false);
        }
        return this.authService.getUserData('cpat').pipe(
          map(userData => {
            if (userData.isAdmin) {
              return true;
            }
            this.router.navigate(['/unauthorized']);
            return false;
          })
        );
      })
    );
  }
}

