import { App, Modal, Setting } from "obsidian";
import { ImgFormat, ImageUploaderSettings } from "./main";

export class FilenameInput extends Modal {
    result: ImgFormat;
    settings: ImageUploaderSettings;
    isOpen: boolean;
    onSubmit: (result: object) => void;
    onExit: () => void;

    constructor(app: App, settings: ImageUploaderSettings, onSubmit: (result: ImgFormat) => void, onExit: () => void) {
        super(app);
        this.isOpen = false;
        this.settings = settings;
        this.onSubmit = onSubmit;
        this.onExit = onExit;
        this.result = {} as ImgFormat;
    }

    private async waitClose(): Promise<void> {
        return new Promise((resolve) => {
            this.onClose = () => {
                resolve();
                this.isOpen = false;
            };
        });
    }

    async open():Promise<void> {
        this.isOpen = true;
        await super.open();
        await this.waitClose();
    }

    onOpen(): void {
        const { contentEl } = this;
        

        contentEl.createEl("h3", { text: "Add Image details" });

        new Setting(contentEl)
            .setName("Filename")
            .setDesc("The filename of the image.")
            .addText((text) => {
                text.onChange((value) => {
                    this.result.filename = value;
                });
            });

        new Setting(contentEl)
            .setName("Img Height")
            .setDesc("The height of the image.")
            .addSlider((slider) => {
                slider
                    .setLimits(0, 1000, 10)
                    .setValue(
                        this.settings.img_height
                    )
                    .onChange((value) => {
                        this.result.height = value;
                        ;
                    })
                    .setDynamicTooltip()
                    .showTooltip()
                    ;
            })

        new Setting(contentEl)
            .setName("Img Width")
            .setDesc("The width of the image.")
            .addSlider((slider) => {
                slider
                    .setLimits(0, 1000, 10)
                    .setValue(
                        this.settings.img_width
                    )
                    .onChange((value) => {
                        this.result.width = value;
                    })
                    .setDynamicTooltip()
                    .showTooltip()
                    ;
            })

        new Setting(contentEl)
            .setName("Alt Caption")
            .setDesc("The alt caption of the image.")
            .addText((text) => {
                text.onChange((value) => {
                    this.result.altcaption = value;
                });
            });

        new Setting(contentEl)
            .addButton((button) => {
                button
                .setButtonText("Submit")
                .setCta()
                .onClick(() => {
                    this.onSubmit(this.result);
                    this.close();
                });
            });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}