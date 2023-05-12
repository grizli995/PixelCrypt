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
  isSubmitButtonDisabled = false;
  uploadedImage: File | null = null;
  downloadLink = '';
  isLoading = false;
  isNotInstalled = true;

  private deferredPrompt: any;

  constructor(private formBuilder: FormBuilder,
    private embedExtractService: EmbedExtractService,
    private el: ElementRef) {
    this.embedExtractForm = this.formBuilder.group({
      message: [''],
      password: ['', Validators.required],
    });
  }

  ngOnInit() {
    window.addEventListener('beforeinstallprompt', (event) => {
      console.log('👍', 'beforeinstallprompt', event);
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      event.preventDefault();
      // Stash the event so it can be triggered later
      this.deferredPrompt = event;
    });
    if (window.matchMedia('(display-mode: standalone)').matches) {  
      // do things here  
      // set a variable to be used when calling something  
      // e.g. call Google Analytics to track standalone use   
      this.isNotInstalled = false;
    }
  }

  onEmbedExtractChange(checked: boolean) {
    this.embedExtractOption = checked ? 'embed' : 'extract';
  }

  onSubmit() {
    this.isSubmitButtonDisabled = true;
    this.isLoading = true;
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
              this.isSubmitButtonDisabled = false;
              this.isLoading = false;
            }),
            catchError((error) => {
              if (error.error && error.error.ErrorMessage) {
                console.error('Error during embed request:', error.error.ErrorMessage);
              } else {
                console.error('Error during embed request:', error.message);
              }
              this.isSubmitButtonDisabled = false;
              this.isLoading = false;
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
              this.isSubmitButtonDisabled = false;
              this.isLoading = false;
            }),
            catchError((error) => {
              if (error.error && error.error.ErrorMessage) {
                console.error('Error during embed request:', error.error.ErrorMessage);
              } else {
                console.error('Error during embed request:', error.message);
              }
              this.isSubmitButtonDisabled = false;
              this.isLoading = false;
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
  
  async installPwa() {
    if (!this.deferredPrompt) {
      return;
    }
    // Show the prompt
    this.deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log(`User response: ${outcome}`);
    // We no longer need the prompt, clear it up
    this.deferredPrompt = null;
  }
  
}