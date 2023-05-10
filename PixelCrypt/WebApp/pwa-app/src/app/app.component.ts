import { Component, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmbedExtractService } from './services/embed-extract.service';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'pwa-app';
  embedExtractForm: FormGroup;
  embedExtractOption = 'embed';
  extractedMessage = '';
  hasExtractResult = false;
  hasEmbedResult = false;
  uploadedImage: File | null = null;
  downloadLink = '';

  constructor(private formBuilder: FormBuilder,
    private embedExtractService: EmbedExtractService,
    private el: ElementRef) {
    this.embedExtractForm = this.formBuilder.group({
      message: [''],
      password: ['', Validators.required],
    });
  }

  onEmbedExtractChange(checked: boolean) {
    this.embedExtractOption = checked ? 'embed' : 'extract';
  }

  onSubmit() {
    console.log(this.embedExtractForm.value);
    if (this.uploadedImage) {
      if (this.embedExtractOption === 'embed') {
        const formData = new FormData();
        formData.append('message', this.embedExtractForm.value.message);
        formData.append('password', this.embedExtractForm.value.password);
        formData.append('image', this.uploadedImage);

        this.embedExtractService
          .embed(formData)
          .pipe(
            tap((response) => {
              this.hasEmbedResult = true;
              this.downloadLink = response.downloadUrl;
              this.createDownloadLink();
              console.log('Embed response:', response);
            }),
            catchError((error) => {
              console.error('Error during embed request:', error);
              alert('Error during embed request: ' + error);
              return of(null);
            })
          )
          .subscribe();
      } else {
        const formData = new FormData();
        formData.append('password', this.embedExtractForm.value.password);
        formData.append('image', this.uploadedImage);

        this.embedExtractService
          .extract(formData)
          .pipe(
            tap((response) => {
              this.hasExtractResult = true;
              this.extractedMessage = response.message;
            }),
            catchError((error) => {
              console.error('Error during extract request:', error);
              alert('Error during extract request: ' + error);
              return of(null);
            })
          )
          .subscribe();
      }
    }
  }

  createDownloadLink() {
    const downloadLinkElement = this.el.nativeElement.querySelector('.downloadLink');
    downloadLinkElement.setAttribute('href', this.downloadLink);
    downloadLinkElement.setAttribute('download', 'image.jpg');
  }

  onImageUpload(event: any) {
    console.log('Image uploaded:', event.target.files[0]);
    this.uploadedImage = event.target.files[0];
  }
}