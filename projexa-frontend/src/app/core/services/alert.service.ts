import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private readonly darkConfig = {
    background: '#111416',
    color: '#f5f5f5',
    confirmButtonColor: '#e8ff47',
    cancelButtonColor: '#ff2e2e',
    customClass: {
      popup: 'swal2-premium-popup',
      title: 'swal2-premium-title',
      confirmButton: 'swal2-premium-confirm',
      cancelButton: 'swal2-premium-cancel',
    },
  };

  success(message: string, title: string = 'Success') {
    return Swal.fire({
      ...this.darkConfig,
      icon: 'success',
      title,
      text: message,
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
      iconColor: '#e8ff47',
    });
  }

  error(message: string, title: string = 'Error') {
    return Swal.fire({
      ...this.darkConfig,
      icon: 'error',
      title,
      text: message,
      iconColor: '#ff2e2e',
    });
  }

  confirm(message: string, title: string = 'Are you sure?') {
    return Swal.fire({
      ...this.darkConfig,
      icon: 'warning',
      title,
      text: message,
      showCancelButton: true,
      confirmButtonText: 'Yes, proceed',
      cancelButtonText: 'Cancel',
      iconColor: '#facc15',
    });
  }

  loading(message: string = 'Please wait...') {
    return Swal.fire({
      ...this.darkConfig,
      title: message,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  }

  close() {
    Swal.close();
  }
}
