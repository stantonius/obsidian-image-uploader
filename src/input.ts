import { App, Modal, Setting } from "obsidian";

export class FilenameInput extends Modal {
    result: string;
    isOpen: boolean;
    onSubmit: (result: string) => void;
    onExit: () => void;

    constructor(app: App, onSubmit: (result: string) => void, onExit: () => void) {
        super(app);
        this.isOpen = false;
        this.onSubmit = onSubmit;
        this.onExit = onExit;
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
        

        contentEl.createEl("h3", { text: "Enter filename" });

        new Setting(contentEl)
            .setName("Filename")
            .addText((text) => {
                text.onChange((value) => {
                    this.result = value;
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