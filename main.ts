import { Plugin, TFolder, Menu, Notice } from 'obsidian';

export default class FolderBaseCreatorPlugin extends Plugin {
	async onload() {
		console.log('Loading Folder Base Creator plugin');

		// Register event for folder context menu
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu: Menu, file) => {
				// Only show menu item if it's a folder
				if (file instanceof TFolder) {
					menu.addItem((item) => {
						item
							.setTitle('Create a base of folder')
							.setIcon('table')
							.onClick(async () => {
								await this.createBaseForFolder(file);
							});
					});
				}
			})
		);
	}

	async createBaseForFolder(folder: TFolder) {
		try {
			const folderPath = folder.path;
			const folderName = folder.name;

			// Create base file name
			const baseName = `${folderName}.base`;
			const basePath = `${folderPath}/${baseName}`;

			// Check if base file already exists
			const existingFile = this.app.vault.getAbstractFileByPath(basePath);
			if (existingFile) {
				new Notice(`Base file already exists: ${baseName}`);
				return;
			}

			// Create the base content with filters
			// Filter for current folder and md file type
			const baseContent = this.generateBaseContent(folderPath);

			// Create the base file
			await this.app.vault.create(basePath, baseContent);

			// Open the newly created base file
			const baseFile = this.app.vault.getAbstractFileByPath(basePath);
			if (baseFile) {
				await this.app.workspace.getLeaf().openFile(baseFile as any);
				new Notice(`Base created: ${baseName}`);
			}
		} catch (error) {
			console.error('Error creating base:', error);
			new Notice(`Failed to create base: ${error.message}`);
		}
	}

	generateBaseContent(folderPath: string): string {
		// Generate base content with filters (YAML format, Obsidian 1.9.2+ syntax)
		// Using file.inFolder(this.file.folder) for dynamic current folder filtering
		// and file.ext == "md" for markdown files only

		const baseContent = `filters:
  and:
    - file.inFolder(this.file.folder)
    - file.ext == "md"

properties:
  file.name:
    displayName: "Name"
  file.mtime:
    displayName: "Modified"

views:
  - type: table
    name: "Files in current folder"
    order:
      - file.name
`;

		return baseContent;
	}

	onunload() {
		console.log('Unloading Folder Base Creator plugin');
	}
}
