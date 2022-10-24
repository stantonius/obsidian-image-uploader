import { Notice, Plugin, Editor, MarkdownView, EditorPosition } from "obsidian";

import axios from "axios";
import objectPath from "object-path";
import ImageUploaderSettingTab from "./settings-tab";
import Compressor from "compressorjs";

import { PasteEventCopy } from "./custom-events";

import { FilenameInput } from "./input";
import { GCPStorageUploader } from "./google";

import { homedir } from "os";

export interface ImageUploaderSettings {
  apiEndpoint: string;
  uploadHeader: string;
  uploadBody: string;
  imageUrlPath: string;
  maxWidth: number;
  enableResize: boolean;
  enableGCP: boolean;
  gcp_bucket: string;
  gcp_keyfile: string;
  gcp_filePath: string;
}

export const DEFAULT_SETTINGS: ImageUploaderSettings = {
  apiEndpoint: null,
  uploadHeader: null,
  uploadBody: '{"image": "$FILE"}',
  imageUrlPath: null,
  maxWidth: 4096,
  enableResize: false,
  enableGCP: true,
  gcp_bucket: process.env.GCP_BUCKET,
  gcp_keyfile: `${homedir()}/creds.json`,
  gcp_filePath: "images",
};

interface pasteFunction {
  (this: HTMLElement, event: ClipboardEvent): void;
}

export default class ImageUploader extends Plugin {
  settings: ImageUploaderSettings;
  pasteFunction: pasteFunction;
  filename: string;
  gcpUploader: GCPStorageUploader;

  private replaceText(
    editor: Editor,
    target: string,
    replacement: string
  ): void {
    target = target.trim();
    console.log(target);
    const lines = editor.getValue().split("\n");
    for (let i = 0; i < lines.length; i++) {
      const ch = lines[i].indexOf(target);
      if (ch !== -1) {
        const from = { line: i, ch: ch } as EditorPosition;
        const to = { line: i, ch: ch + target.length } as EditorPosition;
        editor.setCursor(from);
        editor.replaceRange(replacement, from, to);
        break;
      }
    }
  }

  async pasteHandler(
    ev: ClipboardEvent,
    editor: Editor,
    mkView: MarkdownView
  ): Promise<void> {
    if (ev.defaultPrevented) {
      console.log("paste event is canceled");
      return;
    }

    let file = ev.clipboardData.files[0];
    const imageType = /image.*/;
    if (file.type.match(imageType)) {
      ev.preventDefault();

      //   // set the placeholder text
      const randomString = (Math.random() * 10086).toString(36).substring(0, 8);
      const pastePlaceText = `![uploading...](${randomString})\n`;
      console.log(this.filename);
      editor.replaceSelection(pastePlaceText);

      // // resize the image
      if (this.settings.enableResize) {
        const maxWidth = this.settings.maxWidth;
        const compressedFile = await new Promise((resolve, reject) => {
          new Compressor(file, {
            maxWidth: maxWidth,
            success: resolve,
            error: reject,
          });
        });
        file = compressedFile as File;
      }

      if (!this.settings.enableGCP) {
        // upload the image
        const formData = new FormData();
        const uploadBody = JSON.parse(this.settings.uploadBody);

        for (const key in uploadBody) {
          if (uploadBody[key] == "$FILE") {
            formData.append(key, file, file.name);
          } else {
            formData.append(key, uploadBody[key]);
          }
        }

        axios
          .post(this.settings.apiEndpoint, formData, {
            headers: JSON.parse(this.settings.uploadHeader),
          })
          .then(
            (res) => {
              const url = objectPath.get(res.data, this.settings.imageUrlPath);
              const imgMarkdownText = `![](${url})`;
              this.replaceText(editor, pastePlaceText, imgMarkdownText);
            },
            (err) => {
              new Notice(
                "[Image Uploader] Upload unsuccessfully, fall back to default paste!",
                5000
              );
              console.log(err);
              this.replaceText(editor, pastePlaceText, "");
              console.log(mkView.currentMode);
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              mkView.currentMode.clipboardManager.handlePaste(
                new PasteEventCopy(ev)
              );
            }
          );
      } else {
        this.gcpUploader = new GCPStorageUploader(this.settings);

        await new FilenameInput(
          this.app,
          // callback 1
          (result: string) => {
            this.filename = result;
            console.log(this.filename);
          },
          // callback 2
          () => {
            file = null;
            console.log("cancel");
          }
        ).open();

        if (file) {
          new Notice(`Uploading file...}`);
          await this.gcpUploader
            .uploadFile(file, this.settings.gcp_filePath + this.filename) // TODO: add some logic to add or remove a slash to ensure it is entered correctly
            .then((response) => {
              new Notice(`File uploaded`);
              // parse the string into a JSON object
              console.log(response);
              const resp = JSON.parse(response);
              const newUrl = `https://storage.googleapis.com/${resp.bucket}/${resp.name}`;
              this.replaceText(
                editor,
                pastePlaceText,
                `![${this.filename}](${newUrl})`
              );
            })
            .catch((error) => {
              new Notice(`Error uploading file: ${error}`);
            });
        }
      }
    }
  }

  async onload(): Promise<void> {
    console.log("loading Image Uploader");
    new Notice("Image Loader enabled");
    await this.loadSettings();
    // this.setupPasteHandler()
    this.addSettingTab(new ImageUploaderSettingTab(this.app, this));

    this.pasteFunction = this.pasteHandler.bind(this);

    this.registerEvent(
      this.app.workspace.on("editor-paste", this.pasteFunction)
    );
  }

  onunload(): void {
    this.app.workspace.off("editor-paste", this.pasteFunction);
    console.log("unloading Image Uploader");
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    console.log(this.settings);
    await this.saveData(this.settings);
  }
}
