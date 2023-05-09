import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root',
})
export class EmbedExtractService {
  constructor(private http: HttpClient) {
    this.apiUrl = 'https://localhost:7292/EmbedExtract/';
  }

  public apiUrl:string;

  embed(formData: FormData): Observable<{ downloadUrl: string }> {
    const apiUrl = this.apiUrl + 'embed'; 

    return this.http.post(apiUrl, formData, { responseType: 'blob' }).pipe(
      map((blob: Blob) => {
        const downloadUrl = URL.createObjectURL(blob);
        return { downloadUrl };
      })
    );
    // return this.http.post(this.apiUrl + 'embed', formData);
  }

  extract(formData: FormData): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.apiUrl + 'extract', formData);
  }
}