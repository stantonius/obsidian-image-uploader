// GCP needs to fetch config files locally to authenticate
import { Notice, request } from "obsidian";
import { google } from "googleapis";
import { ImageUploaderSettings, DEFAULT_SETTINGS } from "./main";

export class GCPStorageUploader {
  private settings: ImageUploaderSettings;

  constructor() {
    this.settings = DEFAULT_SETTINGS;
  }

  async getAuthTokenauth(): Promise<string> {
    // TODO: Handle when file doesn't exist
    const auth = new google.auth.GoogleAuth({
      keyFile: this.settings.gcp_keyfile,
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    });
    const client = await auth.getClient();
    // TODO: Handle when no token (ie. unauth)
    const token = (await client.getAccessToken()).token;
    return token;
  }

  async uploadFile(file: File, filename: string): Promise<string> {
    const token = await this.getAuthTokenauth();
    const url = `https://storage.googleapis.com/upload/storage/v1/b/${this.settings.gcp_bucket}/o?uploadType=media&name=${filename}`;
    const response = request({
      url: url,
      method: "POST",
      contentType: "image/png",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      // This was the key - needed to pass the file as a buffer
      body: await file.arrayBuffer(),
    });
    return response;
  }

  // TODO: check if file exists
  private async checkIfExists(filename: string): Promise<void> {
    // Currently this just returns all files in the bucket
    const token = await this.getAuthTokenauth();
    const url = `https://storage.googleapis.com/storage/v1/b/${this.settings.gcp_bucket}/o`;
    const res = request({
      url: url,
      method: "GET",
      contentType: "application/json",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).catch((err) => {
      console.log(err.message);
    });
    // // const res = await client.request({ url });
    console.log(`The folders in the dir are ${await res}`);
  }

  // TODO: Update file if it exists
  async updateFile(file: File, filename: string): Promise<string> {
    return;
  }
}
