import { Component } from '@angular/core';
import { Camera,CameraResultType,CameraSource } from '@capacitor/camera';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  messages: Array<{ type: string, content: string }> = [];
  newMessage: string = '';
  recognizedText: string = '';
  loading: boolean = false;
  capturedImage: any= null;

  constructor(private http: HttpClient) {}

  // sendMessage() {
  //   console.log("message", this.newMessage)
  //   if (this.newMessage.trim()) {
  //     this.messages.push({ type: 'text', content: this.newMessage });
  //     this.newMessage = '';
  //   }
  // }

  async captureImage() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      this.capturedImage = image.dataUrl;
      this.messages.push({ type: 'image', content: this.capturedImage });
    } catch (error) {
      console.error('Error capturing image:', error);
    }
  }

  sendImageAndMessage() {
    if (!this.capturedImage || !this.newMessage.trim()) {
      return;
    }

    this.setLoading(true);
    this.http.post<{ text: string }>('http://172.16.16.89:3000'+'/recognize', { image: this.capturedImage, message: this.newMessage })
      .subscribe(response => {
        this.setLoading(false);
        this.capturedImage = null; // Reset captured image after sending
        this.newMessage = ''; // Reset new message after sending
        this.recognizedText = response.text;
        this.messages.push({ type: 'recognizedText', content: this.recognizedText });
      }, error => {
        this.setLoading(false);
        console.error('Error:', error);
      });
  }

  setLoading(isLoading: boolean) {
    this.loading = isLoading;
  }

  readText() {
  if (this.recognizedText) {
    console.log('Recognized text to speak:', this.recognizedText);
    if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(this.recognizedText);

      // Check if speech synthesis is currently speaking
      if (synth.speaking) {
        console.warn('Speech synthesis is already speaking. Canceling and retrying...');
        synth.cancel();
      }

      // Add event listeners to handle various scenarios
      utterance.onstart = () => {
        console.log('Speech synthesis started.');
      };

      utterance.onend = () => {
        console.log('Speech synthesis finished.');
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
      };

      // Speak the text
      synth.speak(utterance);
    } else {
      console.error('Speech synthesis is not supported in this browser.');
    }
  } else {
    console.warn('No recognized text to speak.');
  }
}

  
}
