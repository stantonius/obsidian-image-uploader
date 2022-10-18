import { Notice, Plugin, Editor, MarkdownView, EditorPosition } from "obsidian";

import axios from "axios";
import objectPath from "object-path";
import ImageUploaderSettingTab from "./settings-tab";
import Compressor from "compressorjs";

import { Buffer } from "buffer";

import { PasteEventCopy } from "./custom-events";

import { FilenameInput } from "./input";
import { GCPStorageUploader } from "./google";

function showNotice(message: string) {
  new Notice(message);
}

interface ImageUploaderSettings {
  apiEndpoint: string;
  uploadHeader: string;
  uploadBody: string;
  imageUrlPath: string;
  maxWidth: number;
  enableResize: boolean;
  test: string;
}

const DEFAULT_SETTINGS: ImageUploaderSettings = {
  apiEndpoint: null,
  uploadHeader: null,
  uploadBody: '{"image": "$FILE"}',
  imageUrlPath: null,
  maxWidth: 4096,
  enableResize: false,
  test: null,
};

interface pasteFunction {
  (this: HTMLElement, event: ClipboardEvent): void;
}

export default class ImageUploader extends Plugin {
  settings: ImageUploaderSettings;
  pasteFunction: pasteFunction;
  filename: string;

  private replaceText(
    editor: Editor,
    target: string,
    replacement: string
  ): void {
    target = target.trim();
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

    const imUploader = new GCPStorageUploader();

    let file = ev.clipboardData.files[0];
    const imageType = /image.*/;
    if (file.type.match(imageType)) {
      ev.preventDefault();

      //   // set the placeholder text
      // const randomString = (Math.random() * 10086).toString(36).substring(0, 8);
      // const pastePlaceText = `![uploading...](${randomString})\n`
      // editor.replaceSelection(this.filename)

      // // resize the image
      // if (this.settings.enableResize) {
      //   const maxWidth = this.settings.maxWidth
      //   const compressedFile = await new Promise((resolve, reject) => {
      //     new Compressor(file, {
      //       maxWidth: maxWidth,
      //       success: resolve,
      //       error: reject,
      //     })
      //   })
      //   file = compressedFile as File
      // }

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

      await new FilenameInput(
        this.app,
        (result: string) => {
          this.filename = result;
          console.log(this.filename);
        },
        () => {
          file = null;
        }
      ).open();

      if (file) {
        new Notice(`Uploading file...}`);
        await imUploader.uploadFile(file, "images/" + this.filename);
      }

      // await imUploader.uploadFromMemory(bufferFile, this.filename).then((result) => {
      //   new Notice(`Upload result: ${result}`);
      // }, (error) => {
      //   console.log(error);
      //   new Notice(`Upload error: ${error}`);
      // });

      // axios.post(this.settings.apiEndpoint, formData, {
      //   "headers": JSON.parse(this.settings.uploadHeader)
      // }).then(res => {
      //   const url = objectPath.get(res.data, this.settings.imageUrlPath)
      //   const imgMarkdownText = `![](${url})`
      //   this.replaceText(editor, pastePlaceText, imgMarkdownText)
      // }, err => {
      //   new Notice('[Image Uploader] Upload unsuccessfully, fall back to default paste!', 5000)
      //   console.log(err)
      //   this.replaceText(editor, pastePlaceText, "");
      //   console.log(mkView.currentMode)
      //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //   // @ts-ignore
      //   mkView.currentMode.clipboardManager.handlePaste(
      //     new PasteEventCopy(ev)
      //   );
      // })
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
    await this.saveData(this.settings);
  }
}
