// GCP needs to fetch config files locally to authenticate
import { Notice, request } from "obsidian";
import { google } from "googleapis";
import { GCPSettings, GCP_DEFAULT_SETTINGS } from "./settings";

export class GCPStorageUploader {
  private gcpSettings: GCPSettings;

  constructor() {
    this.gcpSettings = GCP_DEFAULT_SETTINGS;
  }

  async getAuthTokenauth(): Promise<string> {
    // TODO: Handle when file doesn't exist
    const auth = new google.auth.GoogleAuth({
      keyFile: this.gcpSettings.keyFilename,
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    });
    const client = await auth.getClient();
    // TODO: Handle when no token (ie. unauth)
    const token = (await client.getAccessToken()).token;
    return token;
  }

  async uploadFile(file: File, filename: string): Promise<void> {
    const token = await this.getAuthTokenauth();
    const url = `https://storage.googleapis.com/upload/storage/v1/b/${this.gcpSettings.bucket}/o?uploadType=media&name=${filename}`;
    await request({
      url: url,
      method: "POST",
      contentType: "image/png",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      // This was the key - needed to pass the file as a buffer
      body: await file.arrayBuffer(),
    }).catch((err) => {
      console.log(err.message);
    });
  }

  // TODO: check if file exists
  private async checkIfExists(filename: string): Promise<void> {
    // Currently this just returns all files in the bucket
    const token = await this.getAuthTokenauth();
    const url = `https://storage.googleapis.com/storage/v1/b/${this.gcpSettings.bucket}/o`;
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
