import { Component } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { AccountService } from '../../../services/account.service';
import { JoinLink } from '../../../types/api-output';
import { ErrorMessageOutput } from '../../error-message-output';

interface InstructorData {
  name: string;
  email: string;
  institution: string;
  status: string;
  joinLink?: string;
  message?: string;
}

/**
 * Admin home page.
 */
@Component({
  selector: 'tm-admin-home-page',
  templateUrl: './admin-home-page.component.html',
  styleUrls: ['./admin-home-page.component.scss'],
})
export class AdminHomePageComponent {

  instructorDetails: string = '';
  instructorName: string = '';
  instructorEmail: string = '';
  instructorInstitution: string = '';

  instructorsConsolidated: InstructorData[] = [];
  activeRequests: number = 0;

  isAddingInstructors: boolean = false;

  singleForm: any = { hasError: false, errorMessage: '' };
  multipleForm: any = { hasError: false, errorMessage: '' };

  constructor(private accountService: AccountService) {}

  /**
   * Validates and adds the instructor details filled with first form.
   */
  validateAndAddInstructorDetails(): void {
    const invalidLines: string[] = [];
    for (const instructorDetail of this.instructorDetails.split(/\r?\n/)) {
      const instructorDetailSplit: string[] = instructorDetail.split(/[|\t]/).map((item: string) => item.trim());
      if (instructorDetailSplit.length < 3) {
        this.multipleForm = { hasError: true, errorMessage: 'Please ensure that all 3 details have been provided.' };
        invalidLines.push(instructorDetail);
        continue;
      }

      if (!instructorDetailSplit[0] || !instructorDetailSplit[1] || !instructorDetailSplit[2]) {
        this.multipleForm = { hasError: true, errorMessage: 'Please ensure that all 3 details have been provided.' };
        invalidLines.push(instructorDetail);
        continue;
      }

      const re = /[A-Za-z0-9._%-]+@[A-Za-z0-9._%-]+\.[a-z]{2,3}/;
      if (!re.test(instructorDetailSplit[1])) {
        this.multipleForm = { hasError: true, errorMessage: 'Please provide valid email(s) for all instructor(s).' };
        return;
      }

      this.multipleForm = { hasError: false, errorMessage: '' }; // resets error message
      this.instructorsConsolidated.push({
        name: instructorDetailSplit[0],
        email: instructorDetailSplit[1],
        institution: instructorDetailSplit[2],
        status: 'PENDING',
      });
    }
    this.instructorDetails = invalidLines.join('\r\n');
  }

  /**
   * Validates and adds the instructor detail filled with second form.
   */
  validateAndAddInstructorDetail(): void {
    if (!this.instructorName || !this.instructorEmail || !this.instructorInstitution) {
      this.singleForm = { hasError: true, errorMessage: 'Please fill in all fields.' };
      return;
    }

    const re = /[A-Za-z0-9._%-]+@[A-Za-z0-9._%-]+\.[a-z]{2,3}/;
    if (!re.test(this.instructorEmail)) {
      this.singleForm = { hasError: true, errorMessage: 'Please provide a valid email.' };
      return;
    }

    this.singleForm = { hasError: false, errorMessage: '' }; // resets error message
    this.instructorsConsolidated.push({
      name: this.instructorName,
      email: this.instructorEmail,
      institution: this.instructorInstitution,
      status: 'PENDING',
    });
    this.instructorName = '';
    this.instructorEmail = '';
    this.instructorInstitution = '';
  }

  /**
   * Adds the instructor at the i-th index.
   */
  addInstructor(i: number): void {
    const instructor: InstructorData = this.instructorsConsolidated[i];
    if (instructor.status !== 'PENDING' && instructor.status !== 'FAIL') {
      return;
    }
    this.activeRequests += 1;
    instructor.status = 'ADDING';

    this.isAddingInstructors = true;
    this.accountService.createAccount({
      instructorEmail: instructor.email,
      instructorName: instructor.name,
      instructorInstitution: instructor.institution,
    })
        .pipe(finalize(() => this.isAddingInstructors = false))
        .subscribe((resp: JoinLink) => {
          instructor.status = 'SUCCESS';
          instructor.joinLink = resp.joinLink;
          this.activeRequests -= 1;
        }, (resp: ErrorMessageOutput) => {
          instructor.status = 'FAIL';
          instructor.message = resp.error.message;
          this.activeRequests -= 1;
        });
  }

  /**
   * Cancels the instructor at the i-th index.
   */
  cancelInstructor(i: number): void {
    this.instructorsConsolidated.splice(i, 1);
  }

  /**
   * Adds all the pending and failed-to-add instructors.
   */
  addAllInstructors(): void {
    for (let i: number = 0; i < this.instructorsConsolidated.length; i += 1) {
      this.addInstructor(i);
    }
  }

}
